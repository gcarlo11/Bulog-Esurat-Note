import fs from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function processAndSaveFile(file: File): Promise<{
  fileUrl: string;
  fileName: string;
  fileSize: number;
} | null> {
  if (!file || file.size === 0) return null;

  try {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Sanitize filename and make unique
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniquePrefix = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const storedFileName = `${uniquePrefix}_${sanitizedName}`;
    const filePath = path.join(UPLOAD_DIR, storedFileName);

    fs.writeFileSync(filePath, buffer);

    return {
      fileUrl: `/uploads/${storedFileName}`,
      fileName: file.name,
      fileSize: buffer.length,
    };
  } catch (error) {
    console.error("File upload failed:", error);
    return null;
  }
}
