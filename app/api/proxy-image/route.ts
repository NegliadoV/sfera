import { NextRequest, NextResponse } from 'next/server';

import { getSessionForRequest } from '@/lib/session';

const ALLOWED_DOMAINS = [
  'cdn.telegram.org',
  't.me',
  'telegram.org',
  'telegram.me',
  'telegram.dog',
  'googleusercontent.com',
  'yandex.net',
  'discordapp.com',
  'discord.com',
];

function isAllowedUrl(url: string, isAuthenticated: boolean): boolean {
  if (isAuthenticated) return true; // Разрешаем любые домены для картинок авторизованным (для MindMap и постов внутри COEP изолированных комнат)
  try {
    const host = new URL(url).hostname.toLowerCase();
    return ALLOWED_DOMAINS.some((d) => host === d || host.endsWith('.' + d));
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const session = await getSessionForRequest(req);
  const isAuthenticated = !!session?.user?.id;

  const url = req.nextUrl.searchParams.get('url');
  if (!url || !isAllowedUrl(url, isAuthenticated)) {
    return NextResponse.json({ error: 'Invalid or disallowed URL' }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Roominate/1.0',
        Referer: '',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return new NextResponse(null, { status: res.status === 404 ? 404 : 502 });
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const body = await res.arrayBuffer();

    return new NextResponse(body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    console.error('[proxy-image]', url, e);
    return new NextResponse(null, { status: 502 });
  }
}
