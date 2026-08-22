import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.firebaseapp.com" },
      { protocol: "https", hostname: "**.firebaseio.com" },
      { protocol: "https", hostname: "**.firebasestorage.app" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
