/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output is needed for Docker container deployment (Oracle Cloud / self-hosting).
  // On Vercel, output: 'standalone' conflicts with Vercel's build adapter in Next.js 16.3,
  // causing 'ENOENT: no such file or directory, open .../next-server.js.nft.json'.
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
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
    ];
  },
};

export default nextConfig;
