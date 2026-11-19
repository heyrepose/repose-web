/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repose/ui", "@repose/api-types"],
  // Expose non-prefixed env keys to the client bundle (Vercel-friendly; no NEXT_PUBLIC_ required).
  env: {
    API_BASE_URL:
      process.env.API_BASE_URL ?? "http://localhost:4000/api/v1",
    SOCKET_URL: process.env.SOCKET_URL ?? "http://localhost:4000",
    SITE_URL: process.env.SITE_URL ?? "http://localhost:4001",
    // Public OAuth client id (not a secret). Blank = Google sign-in buttons are hidden.
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "",
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
