import { NextRequest, NextResponse } from 'next/server';

const PRODUCTION_ORIGIN = process.env.NEXT_PUBLIC_APP_URL || 'https://roominate.rest';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3002';
const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://localhost:7880';

const isProd = process.env.NODE_ENV === 'production';

function corsHeaders(origin: string | null): Record<string, string> {
  let isAllowed: boolean;
  if (isProd) {
    isAllowed = origin === PRODUCTION_ORIGIN;
  } else {
    isAllowed = !!origin && /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$/.test(origin);
  }
  const allowOrigin = isAllowed && origin ? origin : (isProd ? PRODUCTION_ORIGIN : 'http://localhost:8081');

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie, x-csrf-token',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Строит Content-Security-Policy.
 * В dev — более мягкий (разрешён 'unsafe-eval' для HMR и всё localhost).
 * В production — строгий.
 */
function buildCSP(): string {
  const wsOrigin = WS_URL.replace(/^http/, 'ws').replace(/^https/, 'wss');
  const lkOrigin = LIVEKIT_URL.replace(/^http/, 'ws').replace(/^https/, 'wss');
  // LiveKit API (HTTP)
  const lkHttp = LIVEKIT_URL.replace(/^wss?:/, isProd ? 'https:' : 'http:');

  const self = "'self'";
  const unsafeInline = "'unsafe-inline'";
  const unsafeEval = "'unsafe-eval'";

  // CDN для Font Awesome и Cloudflare
  const cdnjs = 'https://cdnjs.cloudflare.com';
  // Google Fonts
  const gfonts = 'https://fonts.googleapis.com https://fonts.gstatic.com';

  const directives: Record<string, string> = {
    'default-src': self,

    // Скрипты: self + inline (inline нужен для Next.js hydration-скриптов в layout.tsx)
    'script-src': [self, unsafeInline, ...(isProd ? [] : [unsafeEval])].join(' '),

    // Стили: self + inline (Tailwind, CSS-in-JS) + CDN (Font Awesome)
    'style-src': [self, unsafeInline, cdnjs].join(' '),

    // Шрифты: self + Google Fonts + Font Awesome CDN
    'font-src': [self, gfonts, cdnjs].join(' '),

    // Изображения: self + blob (канвас) + data (base64) + HTTPS (прокси изображений)
    'img-src': [self, 'blob:', 'data:', 'https:'].join(' '),

    // Медиа: self + blob (WebRTC)
    'media-src': [self, 'blob:'].join(' '),

    // Воркеры: self + blob (Service Worker / Serwist)
    'worker-src': [self, 'blob:'].join(' '),

    // Фреймы: запрещены полностью
    'frame-src': "'none'",

    // WebSocket-соединения: WS-сервер + LiveKit
    'connect-src': [
      self,
      wsOrigin,
      lkOrigin,
      lkHttp,
      // В dev — все локальные порты
      ...(isProd ? [] : ['ws://localhost:*', 'http://localhost:*', 'ws://127.0.0.1:*']),
    ].join(' '),

    // Запрет встраивания этой страницы в iframe на других сайтах
    'frame-ancestors': "'none'",
  };

  return Object.entries(directives)
    .map(([key, val]) => `${key} ${val}`)
    .join('; ');
}

/** Security headers applied to all matched responses */
const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-DNS-Prefetch-Control': 'on',
  'Permissions-Policy': 'camera=(), microphone=(self), geolocation=()',
  // HSTS: принудительный HTTPS на 1 год (только в production)
  ...(isProd ? { 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains' } : {}),
};

export function middleware(req: NextRequest) {
  const origin = req.headers.get('origin');
  const headers = { ...corsHeaders(origin), ...SECURITY_HEADERS };

  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers });
  }

  const res = NextResponse.next();

  // CSP применяем только к HTML-страницам (не к API), поэтому matcher настроен на /api/*,
  // но CSP добавляем сюда для единого места управления заголовками.
  // Для страниц CSP добавляется через next.config.ts headers().
  Object.entries(headers).forEach(([key, value]) => {
    res.headers.set(key, value);
  });

  return res;
}

export const config = {
  matcher: '/api/:path*',
};
