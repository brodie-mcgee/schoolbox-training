import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow iframe embedding from Schoolbox
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "ALLOWALL",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' *.schoolbox.com.au *.schoolbox.education schoolbox.scr.vic.edu.au *.scr.vic.edu.au",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
