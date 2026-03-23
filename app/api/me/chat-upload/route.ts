import { NextRequest, NextResponse } from 'next/server';
import { getSessionForRequest } from '@/lib/session';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_IMAGE_VIDEO_SIZE = 16 * 1024 * 1024; // 16 MB для медиа

const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO = ['video/mp4', 'video/webm', 'video/quicktime'];
const ALLOWED_AUDIO = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/mp3', 'audio/wav'];
const ALLOWED_ARCHIVE = [
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/vnd.rar',
  'application/x-7z-compressed',
  'application/gzip',
  'application/x-gzip',
  'application/x-tar',
];
const ALLOWED_DOC = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];

const BLOCKED_EXT = new Set(['.exe', '.bat', '.cmd', '.sh', '.vbs', '.js', '.msi', '.dll', '.scr', '.pif', '.com']);

function getExtFromName(name: string): string {
  const ext = path.extname(name || '').toLowerCase();
  return ext || '';
}

function getExtForMime(mime: string, name: string): string {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime.startsWith('image/')) return mime.replace('image/', '');
  if (mime === 'video/quicktime') return 'mov';
  if (mime.startsWith('video/')) return mime.replace('video/', '');
  if (mime === 'audio/webm') return 'webm';
  if (mime === 'audio/ogg') return 'ogg';
  if (mime === 'audio/mp4' || mime === 'audio/mp3') return 'mp3';
  if (mime === 'audio/mpeg') return 'mp3';
  if (mime === 'audio/wav') return 'wav';
  if (mime === 'application/pdf') return 'pdf';
  if (mime === 'application/zip' || mime === 'application/x-zip-compressed') return 'zip';
  if (mime.includes('rar')) return 'rar';
  if (mime.includes('7z')) return '7z';
  if (mime.includes('gzip') || mime === 'application/gzip') return 'gz';
  if (mime.includes('tar')) return 'tar';
  if (mime.includes('word') || mime === 'application/msword') return name?.endsWith('.docx') ? 'docx' : 'doc';
  if (mime.includes('excel') || mime.includes('spreadsheet')) return name?.endsWith('.xlsx') ? 'xlsx' : 'xls';
  if (mime === 'text/plain') return 'txt';
  if (mime === 'text/csv') return 'csv';
  const fromName = getExtFromName(name);
  if (fromName && !BLOCKED_EXT.has(fromName)) return fromName.slice(1);
  return 'bin';
}

/** POST /api/me/chat-upload — загрузка файлов для чата (изображения, видео, архивы, документы) */
export async function POST(req: NextRequest) {
  const session = await getSessionForRequest(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = (formData as unknown as { get: (name: string) => unknown }).get('file') as File | null;
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const mime = file.type;
    const name = file.name || '';
    const extFromName = getExtFromName(name);
    if (extFromName && BLOCKED_EXT.has(extFromName)) {
      return NextResponse.json(
        { error: 'This file type is not allowed for security reasons' },
        { status: 400 }
      );
    }

    let ext = '';
    let attachmentType: 'image' | 'video' | 'audio' | 'file';

    if (ALLOWED_IMAGE.includes(mime)) {
      attachmentType = 'image';
      ext = mime === 'image/jpeg' ? 'jpg' : mime.replace('image/', '');
    } else if (ALLOWED_VIDEO.includes(mime) || mime.startsWith('video/webm')) {
      attachmentType = 'video';
      ext = mime === 'video/quicktime' ? 'mov' : mime.includes('webm') ? 'webm' : mime.replace('video/', '');
    } else if (ALLOWED_AUDIO.includes(mime) || mime.startsWith('audio/webm')) {
      attachmentType = 'audio';
      ext = 'webm';
    } else if (ALLOWED_ARCHIVE.includes(mime) || ALLOWED_DOC.includes(mime)) {
      attachmentType = 'file';
      ext = getExtForMime(mime, name);
    } else if (mime === 'application/octet-stream' || !mime || mime.startsWith('application/') || mime.startsWith('text/')) {
      if (extFromName && !BLOCKED_EXT.has(extFromName)) {
        attachmentType = 'file';
        ext = extFromName.slice(1);
      } else if (!extFromName) {
        return NextResponse.json(
          { error: 'File type not recognized' },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { error: 'This file type is not allowed' },
          { status: 400 }
        );
      }
    } else if (extFromName && !BLOCKED_EXT.has(extFromName)) {
      attachmentType = 'file';
      ext = extFromName.slice(1);
    } else {
      return NextResponse.json(
        { error: 'File type not allowed' },
        { status: 400 }
      );
    }

    const maxSize = attachmentType === 'file' ? MAX_FILE_SIZE : attachmentType === 'audio' ? 10 * 1024 * 1024 : MAX_IMAGE_VIDEO_SIZE;
    if (file.size > maxSize) {
      const limitMsg = attachmentType === 'file' ? '50 MB' : attachmentType === 'audio' ? '10 MB' : '16 MB';
      return NextResponse.json(
        { error: `File too large. Max ${limitMsg}` },
        { status: 400 }
      );
    }

    const dir = path.join(process.cwd(), 'public', 'chat-uploads');
    await mkdir(dir, { recursive: true });
    const filename = `${randomUUID()}.${ext}`;
    const filepath = path.join(dir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    const url = `/chat-uploads/${filename}`;
    return NextResponse.json({ url, type: attachmentType, filename: name || filename });
  } catch (e) {
    console.error('POST /api/me/chat-upload', e);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
