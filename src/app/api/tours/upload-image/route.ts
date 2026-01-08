import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { put } from "@vercel/blob";
import path from "path";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("image");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No image uploaded" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    const extension = path.extname(file.name || "").toLowerCase();
    const safeBase = path
      .basename(file.name || "tour", extension)
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .slice(0, 80);
    const objectKey = `tours/${Date.now()}-${safeBase || "image"}${extension}`;

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      console.error("Blob upload failed: missing BLOB_READ_WRITE_TOKEN");
      return NextResponse.json(
        { error: "Blob storage not configured" },
        { status: 500 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const blob = await put(objectKey, buffer, {
      access: "public",
      contentType: file.type || undefined,
      token,
    });

    return NextResponse.json({ url: blob.url }, { status: 201 });
  } catch (error: any) {
    console.error("Error uploading tour image:", {
      message: error?.message,
      status: error?.status,
      responseStatus: error?.response?.status,
    });
    if (error?.status) {
      return NextResponse.json(
        { error: "Blob upload failed", status: error.status },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
