import { NextRequest, NextResponse } from 'next/server';

function corsHeaders(origin: string | null): Record<string, string> {
  // Allow localhost, 127.0.0.1 and 192.168.* boundaries for Expo Web local development
  const isAllowed = origin && /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$/.test(origin);
  const allowOrigin = isAllowed ? origin : 'http://localhost:8081';

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie, x-csrf-token',
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
