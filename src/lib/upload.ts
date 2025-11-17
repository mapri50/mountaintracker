import { IncomingMessage } from "http";
import formidable, { File } from "formidable";
import { promises as fs } from "fs";
import path from "path";

export interface UploadedFile {
  filepath: string;
  originalFilename: string;
  mimetype: string;
  size: number;
}

/**
 * Parse multipart form data from Next.js API route
 */
export async function parseFormData(
  req: IncomingMessage
): Promise<{ fields: formidable.Fields; files: formidable.Files }> {
  const form = formidable({
    maxFileSize: 50 * 1024 * 1024, // 50MB max
    keepExtensions: true,
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({ fields, files });
    });
  });
}

/**
 * Read file content as string
 */
export async function readFileContent(file: File): Promise<string> {
  return fs.readFile(file.filepath, "utf-8");
}

/**
 * Save uploaded file to public directory
 */
export async function saveUploadedFile(
  file: File,
  directory: string = "uploads"
): Promise<string> {
  const uploadsDir = path.join(process.cwd(), "public", directory);

  // Ensure directory exists
  await fs.mkdir(uploadsDir, { recursive: true });

  // Generate unique filename
  const timestamp = Date.now();
  const extension = path.extname(file.originalFilename || "");
  const basename = path.basename(file.originalFilename || "file", extension);
  const filename = `${basename}-${timestamp}${extension}`;
  const filepath = path.join(uploadsDir, filename);

  // Copy file to public directory
  await fs.copyFile(file.filepath, filepath);

  // Return public URL
  return `/${directory}/${filename}`;
}

/**
 * Validate file type
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  if (!file.mimetype) return false;
  return allowedTypes.some((type) => {
    if (type.endsWith("/*")) {
      return file.mimetype?.startsWith(type.replace("/*", ""));
    }
    return file.mimetype === type;
  });
}

/**
 * Validate GPX/TCX file
 */
export function isTrackFile(file: File): boolean {
  const filename = file.originalFilename?.toLowerCase() || "";
  return (
    filename.endsWith(".gpx") ||
    filename.endsWith(".tcx") ||
    file.mimetype === "application/gpx+xml" ||
    file.mimetype === "application/xml" ||
    file.mimetype === "text/xml"
  );
}

/**
 * Validate image file
 */
export function isImageFile(file: File): boolean {
  return validateFileType(file, ["image/*"]);
}
