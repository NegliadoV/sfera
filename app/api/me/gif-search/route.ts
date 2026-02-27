import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

/** GET /api/me/gif-search?q=... — поиск GIF через GIPHY */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const key = process.env.GIPHY_API_KEY;
  if (!key) {
    return NextResponse.json({ gifs: [], configured: false });
  }

  const q = req.nextUrl.searchParams.get('q')?.trim().slice(0, 100) ?? '';
  if (!q) {
    return NextResponse.json({ gifs: [], configured: !!key });
  }

  try {
    const url = new URL('https://api.giphy.com/v1/gifs/search');
    url.searchParams.set('api_key', key);
    url.searchParams.set('q', q);
    url.searchParams.set('limit', '20');
    url.searchParams.set('rating', 'g');

    const res = await fetch(url.toString());
    if (!res.ok) {
      console.warn('[gif-search] GIPHY error:', res.status);
      return NextResponse.json({ gifs: [], configured: true });
    }

    const data = (await res.json()) as {
      data?: Array<{
        id: string;
        images?: {
          fixed_height?: { url?: string };
          fixed_height_small?: { url?: string };
          original?: { url?: string };
        };
      }>;
    };

    const items = (data.data ?? [])
      .map((g) => {
        const url =
          g.images?.fixed_height?.url ??
          g.images?.fixed_height_small?.url ??
          g.images?.original?.url ??
          null;
        return url ? { id: g.id, url } : null;
      })
      .filter(Boolean) as { id: string; url: string }[];

    return NextResponse.json({ gifs: items, configured: true });
  } catch (e) {
    console.error('[gif-search]', e);
    return NextResponse.json({ gifs: [], configured: true });
  }
}
