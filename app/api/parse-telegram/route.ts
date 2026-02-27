import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const TELEGRAM_URL_REGEX = /^https?:\/\/(www\.)?(t\.me|telegram\.me|telegram\.dog)\/.+$/i;

function extractOgMeta(html: string): { title?: string; description?: string } {
  const result: { title?: string; description?: string } = {};
  const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
  if (ogTitle) result.title = ogTitle[1].trim();
  const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i);
  if (ogDesc) result.description = ogDesc[1].trim();
  return result;
}

/** Извлекаем имя канала/поста из URL для подписи, если нет og:title */
function titleFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/^\/+/, '').replace(/\/+$/, '');
    if (!path) return 'Telegram';
    const parts = path.split('/');
    const channel = parts[0] || 'channel';
    if (parts.length > 1) return `Telegram: ${channel} — пост`;
    return `Telegram: ${channel}`;
  } catch {
    return 'Telegram';
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawUrl = typeof body?.url === 'string' ? body.url.trim() : '';
    if (!rawUrl) {
      return NextResponse.json({ error: 'url required' }, { status: 400 });
    }
    let url = rawUrl;
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    if (!TELEGRAM_URL_REGEX.test(url)) {
      return NextResponse.json({ error: 'Invalid Telegram URL. Use t.me/... or telegram.me/...' }, { status: 400 });
    }

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });

    const html = await res.text();
    const { title: ogTitle, description: ogDesc } = extractOgMeta(html);

    const title = ogTitle || titleFromUrl(url);
    const description = ogDesc || undefined;

    return NextResponse.json({ title, description, url: res.url || url });
  } catch (e) {
    console.error('POST /api/parse-telegram', e);
    return NextResponse.json(
      { error: 'Не удалось загрузить данные. Проверьте ссылку или попробуйте позже.' },
      { status: 500 }
    );
  }
}
