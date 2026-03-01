import { NextRequest, NextResponse } from 'next/server';

const CORS_ORIGINS = [
  'http://localhost:8081', // Expo web
  'http://localhost:19006', // Expo web (alternate)
  'http://127.0.0.1:8081',
  'http://127.0.0.1:19006',
];

function corsHeaders(origin: string | null): Record<string, string> {
  const allowOrigin =
    origin && CORS_ORIGINS.includes(origin) ? origin : CORS_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export function middleware(req: NextRequest) {
  const origin = req.headers.get('origin');
  const headers = corsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers });
  }

  const res = NextResponse.next();
  Object.entries(headers).forEach(([key, value]) => {
    res.headers.set(key, value);
  });
  return res;
}

export const config = {
  matcher: '/api/:path*',
};
