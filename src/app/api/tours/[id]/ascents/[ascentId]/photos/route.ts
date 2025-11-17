import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseFormData, saveUploadedFile, isImageFile } from "@/lib/upload";

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

    // Parse multipart form data
    const { fields, files } = await parseFormData(request as any);

    const photoFiles = Array.isArray(files.photos)
      ? files.photos
      : [files.photos].filter(Boolean);

    if (photoFiles.length === 0) {
      return NextResponse.json(
        { error: "No photos uploaded" },
        { status: 400 }
      );
    }

    const uploadedPhotos = [];

    for (const file of photoFiles) {
      if (!file || !isImageFile(file)) {
        continue; // Skip non-image files
      }

      // Save photo to public/uploads
      const url = await saveUploadedFile(file, "uploads/photos");

      // Extract caption and geotags if provided
      const caption = Array.isArray(fields.caption)
        ? fields.caption[0]
        : fields.caption;
      const latitude = Array.isArray(fields.latitude)
        ? fields.latitude[0]
        : fields.latitude;
      const longitude = Array.isArray(fields.longitude)
        ? fields.longitude[0]
        : fields.longitude;

      // Create photo record
      const photo = await prisma.photo.create({
        data: {
          url,
          caption: caption || null,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          ascentId: params.ascentId,
        },
      });

      uploadedPhotos.push(photo);
    }

    return NextResponse.json({ photos: uploadedPhotos });
  } catch (error: any) {
    console.error("Error uploading photos:", error);
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
