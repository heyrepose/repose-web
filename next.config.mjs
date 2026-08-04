/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repose/ui", "@repose/api-types"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
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
