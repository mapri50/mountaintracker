import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { put } from "@vercel/blob";
import path from "path";
import fs from "fs";
import { authOptions } from "@/lib/auth";
import { parseFormData, isImageFile } from "@/lib/upload";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { files } = await parseFormData(request as any);
    const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;

    if (!imageFile) {
      return NextResponse.json({ error: "No image uploaded" }, { status: 400 });
    }

    if (!isImageFile(imageFile)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    const extension = path
      .extname(imageFile.originalFilename || "")
      .toLowerCase();
    const safeBase = path
      .basename(imageFile.originalFilename || "tour", extension)
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .slice(0, 80);
    const objectKey = `tours/${Date.now()}-${safeBase || "image"}${extension}`;

    const readStream = fs.createReadStream(imageFile.filepath);

    const blob = await put(objectKey, readStream, {
      access: "public",
      contentType: imageFile.mimetype || undefined,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return NextResponse.json({ url: blob.url }, { status: 201 });
  } catch (error: any) {
    console.error("Error uploading tour image:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
