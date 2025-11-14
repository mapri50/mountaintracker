import axios from "axios";
import * as cheerio from "cheerio";
import { Condition, Activity } from "@prisma/client";

export interface ScrapedTourData {
  name: string;
  description?: string;
  location?: string;
  elevation?: number;
  distance?: number;
  duration?: number;
  difficulty?: string;
  grade?: string;
  imageUrl?: string;
  conditions: Condition[];
  activity: Activity;
}

export class BergsteigenScraper {
  private static readonly BASE_URL = "https://www.bergsteigen.com";

  /**
   * Scrapes tour data from a bergsteigen.com URL
   */
  static async scrapeTour(url: string): Promise<ScrapedTourData> {
    try {
      const response = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      const $ = cheerio.load(response.data);

      const data: Partial<ScrapedTourData> = {
        name: this.extractName($),
        description: this.extractDescription($),
        location: this.extractLocation($),
        elevation: this.extractElevation($),
        distance: this.extractDistance($),
        duration: this.extractDuration($),
        difficulty: this.extractDifficulty($),
        grade: this.extractGrade($),
        imageUrl: this.extractImageUrl($),
        conditions: this.extractConditions($, url),
        activity: this.extractActivity($, url),
      };

      if (
        !data.name ||
        !data.conditions ||
        data.conditions.length === 0 ||
        !data.activity
      ) {
        throw new Error("Could not extract required tour data");
      }

      return data as ScrapedTourData;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to fetch tour data: ${error.message}`);
      }
      throw error;
    }
  }

  private static extractName($: cheerio.CheerioAPI): string {
    // Try multiple selectors for tour name
    const selectors = [".tourHeader h1", "h1.tour-title", "h1.title", "h1"];

    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      if (text) return text;
    }

    return "Untitled Tour";
  }

  private static extractDescription($: cheerio.CheerioAPI): string | undefined {
    const selectors = [
      'meta[name="description"]',
      'meta[property="og:description"]',
      ".tour-description",
      ".description",
      'div[itemprop="description"]',
      ".content-text",
    ];

    // First try meta description
    const metaDesc = $('meta[name="description"]').attr("content");
    if (metaDesc) {
      // Decode HTML entities using cheerio's built-in functionality
      const decoded = $("<div>").html(metaDesc).text();
      return decoded;
    }

    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      if (text) return text;
    }

    return undefined;
  }

  private static extractLocation($: cheerio.CheerioAPI): string | undefined {
    const selectors = [".tour-location", '[itemprop="location"]', ".location"];

    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      if (text) return text;
    }

    return undefined;
  }

  private static extractElevation($: cheerio.CheerioAPI): number | undefined {
    // Look for "Gesamthöhe" or similar patterns in bergsteigen.com
    const text = $("body").text();

    // Try to find "Gesamthöhe" with number and "Hm"
    const gesamtMatch = text.match(/Gesamthöhe[\s\S]*?(\d+)\s*(?:Hm|hm)/i);
    if (gesamtMatch) return parseInt(gesamtMatch[1], 10);

    // Try general height patterns
    const heightMatch = text.match(/(\d{3,4})\s*(?:Hm|hm|höhenmeter)/i);
    return heightMatch ? parseInt(heightMatch[1], 10) : undefined;
  }

  private static extractDistance($: cheerio.CheerioAPI): number | undefined {
    const text = $("body").text();
    const distanceMatch = text.match(/(\d+(?:\.\d+)?)\s*km/i);
    if (distanceMatch) {
      return Math.round(parseFloat(distanceMatch[1]) * 1000);
    }
    return undefined;
  }

  private static extractDuration($: cheerio.CheerioAPI): number | undefined {
    const text = $("body").text();

    // Try "Gesamtzeit" specifically for bergsteigen.com
    const gesamtzeitMatch = text.match(
      /Gesamtzeit[\s\S]*?(\d+):(\d+)\s*(?:Std|h)/i
    );
    if (gesamtzeitMatch) {
      return (
        parseInt(gesamtzeitMatch[1], 10) * 60 + parseInt(gesamtzeitMatch[2], 10)
      );
    }

    // Try to match patterns like "5:30 h" or "5h 30min" or "5.5 Std"
    const hourMinMatch = text.match(/(\d+):(\d+)\s*(?:h|std)/i);
    if (hourMinMatch) {
      return parseInt(hourMinMatch[1], 10) * 60 + parseInt(hourMinMatch[2], 10);
    }

    const hoursMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:h|std|stunden)/i);
    if (hoursMatch) {
      return Math.round(parseFloat(hoursMatch[1]) * 60);
    }

    return undefined;
  }

  private static extractDifficulty($: cheerio.CheerioAPI): string | undefined {
    const selectors = [
      ".categoryValue",
      ".difficulty",
      "[data-difficulty]",
      ".schwierigkeit",
    ];

    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      if (text) return text;
    }

    return undefined;
  }

  private static extractGrade($: cheerio.CheerioAPI): string | undefined {
    // Check for Schwierigkeit label in bergsteigen.com structure
    const schwierigkeitText = $(
      '.iconInfoWrap:contains("Schwierigkeit") .iconInfoValue'
    )
      .text()
      .trim();
    if (schwierigkeitText) return schwierigkeitText;

    const text = $("body").text();

    // Common climbing/alpine grades
    const gradePatterns = [
      /Schwierigkeit[\s\S]*?([A-E][-+]?)/i, // Via ferrata grades
      /\b([IV]+[+-]?)\b/, // Roman numerals for alpine grades
      /\b([0-9]{1,2}[a-c]?[+-]?)\b/, // UIAA grades
      /\b(WS|ZS|S|SS|AS)\b/, // SAC difficulty scale
    ];

    for (const pattern of gradePatterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }

    return undefined;
  }

  private static extractImageUrl($: cheerio.CheerioAPI): string | undefined {
    // Try meta og:image first
    const ogImage = $('meta[property="og:image"]').attr("content");
    if (ogImage) {
      return ogImage.startsWith("http")
        ? ogImage
        : `${this.BASE_URL}${ogImage}`;
    }

    const selectors = [
      ".mainInfoContainerTour img",
      ".tour-image img",
      ".main-image img",
      "article img",
      'img[itemprop="image"]',
    ];

    for (const selector of selectors) {
      const src = $(selector).first().attr("src");
      if (src) {
        return src.startsWith("http") ? src : `${this.BASE_URL}${src}`;
      }
    }

    return undefined;
  }

  private static extractConditions(
    $: cheerio.CheerioAPI,
    url: string
  ): Condition[] {
    const text = $("body").text().toLowerCase();
    const urlLower = url.toLowerCase();
    const conditions: Condition[] = [];

    // Check for winter indicators
    if (
      text.includes("winter") ||
      urlLower.includes("winter") ||
      text.includes("schnee") ||
      text.includes("ski")
    ) {
      conditions.push("WINTER");
    }

    // Check for Übergang indicators
    if (
      text.includes("übergang") ||
      urlLower.includes("uebergang") ||
      text.includes("frühling") ||
      text.includes("herbst") ||
      text.includes("frühjahr")
    ) {
      conditions.push("UEBERGANG");
    }

    // Check for summer indicators (always include if not winter-specific)
    if (
      text.includes("sommer") ||
      urlLower.includes("sommer") ||
      conditions.length === 0 // Default to summer if nothing else found
    ) {
      if (!conditions.includes("SOMMER")) {
        conditions.push("SOMMER");
      }
    }

    // If still empty, default to summer
    if (conditions.length === 0) {
      conditions.push("SOMMER");
    }

    return conditions;
  }

  private static extractActivity($: cheerio.CheerioAPI, url: string): Activity {
    const text = $("body").text().toLowerCase();
    const urlLower = url.toLowerCase();
    const combined = text + " " + urlLower;

    if (combined.includes("skihochtour")) return "SKIHOCHTOUR";
    if (combined.includes("skitour")) return "SKITOUR";
    if (combined.includes("hochtour")) return "HOCHTOUR";
    if (combined.includes("klettersteig") || combined.includes("via ferrata"))
      return "SPORTKLETTERSTEIG";
    if (combined.includes("alpinklettern")) return "ALPINKLETTERN";
    if (combined.includes("sportklettern")) return "SPORTKLETTERN";
    if (combined.includes("eisklettern") || combined.includes("mixed"))
      return "EIS_MIXEDKLETTERN";
    if (combined.includes("bergtour")) return "BERGTOUR";
    if (combined.includes("wandern") || combined.includes("wanderung"))
      return "WANDERN";

    // Default fallback
    return "BERGTOUR";
  }
}
