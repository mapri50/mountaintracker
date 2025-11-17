import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseFormData, readFileContent, isTrackFile } from "@/lib/upload";
import { parseTrackFile } from "@/services/gpx";
import { updateUserStats } from "@/lib/stats";

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
    const { files } = await parseFormData(request as any);

    const gpxFile = Array.isArray(files.gpx) ? files.gpx[0] : files.gpx;

    if (!gpxFile) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!isTrackFile(gpxFile)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a GPX or TCX file." },
        { status: 400 }
      );
    }

    // Read and parse GPX file
    const content = await readFileContent(gpxFile);
    const gpxData = await parseTrackFile(
      content,
      gpxFile.originalFilename || "track.gpx"
    );

    // Update ascent with GPX stats and create track points
    const updatedAscent = await prisma.ascent.update({
      where: { id: params.ascentId },
      data: {
        distance: gpxData.distance,
        elevationGain: gpxData.elevationGain,
        elevationLoss: gpxData.elevationLoss,
        duration: gpxData.duration,
        maxElevation: gpxData.maxElevation,
        minElevation: gpxData.minElevation,
        trackPoints: {
          deleteMany: {}, // Remove existing track points
          create: gpxData.trackPoints.map((point) => ({
            latitude: point.latitude,
            longitude: point.longitude,
            elevation: point.elevation,
            timestamp: point.timestamp,
          })),
        },
      },
      include: {
        trackPoints: {
          orderBy: { timestamp: "asc" },
        },
      },
    });

    // Update user stats
    await updateUserStats(session.user.id);

    return NextResponse.json({
      ascent: updatedAscent,
      stats: gpxData,
    });
  } catch (error: any) {
    console.error("Error uploading GPX:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
