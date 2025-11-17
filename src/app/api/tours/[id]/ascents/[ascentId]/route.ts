import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { updateUserStats } from "@/lib/stats";

const ascentSchema = z.object({
  date: z.string().datetime(),
  notes: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; ascentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = ascentSchema.partial().safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.errors },
        { status: 400 }
      );
    }

    const ascent = await prisma.ascent.findFirst({
      where: {
        id: params.ascentId,
        userId: session.user.id,
      },
    });

    if (!ascent) {
      return NextResponse.json({ error: "Ascent not found" }, { status: 404 });
    }

    const updatedAscent = await prisma.ascent.update({
      where: { id: params.ascentId },
      data: {
        ...(validation.data.date && { date: new Date(validation.data.date) }),
        ...(validation.data.notes !== undefined && {
          notes: validation.data.notes,
        }),
      },
    });

    // Update user stats
    await updateUserStats(session.user.id);

    return NextResponse.json(updatedAscent);
  } catch (error) {
    console.error("Error updating ascent:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; ascentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ascent = await prisma.ascent.findFirst({
      where: {
        id: params.ascentId,
        userId: session.user.id,
      },
    });

    if (!ascent) {
      return NextResponse.json({ error: "Ascent not found" }, { status: 404 });
    }

    await prisma.ascent.delete({
      where: { id: params.ascentId },
    });

    // Update user stats after deletion
    await updateUserStats(session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting ascent:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
