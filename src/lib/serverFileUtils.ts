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
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Di lingkungan serverless (Vercel) atau jika disk read-only,
    // konversi file menjadi Base64 Data URI agar tersimpan permanen di database tanpa perlu file system.
    const isServerless = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

    if (isServerless) {
      const mimeType = file.type || "application/octet-stream";
      const base64Data = buffer.toString("base64");
      return {
        fileUrl: `data:${mimeType};base64,${base64Data}`,
        fileName: file.name,
        fileSize: buffer.length,
      };
    }

    // Untuk pengembangan lokal, coba simpan ke disk public/uploads
    try {
      if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      }

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
    } catch {
      // Safe Fallback ke Base64 Data URI jika folder disk lokal tidak bisa ditulis
      const mimeType = file.type || "application/octet-stream";
      const base64Data = buffer.toString("base64");
      return {
        fileUrl: `data:${mimeType};base64,${base64Data}`,
        fileName: file.name,
        fileSize: buffer.length,
      };
    }
  } catch (error) {
    console.error("File upload failed:", error);
    return null;
  }
}
