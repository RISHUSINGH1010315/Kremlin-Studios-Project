import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: isGithubPages ? "export" : undefined,
  basePath: isGithubPages ? "/Kremlin-Studios-Project" : undefined,
  images: {
    unoptimized: true,
  },
  ...(isGithubPages ? {} : {
    async headers() {
      return [
        {
          source: "/:path*",
          headers: [
            {
              key: "Content-Security-Policy",
              value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' http://localhost:5000 https: ws: wss:; frame-src 'self' https://www.google.com;"
            },
            {
              key: "X-Frame-Options",
              value: "DENY"
            },
            {
              key: "X-Content-Type-Options",
              value: "nosniff"
            },
            {
              key: "Referrer-Policy",
              value: "strict-origin-when-cross-origin"
            },
            {
              key: "X-XSS-Protection",
              value: "1; mode=block"
            }
          ]
        }
      ];
    }
  })
};

export default nextConfig;
