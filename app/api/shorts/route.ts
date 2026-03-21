import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { shorts, user } from "@/lib/db/schema";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { eq, desc, isNull } from "drizzle-orm";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("video") as File | null;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;
    const universeId = formData.get("universeId") as string | null;

    if (!file || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadDir = join(process.cwd(), "public", "uploads", "shorts");
    await mkdir(uploadDir, { recursive: true });

    const ext = file.name.split('.').pop() || 'mp4';
    const filename = `${crypto.randomUUID()}.${ext}`;
    const filePath = join(uploadDir, filename);

    await writeFile(filePath, buffer);
    const videoUrl = `/uploads/shorts/${filename}`;

    const [newShort] = await db.insert(shorts).values({
      authorId: session.user.id,
      title,
      description: description || null,
      videoUrl,
      universeId: universeId || null,
    }).returning();

    return NextResponse.json({ short: newShort });
  } catch (error) {
    console.error("Error uploading short:", error);
    return NextResponse.json({ error: "Failed to upload short" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const universeId = searchParams.get('universeId');

    const feed = await db
      .select({
        id: shorts.id,
        title: shorts.title,
        description: shorts.description,
        videoUrl: shorts.videoUrl,
        viewsCount: shorts.viewsCount,
        likesCount: shorts.likesCount,
        universeId: shorts.universeId,
        createdAt: shorts.createdAt,
        author: {
          id: user.id,
          name: user.name,
          image: user.image,
          userTag: user.userTag,
        }
      })
      .from(shorts)
      .innerJoin(user, eq(shorts.authorId, user.id))
      .where(universeId ? eq(shorts.universeId, universeId) : undefined)
      .orderBy(desc(shorts.createdAt))
      .limit(20);

    return NextResponse.json({ shorts: feed });
  } catch (error) {
    console.error("Error fetching shorts feed:", error);
    return NextResponse.json({ error: "Failed to fetch shorts" }, { status: 500 });
  }
}
