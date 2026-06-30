import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "meteo.leswww.com" }],
        destination: "https://www.cestchaud.fr/:path*",
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
