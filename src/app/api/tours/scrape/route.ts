import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BergsteigenScraper } from "@/services/scraper";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL is from bergsteigen.com
    if (!url.includes("bergsteigen.com")) {
      return NextResponse.json(
        { error: "Only bergsteigen.com URLs are supported" },
        { status: 400 }
      );
    }

    const tourData = await BergsteigenScraper.scrapeTour(url);

    return NextResponse.json({
      ...tourData,
      sourceUrl: url,
    });
  } catch (error) {
    console.error("Error scraping tour:", error);
    const message =
      error instanceof Error ? error.message : "Failed to scrape tour data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
