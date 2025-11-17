import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { updateUserStats } from "@/lib/stats";

/**
 * Manually trigger stats recalculation
 * Useful for fixing stats that got out of sync
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Recalculate stats
    await updateUserStats(session.user.id);

    return NextResponse.json({
      success: true,
      message: "Stats recalculated successfully",
    });
  } catch (error) {
    console.error("Error recalculating stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
