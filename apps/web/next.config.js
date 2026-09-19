/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output is needed for Docker container deployment (Oracle Cloud / self-hosting).
  // On Vercel, output: 'standalone' conflicts with Vercel's build adapter in Next.js 16.3,
  // causing 'ENOENT: no such file or directory, open .../next-server.js.nft.json'.
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
};

export default nextConfig;
