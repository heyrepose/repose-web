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
};

export default nextConfig;
