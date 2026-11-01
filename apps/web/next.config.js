/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output is needed for Docker container deployment (Oracle Cloud / self-hosting).
  // On Vercel, output: 'standalone' conflicts with Vercel's build adapter in Next.js 16.3,
  // causing 'ENOENT: no such file or directory, open .../next-server.js.nft.json'.
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
  allowedDevOrigins: [
    "192.168.1.13",
    "10.0.2.2",
    "localhost",
    "127.0.0.1",
    ...(process.env.ALLOWED_DEV_ORIGINS
      ? process.env.ALLOWED_DEV_ORIGINS.split(",").map((s) => s.trim())
      : []),
  ],
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "canvas-confetti",
      "@base-ui/react",
      "@nipponic/shared",
      "clsx",
      "tailwind-merge",
      "class-variance-authority",
      "next-themes",
    ],
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        source: "/dict/:all*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/fonts/:all*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
