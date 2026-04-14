import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BergsteigenScraper } from "@/services/scraper";
import {
  importTourFromText,
  isBergsteigenUrl,
  looksLikeUrl,
} from "@/services/tour-import";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { url, text } = body;
    const candidateText = typeof text === "string" ? text.trim() : "";
    const candidateUrl = typeof url === "string" ? url.trim() : "";

    if (!candidateText && !candidateUrl) {
      return NextResponse.json(
        { error: "A bergsteigen.com URL or pasted tour text is required" },
        { status: 400 },
      );
    }

    if (candidateText) {
      if (looksLikeUrl(candidateText) && isBergsteigenUrl(candidateText)) {
        const tourData = await BergsteigenScraper.scrapeTour(candidateText);

        return NextResponse.json({
          ...tourData,
          sourceUrl: candidateText,
        });
      }

      const tourData = await importTourFromText(candidateText);

      return NextResponse.json({
        ...tourData,
      });
    }

    if (!looksLikeUrl(candidateUrl)) {
      return NextResponse.json(
        { error: "Only valid bergsteigen.com URLs are supported" },
        { status: 400 },
      );
    }

    if (!isBergsteigenUrl(candidateUrl)) {
      return NextResponse.json(
        { error: "Only bergsteigen.com URLs are supported" },
        { status: 400 },
      );
    }

    const tourData = await BergsteigenScraper.scrapeTour(candidateUrl);

    return NextResponse.json({
      ...tourData,
      sourceUrl: candidateUrl,
    });
  } catch (error) {
    console.error("Error scraping tour:", error);
    const message =
      error instanceof Error ? error.message : "Failed to scrape tour data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
