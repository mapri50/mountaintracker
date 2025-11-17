import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "json";

    // Get all user data
    const tours = await prisma.tour.findMany({
      where: { userId: session.user.id },
      include: {
        ascents: {
          include: {
            photos: true,
            trackPoints: true,
          },
        },
      },
    });

    const stats = await prisma.userStats.findUnique({
      where: { userId: session.user.id },
    });

    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        id: session.user.id,
        username: session.user.username,
      },
      stats,
      tours,
    };

    if (format === "csv") {
      // Convert to CSV format
      const csv = convertToCSV(tours);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="mountaintracker-export-${Date.now()}.csv"`,
        },
      });
    }

    // JSON format (default)
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="mountaintracker-export-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error("Error exporting data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function convertToCSV(tours: any[]): string {
  const headers = [
    "Tour Name",
    "Activity",
    "Location",
    "Difficulty",
    "Grade",
    "Elevation (m)",
    "Distance (m)",
    "Duration (min)",
    "Ascent Date",
    "Ascent Notes",
    "Partners",
    "Conditions",
    "Weather",
    "Distance (km)",
    "Elevation Gain (m)",
    "Elevation Loss (m)",
  ];

  const rows: string[][] = [headers];

  for (const tour of tours) {
    for (const ascent of tour.ascents) {
      rows.push([
        tour.name,
        tour.activity,
        tour.location || "",
        tour.difficulty || "",
        tour.grade || "",
        tour.elevation?.toString() || "",
        tour.distance?.toString() || "",
        tour.duration?.toString() || "",
        new Date(ascent.date).toISOString(),
        ascent.notes || "",
        ascent.partners.join(", "),
        ascent.conditions || "",
        ascent.weather || "",
        ascent.distance?.toString() || "",
        ascent.elevationGain?.toString() || "",
        ascent.elevationLoss?.toString() || "",
      ]);
    }

    // If no ascents, add tour row
    if (tour.ascents.length === 0) {
      rows.push([
        tour.name,
        tour.activity,
        tour.location || "",
        tour.difficulty || "",
        tour.grade || "",
        tour.elevation?.toString() || "",
        tour.distance?.toString() || "",
        tour.duration?.toString() || "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ]);
    }
  }

  return rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (!body.tours || !Array.isArray(body.tours)) {
      return NextResponse.json(
        { error: "Invalid import data format" },
        { status: 400 }
      );
    }

    // Import tours and ascents
    // Note: This is a simple implementation. In production, you might want to:
    // - Validate data more thoroughly
    // - Handle conflicts (e.g., duplicate tours)
    // - Show preview before import
    // - Allow selective import

    let imported = 0;

    for (const tourData of body.tours) {
      const { ascents, ...tourInfo } = tourData;

      // Create tour
      const tour = await prisma.tour.create({
        data: {
          ...tourInfo,
          userId: session.user.id,
          id: undefined, // Generate new ID
        },
      });

      // Create ascents
      if (ascents && Array.isArray(ascents)) {
        for (const ascentData of ascents) {
          const { photos, trackPoints, ...ascentInfo } = ascentData;

          await prisma.ascent.create({
            data: {
              ...ascentInfo,
              id: undefined, // Generate new ID
              tourId: tour.id,
              userId: session.user.id,
              photos: photos
                ? {
                    create: photos.map((p: any) => ({
                      url: p.url,
                      caption: p.caption,
                      latitude: p.latitude,
                      longitude: p.longitude,
                    })),
                  }
                : undefined,
              trackPoints: trackPoints
                ? {
                    create: trackPoints.map((tp: any) => ({
                      latitude: tp.latitude,
                      longitude: tp.longitude,
                      elevation: tp.elevation,
                      timestamp: tp.timestamp,
                    })),
                  }
                : undefined,
            },
          });
        }
      }

      imported++;
    }

    return NextResponse.json({
      success: true,
      imported,
      message: `Successfully imported ${imported} tours`,
    });
  } catch (error) {
    console.error("Error importing data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
