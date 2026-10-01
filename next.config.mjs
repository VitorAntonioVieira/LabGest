/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/workspaces/:id/kanban",
        destination: "/workspace/:id/kanban",
      },
      {
        source: "/workspaces/:id/docs",
        destination: "/workspace/:id/docs",
      },
    ];
  },
};

export default nextConfig;
