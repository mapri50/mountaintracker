import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tourSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const condition = searchParams.get("condition");
    const activity = searchParams.get("activity");
    const completed = searchParams.get("completed");

    const tours = await prisma.tour.findMany({
      where: {
        userId: session.user.id,
        ...(condition && { conditions: { has: condition as any } }),
        ...(activity && { activity: activity as any }),
      },
      include: {
        ascents: {
          select: { id: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform to include ascent count
    const toursWithCount = tours.map((tour) => ({
      ...tour,
      ascentCount: tour.ascents.length,
      ascents: undefined,
    }));

    return NextResponse.json(toursWithCount);
  } catch (error) {
    console.error("Error fetching tours:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = tourSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    const tour = await prisma.tour.create({
      data: {
        ...data,
        elevation: data.elevation || null,
        distance: data.distance || null,
        duration: data.duration || null,
        sourceUrl: data.sourceUrl || null,
        imageUrl: data.imageUrl || null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(tour, { status: 201 });
  } catch (error) {
    console.error("Error creating tour:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
