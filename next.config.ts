import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "utfs.io" },
    ],
  },
  serverExternalPackages: ["@prisma/client", "prisma"],
  env: {
    NEXT_PUBLIC_SHOP_NAME: process.env.NEXT_PUBLIC_SHOP_NAME,
    NEXT_PUBLIC_SHOP_ADDRESS: process.env.NEXT_PUBLIC_SHOP_ADDRESS,
    NEXT_PUBLIC_SHOP_PHONE: process.env.NEXT_PUBLIC_SHOP_PHONE,
    NEXT_PUBLIC_SHOP_GSTIN: process.env.NEXT_PUBLIC_SHOP_GSTIN,
    NEXT_PUBLIC_AI_ENABLED: process.env.ANTHROPIC_API_KEY ? "true" : "",
    NEXT_PUBLIC_REDIS_ENABLED: process.env.UPSTASH_REDIS_REST_URL ? "true" : "",
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  },
};

export default nextConfig;
