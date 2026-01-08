import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { put } from "@vercel/blob";
import path from "path";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; ascentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ascent exists and belongs to user
    const ascent = await prisma.ascent.findFirst({
      where: {
        id: params.ascentId,
        tourId: params.id,
        userId: session.user.id,
      },
    });

    if (!ascent) {
      return NextResponse.json({ error: "Ascent not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const photoFiles = formData
      .getAll("photos")
      .filter((f): f is File => f instanceof File);

    if (photoFiles.length === 0) {
      return NextResponse.json(
        { error: "No photos uploaded" },
        { status: 400 }
      );
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      console.error("Blob upload failed: missing BLOB_READ_WRITE_TOKEN");
      return NextResponse.json(
        { error: "Blob storage not configured" },
        { status: 500 }
      );
    }

    const captionField = formData.get("caption");
    const latitudeField = formData.get("latitude");
    const longitudeField = formData.get("longitude");

    const uploadedPhotos = [];

    for (const file of photoFiles) {
      if (!file.type.startsWith("image/")) {
        continue; // Skip non-image files
      }

      const extension = path.extname(file.name || "").toLowerCase();
      const safeBase = path
        .basename(file.name || "photo", extension)
        .replace(/[^a-zA-Z0-9_-]/g, "-")
        .slice(0, 80);
      const objectKey = `ascents/${params.ascentId}/${Date.now()}-${
        safeBase || "image"
      }${extension}`;

      const buffer = Buffer.from(await file.arrayBuffer());

      const blob = await put(objectKey, buffer, {
        access: "public",
        contentType: file.type || undefined,
        token,
      });

      const caption =
        typeof captionField === "string" && captionField.length > 0
          ? captionField
          : null;
      const latitude =
        typeof latitudeField === "string" && latitudeField.length > 0
          ? parseFloat(latitudeField)
          : null;
      const longitude =
        typeof longitudeField === "string" && longitudeField.length > 0
          ? parseFloat(longitudeField)
          : null;

      const photo = await prisma.photo.create({
        data: {
          url: blob.url,
          caption,
          latitude,
          longitude,
          ascentId: params.ascentId,
        },
      });

      uploadedPhotos.push(photo);
    }

    return NextResponse.json({ photos: uploadedPhotos });
  } catch (error: any) {
    console.error("Error uploading photos:", {
      message: error?.message,
      status: error?.status,
      response: error?.response,
    });
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; ascentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const photos = await prisma.photo.findMany({
      where: {
        ascent: {
          id: params.ascentId,
          tourId: params.id,
          userId: session.user.id,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(photos);
  } catch (error) {
    console.error("Error fetching photos:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
