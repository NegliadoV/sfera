import { NextRequest, NextResponse } from 'next/server';
import { getSessionForRequest } from '@/lib/session';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { db, user } from '@/lib/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export async function POST(req: NextRequest) {
  const session = await getSessionForRequest(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const mime = file.type;
    if (!ALLOWED_IMAGE.includes(mime)) {
      return NextResponse.json({ error: 'Invalid file type. Only jpeg, png, gif, webp are allowed' }, { status: 400 });
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: 'File too large. Max 10 MB' }, { status: 400 });
    }

    let ext = mime === 'image/jpeg' ? 'jpg' : mime.replace('image/', '');
    if (ext === 'jpeg') ext = 'jpg';

    const dir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    await mkdir(dir, { recursive: true });
    
    // Create new filename
    const filename = `avatar-${session.user.id}-${Date.now()}.${ext}`;
    const filepath = path.join(dir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    const imageUrl = `/uploads/avatars/${filename}`;

    // Update in DB
    await db.update(user)
      .set({ image: imageUrl })
      .where(eq(user.id, session.user.id));

    return NextResponse.json({ imageUrl });
  } catch (e) {
    console.error('POST /api/me/profile/avatar error', e);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
