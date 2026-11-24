/**
 * Local Supabase API gateway.
 *
 * A hosted Supabase project puts Kong in front of GoTrue, PostgREST and
 * Storage and serves all three from one URL. Docker is not available here, so
 * this script does the same job with a small reverse proxy:
 *
 *   /auth/v1/*     ->  GoTrue
 *   /rest/v1/*     ->  PostgREST
 *   /storage/v1/*  ->  a minimal file-backed Storage API
 *
 * The app then uses a single NEXT_PUBLIC_SUPABASE_URL, exactly as it does in
 * production, with no conditional code in the product.
 *
 * Usage: node scripts/local-supabase-gateway.mjs
 */

import http from "node:http";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const PORT = Number(process.env.GATEWAY_PORT || 54321);
const AUTH_URL = process.env.AUTH_URL || "http://127.0.0.1:9999";
const REST_URL = process.env.REST_URL || "http://127.0.0.1:54322";
const STORAGE_ROOT = path.resolve(
  process.env.STORAGE_ROOT || path.join(os.tmpdir(), "ros-local-storage"),
);

const routes = [
  { prefix: "/auth/v1", target: AUTH_URL },
  { prefix: "/rest/v1", target: REST_URL },
];

function resolveTarget(pathname) {
  const route = routes.find((entry) => pathname.startsWith(entry.prefix));
  if (!route) return { base: REST_URL, path: pathname };

  return {
    base: route.target,
    path: pathname.slice(route.prefix.length) || "/",
  };
}

function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(payload));
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function storagePath(bucket, rawObjectPath) {
  if (!/^[A-Za-z0-9_-]+$/.test(bucket)) {
    throw new Error("Invalid bucket name.");
  }

  let objectPath;
  try {
    objectPath = decodeURIComponent(rawObjectPath);
  } catch {
    throw new Error("Invalid object path.");
  }

  const normalized = path.normalize(objectPath).replace(/^([/\\]|\.\.[/\\])+/, "");
  if (
    !normalized ||
    normalized === "." ||
    normalized.startsWith("..") ||
    normalized.includes(`..${path.sep}`) ||
    path.isAbsolute(normalized)
  ) {
    throw new Error("Invalid object path.");
  }

  return path.join(STORAGE_ROOT, bucket, normalized);
}

/** Extracts the file part from a supabase-js multipart upload. */
function multipartFile(body, contentType) {
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!boundaryMatch) return null;

  const boundary = `--${(boundaryMatch[1] ?? boundaryMatch[2]).trim()}`;
  const text = body.toString("latin1");
  const marker = `${boundary}\r\n`;
  let cursor = text.indexOf(marker);

  while (cursor >= 0) {
    const headerEnd = text.indexOf("\r\n\r\n", cursor + marker.length);
    if (headerEnd < 0) return null;

    const headers = text.slice(cursor + marker.length, headerEnd);
    const dataStart = headerEnd + 4;
    const end = text.indexOf(`\r\n${boundary}`, dataStart);
    if (end < 0) return null;

    const typeMatch = headers.match(/Content-Type:\s*([^\r\n]+)/i);
    if (typeMatch && /filename=/i.test(headers)) {
      return {
        data: body.subarray(dataStart, end),
        contentType: typeMatch[1].trim(),
      };
    }

    cursor = text.indexOf(marker, end);
  }

  return null;
}

async function handleStorage(request, response, pathname) {
  const publicMatch = pathname.match(
    /^\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/,
  );
  if (publicMatch) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      sendJson(response, 405, { message: "Method not allowed." });
      return true;
    }

    let file;
    try {
      file = storagePath(publicMatch[1], publicMatch[2]);
    } catch (error) {
      sendJson(response, 400, { message: error.message });
      return true;
    }

    try {
      const data = await fs.readFile(file);
      const contentType = await fs
        .readFile(`${file}.content-type`, "utf8")
        .catch(() => "application/octet-stream");
      response.writeHead(200, {
        "Content-Type": contentType.trim() || "application/octet-stream",
        "Cache-Control": "public, max-age=3600",
      });
      response.end(request.method === "HEAD" ? undefined : data);
    } catch {
      sendJson(response, 404, { message: "The requested object was not found." });
    }
    return true;
  }

  const objectMatch = pathname.match(/^\/storage\/v1\/object\/([^/]+)(?:\/(.*))?$/);
  if (!objectMatch) return false;

  const bucket = objectMatch[1];
  const objectPath = objectMatch[2] || "";

  if ((request.method === "POST" || request.method === "PUT") && objectPath) {
    let file;
    try {
      file = storagePath(bucket, objectPath);
    } catch (error) {
      sendJson(response, 400, { message: error.message });
      return true;
    }

    try {
      await fs.mkdir(path.dirname(file), { recursive: true });
      const body = await readBody(request);
      const requestType = request.headers["content-type"] || "";
      let storedBody = body;
      let objectType = requestType || "application/octet-stream";

      // supabase-js sends File/Blob uploads as multipart bodies. Store only
      // the file part, with its own MIME type, just like real Storage does.
      if (/^multipart\/form-data/i.test(requestType)) {
        const part = multipartFile(body, requestType);
        if (part) {
          storedBody = part.data;
          objectType = part.contentType;
        }
      }

      await fs.writeFile(file, storedBody);
      await fs.writeFile(`${file}.content-type`, objectType);
      sendJson(response, 200, { Key: objectPath });
    } catch (error) {
      sendJson(response, 500, { message: String(error) });
    }
    return true;
  }

  if (request.method === "DELETE" && !objectPath) {
    let prefixes;
    try {
      const body = JSON.parse((await readBody(request)).toString("utf8") || "{}");
      prefixes = Array.isArray(body.prefixes) ? body.prefixes : [];
    } catch {
      sendJson(response, 400, { message: "Invalid delete payload." });
      return true;
    }

    const removed = [];
    try {
      for (const prefix of prefixes) {
        const file = storagePath(bucket, prefix);
        await fs.unlink(file).catch(() => {});
        await fs.unlink(`${file}.content-type`).catch(() => {});
        removed.push({ name: prefix });
      }
    } catch (error) {
      sendJson(response, 400, { message: error.message });
      return true;
    }

    sendJson(response, 200, removed);
    return true;
  }

  sendJson(response, 405, { message: "Method not allowed." });
  return true;
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);

  if (requestUrl.pathname.startsWith("/storage/v1/")) {
    const handled = await handleStorage(request, response, requestUrl.pathname);
    if (handled) return;
  }

  const { base, path: upstreamPath } = resolveTarget(requestUrl.pathname);
  const target = new URL(base);

  const headers = { ...request.headers };
  delete headers.host;
  delete headers["content-length"];

  const body = ["GET", "HEAD"].includes(request.method)
    ? undefined
    : await readBody(request);

  try {
    const upstream = await fetch(target.origin + upstreamPath + requestUrl.search, {
      method: request.method,
      headers,
      body,
      redirect: "manual",
    });

    const responseHeaders = {};
    upstream.headers.forEach((value, key) => {
      if (key !== "content-encoding" && key !== "transfer-encoding") {
        responseHeaders[key] = value;
      }
    });

    response.writeHead(upstream.status, responseHeaders);
    response.end(Buffer.from(await upstream.arrayBuffer()));
  } catch (error) {
    response.writeHead(502, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ message: String(error) }));
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`The local Supabase gateway is running on http://127.0.0.1:${PORT}`);
});
