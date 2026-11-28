/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repose/ui", "@repose/api-types"],
  // Required for Docker prod image (copies only what's needed to run)
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  // Expose non-prefixed env keys to the client bundle (Vercel-friendly; no NEXT_PUBLIC_ required).
  //
  // Docker split-URL strategy
  // ─────────────────────────
  // Inside Docker there are two distinct callers of the API:
  //   1. Browser (client components, apiFetch)  — runs on the HOST machine,
  //      cannot reach Docker-internal hostnames like "api". Must use a URL
  //      the host can reach: either localhost:4000 directly, or a relative
  //      path that Next.js proxies via the rewrites below.
  //   2. Next.js server (serverFetch, RSC, sitemap) — runs INSIDE the web
  //      container, can reach "api:4000" over the Docker bridge network.
  //
  // Solution: set API_BASE_URL to the proxy path "/proxy/api/v1" so both
  // callers use the same variable. The rewrite rule below forwards those
  // requests from the Next.js server to the real API container.
  // INTERNAL_API_URL is used by the rewrite destination only.
  env: {
    API_BASE_URL:
      process.env.API_BASE_URL ?? "http://localhost:4000/api/v1",
    SOCKET_URL: process.env.SOCKET_URL ?? "http://localhost:4000",
    SITE_URL: process.env.SITE_URL ?? "http://localhost:4001",
    // Public OAuth client id (not a secret). Blank = Google sign-in buttons are hidden.
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "",
  },
  // Proxy /proxy/api/v1/* → real API (used in Docker where INTERNAL_API_URL is set).
  // In non-Docker environments INTERNAL_API_URL is unset and this rewrite is a no-op.
  async rewrites() {
    const internalApi = process.env.INTERNAL_API_URL;
    if (!internalApi) return [];
    return [
      {
        source: "/proxy/api/v1/:path*",
        destination: `${internalApi}/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      // Google profile pictures (set on first Google sign-in).
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
  // bottom-left; CSS in globals offsets it above the mobile bottom nav so it stays visible
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: "bottom-left",
  },
};

export default nextConfig;
