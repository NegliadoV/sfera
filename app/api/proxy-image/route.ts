import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_DOMAINS = [
  'cdn.telegram.org',
  't.me',
  'telegram.org',
  'telegram.me',
  'telegram.dog',
];

function isAllowedUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return ALLOWED_DOMAINS.some((d) => host === d || host.endsWith('.' + d));
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url || !isAllowedUrl(url)) {
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
      },
    });
  } catch (e) {
    console.error('[proxy-image]', url, e);
    return new NextResponse(null, { status: 502 });
  }
}
