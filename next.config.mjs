/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep the Anthropic SDK on the server only; it must never enter a client bundle.
  // (Belt-and-suspenders — the client engine no longer imports it at all.)
  experimental: {
    serverComponentsExternalPackages: ["@anthropic-ai/sdk"],
  },
};

export default nextConfig;
