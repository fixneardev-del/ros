import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

function supabasePattern() {
  if (!supabaseUrl) return null;

  try {
    const url = new URL(supabaseUrl);
    return {
      protocol: url.protocol.replace(":", "") as "http" | "https",
      hostname: url.hostname,
      port: url.port,
      pathname: "/storage/v1/object/public/**",
    };
  } catch {
    return null;
  }
}

const configuredPattern = supabasePattern();

/**
 * Security headers for every route.
 *
 * The content security policy allows inline scripts and styles because the
 * App Router ships the RSC payload inline and Tailwind injects styles at
 * runtime. Everything else is locked to this origin, plus the Supabase
 * project the site talks to.
 */
function securityHeaders(): Array<{ key: string; value: string }> {
  const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
    : "";

  const connectSources = ["'self'", ...(supabaseOrigin ? [supabaseOrigin] : [])];
  const imgSources = ["'self'", "data:", "blob:", "https:"];
  const fontSources = ["'self'", "data:"];

  const scriptSources = ["'self'", "'unsafe-inline'"];
  if (process.env.NODE_ENV !== "production") scriptSources.push("'unsafe-eval'");

  const csp = [
    "default-src 'self'",
    `script-src ${scriptSources.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imgSources.join(" ")}`,
    `font-src ${fontSources.join(" ")}`,
    `connect-src ${connectSources.join(" ")}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");

  return [
    { key: "Content-Security-Policy", value: csp },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=()",
    },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    {
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains",
    },
  ];
}

const nextConfig: NextConfig = {
  // The end-to-end suite builds into its own directory, so a test run never
  // overwrites the build a development server is using.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Lets admin routes answer a signed-in non-admin with a real 403 instead
    // of a redirect. See lib/permissions.ts.
    authInterrupts: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "54321",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "54321",
        pathname: "/storage/v1/object/public/**",
      },
      ...(configuredPattern ? [configuredPattern] : []),
    ],
  },
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders(),
      },
    ];
  },
};

export default nextConfig;
