/**
 * Local Supabase API gateway.
 *
 * A hosted Supabase project puts Kong in front of GoTrue and PostgREST and
 * serves both from one URL. Docker is not available here, so this script does
 * the same job with a small reverse proxy:
 *
 *   /auth/v1/*  ->  GoTrue
 *   /rest/v1/*  ->  PostgREST
 *   /storage/v1/* -> PostgREST's storage endpoint, if it is running
 *
 * The app then uses a single NEXT_PUBLIC_SUPABASE_URL, exactly as it does in
 * production, with no conditional code in the product.
 *
 * Usage: node scripts/local-supabase-gateway.mjs
 */

import http from "node:http";

const PORT = Number(process.env.GATEWAY_PORT || 54321);
const AUTH_URL = process.env.AUTH_URL || "http://127.0.0.1:9999";
const REST_URL = process.env.REST_URL || "http://127.0.0.1:54322";

const routes = [
  { prefix: "/auth/v1", target: AUTH_URL },
  { prefix: "/rest/v1", target: REST_URL },
  { prefix: "/storage/v1", target: REST_URL },
];

/**
 * Resolves the upstream for a path and strips the prefix, the way Supabase's
 * Kong does: `/auth/v1/token` reaches GoTrue as `/token`, and
 * `/rest/v1/service_categories` reaches PostgREST as `/service_categories`.
 */
function resolveTarget(pathname) {
  const route = routes.find((entry) => pathname.startsWith(entry.prefix));
  if (!route) return { base: REST_URL, path: pathname };

  return {
    base: route.target,
    path: pathname.slice(route.prefix.length) || "/",
  };
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const { base, path } = resolveTarget(requestUrl.pathname);
  const target = new URL(base);

  const headers = { ...request.headers };
  delete headers.host;
  delete headers["content-length"];

  const body = ["GET", "HEAD"].includes(request.method)
    ? undefined
    : await new Promise((resolve, reject) => {
        const chunks = [];
        request.on("data", (chunk) => chunks.push(chunk));
        request.on("end", () => resolve(Buffer.concat(chunks)));
        request.on("error", reject);
      });

  try {
    const upstream = await fetch(target.origin + path + requestUrl.search, {
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
