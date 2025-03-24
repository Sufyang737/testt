/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  env: {
    NEXT_PUBLIC_RESEND_API_KEY:"re_9Y9fkHe2_JWQmKWwQSKscXXp613wYVgw1",
    NEXT_PUBLIC_RESEND_API_KEY:"re_j1Er72UG_FGggaZN1rxjqQPaHmDzW2mhD",
    MAILCHIMP_AUDIENCE_ID:"8d4ade44e8",
    MAILCHIMP_API_KEY:"dfce605e40a539df2ab81455c338e460-us17",
    MAILCHIMP_SERVER_PREFIX:"us17",
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  }
};

module.exports = nextConfig;