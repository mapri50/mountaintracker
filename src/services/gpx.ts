import { XMLParser } from "fast-xml-parser";
import * as turf from "@turf/turf";

export interface TrackPoint {
  latitude: number;
  longitude: number;
  elevation?: number;
  timestamp?: Date;
}

export interface GPXStats {
  distance: number; // kilometers
  elevationGain: number; // meters
  elevationLoss: number; // meters
  duration?: number; // minutes
  maxElevation?: number; // meters
  minElevation?: number; // meters
  trackPoints: TrackPoint[];
}

interface GPXTrackPoint {
  "@_lat": string;
  "@_lon": string;
  ele?: number | string;
  time?: string;
}

interface GPXTrackSegment {
  trkpt?: GPXTrackPoint | GPXTrackPoint[];
}

interface GPXTrack {
  trkseg?: GPXTrackSegment | GPXTrackSegment[];
}

interface GPXData {
  gpx?: {
    trk?: GPXTrack | GPXTrack[];
    rte?: any;
    wpt?: any;
  };
}

/**
 * Parse GPX file content and extract track points with statistics
 */
export async function parseGPX(gpxContent: string): Promise<GPXStats> {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });

  const parsed: GPXData = parser.parse(gpxContent);

  if (!parsed.gpx) {
    throw new Error("Invalid GPX file: missing gpx element");
  }

  const trackPoints: TrackPoint[] = [];

  // Extract track points from tracks
  const tracks = Array.isArray(parsed.gpx.trk)
    ? parsed.gpx.trk
    : [parsed.gpx.trk].filter(Boolean);

  for (const track of tracks) {
    if (!track?.trkseg) continue;

    const segments = Array.isArray(track.trkseg)
      ? track.trkseg
      : [track.trkseg];

    for (const segment of segments) {
      if (!segment?.trkpt) continue;

      const points = Array.isArray(segment.trkpt)
        ? segment.trkpt
        : [segment.trkpt];

      for (const point of points) {
        const lat = parseFloat(point["@_lat"]);
        const lon = parseFloat(point["@_lon"]);

        if (isNaN(lat) || isNaN(lon)) continue;

        const trackPoint: TrackPoint = {
          latitude: lat,
          longitude: lon,
        };

        if (point.ele !== undefined) {
          const elevation =
            typeof point.ele === "string" ? parseFloat(point.ele) : point.ele;
          if (!isNaN(elevation)) {
            trackPoint.elevation = elevation;
          }
        }

        if (point.time) {
          const timestamp = new Date(point.time);
          if (!isNaN(timestamp.getTime())) {
            trackPoint.timestamp = timestamp;
          }
        }

        trackPoints.push(trackPoint);
      }
    }
  }

  if (trackPoints.length === 0) {
    throw new Error("No valid track points found in GPX file");
  }

  // Calculate statistics
  return calculateGPXStats(trackPoints);
}

/**
 * Calculate distance, elevation gain/loss, and other stats from track points
 */
function calculateGPXStats(trackPoints: TrackPoint[]): GPXStats {
  let totalDistance = 0; // km
  let elevationGain = 0;
  let elevationLoss = 0;
  let maxElevation: number | undefined;
  let minElevation: number | undefined;
  let duration: number | undefined;

  // Calculate distance using Haversine formula via turf
  for (let i = 1; i < trackPoints.length; i++) {
    const from = turf.point([
      trackPoints[i - 1].longitude,
      trackPoints[i - 1].latitude,
    ]);
    const to = turf.point([trackPoints[i].longitude, trackPoints[i].latitude]);
    const distance = turf.distance(from, to, { units: "kilometers" });
    totalDistance += distance;
  }

  // Calculate elevation stats
  for (let i = 0; i < trackPoints.length; i++) {
    const elevation = trackPoints[i].elevation;
    if (elevation !== undefined) {
      // Track max/min elevation
      if (maxElevation === undefined || elevation > maxElevation) {
        maxElevation = elevation;
      }
      if (minElevation === undefined || elevation < minElevation) {
        minElevation = elevation;
      }

      // Calculate elevation gain/loss
      if (i > 0 && trackPoints[i - 1].elevation !== undefined) {
        const elevationDiff = elevation - trackPoints[i - 1].elevation!;
        if (elevationDiff > 0) {
          elevationGain += elevationDiff;
        } else {
          elevationLoss += Math.abs(elevationDiff);
        }
      }
    }
  }

  // Calculate duration from timestamps
  const timestamps = trackPoints
    .map((p) => p.timestamp)
    .filter((t): t is Date => t !== undefined)
    .sort((a, b) => a.getTime() - b.getTime());

  if (timestamps.length >= 2) {
    const durationMs =
      timestamps[timestamps.length - 1].getTime() - timestamps[0].getTime();
    duration = Math.round(durationMs / 1000 / 60); // convert to minutes
  }

  return {
    distance: Math.round(totalDistance * 100) / 100, // round to 2 decimals
    elevationGain: Math.round(elevationGain),
    elevationLoss: Math.round(elevationLoss),
    duration,
    maxElevation: maxElevation ? Math.round(maxElevation) : undefined,
    minElevation: minElevation ? Math.round(minElevation) : undefined,
    trackPoints,
  };
}

/**
 * Parse TCX file content (Garmin Training Center XML)
 */
export async function parseTCX(tcxContent: string): Promise<GPXStats> {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });

  const parsed = parser.parse(tcxContent);

  const trackPoints: TrackPoint[] = [];

  // TCX structure: TrainingCenterDatabase > Activities > Activity > Lap > Track > Trackpoint
  const activities = parsed?.TrainingCenterDatabase?.Activities?.Activity;
  const activityList = Array.isArray(activities)
    ? activities
    : [activities].filter(Boolean);

  for (const activity of activityList) {
    const laps = Array.isArray(activity?.Lap)
      ? activity.Lap
      : [activity?.Lap].filter(Boolean);

    for (const lap of laps) {
      const tracks = Array.isArray(lap?.Track)
        ? lap.Track
        : [lap?.Track].filter(Boolean);

      for (const track of tracks) {
        const trackpoints = Array.isArray(track?.Trackpoint)
          ? track.Trackpoint
          : [track?.Trackpoint].filter(Boolean);

        for (const point of trackpoints) {
          if (!point?.Position) continue;

          const lat = parseFloat(point.Position.LatitudeDegrees);
          const lon = parseFloat(point.Position.LongitudeDegrees);

          if (isNaN(lat) || isNaN(lon)) continue;

          const trackPoint: TrackPoint = {
            latitude: lat,
            longitude: lon,
          };

          if (point.AltitudeMeters !== undefined) {
            const elevation = parseFloat(point.AltitudeMeters);
            if (!isNaN(elevation)) {
              trackPoint.elevation = elevation;
            }
          }

          if (point.Time) {
            const timestamp = new Date(point.Time);
            if (!isNaN(timestamp.getTime())) {
              trackPoint.timestamp = timestamp;
            }
          }

          trackPoints.push(trackPoint);
        }
      }
    }
  }

  if (trackPoints.length === 0) {
    throw new Error("No valid track points found in TCX file");
  }

  return calculateGPXStats(trackPoints);
}

/**
 * Detect file type and parse accordingly
 */
export async function parseTrackFile(
  content: string,
  filename: string
): Promise<GPXStats> {
  const lowerFilename = filename.toLowerCase();

  if (lowerFilename.endsWith(".gpx")) {
    return parseGPX(content);
  } else if (lowerFilename.endsWith(".tcx")) {
    return parseTCX(content);
  } else {
    // Try GPX first, then TCX
    try {
      return await parseGPX(content);
    } catch {
      return await parseTCX(content);
    }
  }
}
