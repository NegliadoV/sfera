import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const isProd = process.env.NODE_ENV === "production";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3002";
const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://localhost:7880";

/** CSP для HTML-страниц (применяется через next.config headers, не middleware) */
function buildPageCSP(): string {
  const wsOrigin = WS_URL.replace(/^http/, "ws").replace(/^https/, "wss");
  const lkOrigin = LIVEKIT_URL.replace(/^http/, "ws").replace(/^https/, "wss");
  const lkHttp = LIVEKIT_URL.replace(/^wss?:/, isProd ? "https:" : "http:");

  const directives: Record<string, string> = {
    "default-src": "'self'",
    // 'unsafe-inline' нужен для hydration-скриптов Next.js и ThemeProvider
    "script-src": ["'self'", "'unsafe-inline'", ...(!isProd ? ["'unsafe-eval'"] : [])].join(" "),
    // Font Awesome (cdnjs), inline стили Tailwind
    "style-src": ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"].join(" "),
    "font-src": ["'self'", "https://fonts.googleapis.com", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"].join(" "),
    // blob: для canvas/ReactFlow, data: для base64 превью, https: для прокси изображений
    "img-src": ["'self'", "blob:", "data:", "https:"].join(" "),
    // blob: для WebRTC media streams
    "media-src": ["'self'", "blob:"].join(" "),
    // blob: для Service Worker (Serwist PWA)
    "worker-src": ["'self'", "blob:"].join(" "),
    "frame-src": ["'self'", "https://www.youtube.com", "https://youtube.com", "https://www.youtube-nocookie.com", "https://player.vimeo.com", "https://*.youtube.com", "https://*.vimeo.com"].join(" "),
    "connect-src": [
      "'self'",
      wsOrigin,
      lkOrigin,
      lkHttp,
      ...(!isProd ? ["ws://localhost:*", "http://localhost:*", "ws://127.0.0.1:*"] : []),
    ].join(" "),
    "frame-ancestors": "'none'",
  };

  return Object.entries(directives)
    .map(([k, v]) => `${k} ${v}`)
    .join("; ");
}

const nextConfig: NextConfig = {
  // Skip type checking during build — runs separately in CI / saves RAM on low-memory servers
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  async headers() {
    return [
      // ── CSP для всех страниц (кроме /api) ────────────────────────────────
      {
        source: "/((?!api).*)",
        headers: [
          { key: "Content-Security-Policy", value: buildPageCSP() },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          ...(isProd
            ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
            : []),
        ],
      },
      // ── CORS для API ──────────────────────────────────────────────────────
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          {
            key: "Access-Control-Allow-Origin",
            value: isProd
              ? (process.env.NEXT_PUBLIC_APP_URL || "https://roominate.rest")
              : "http://localhost:8081",
          },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          {
            key: "Access-Control-Allow-Headers",
            value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Cookie, Authorization",
          },
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);
