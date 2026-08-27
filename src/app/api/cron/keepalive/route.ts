import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/cron/keepalive
 *
 * Database keepalive endpoint dipanggil otomatis oleh Vercel Cron setiap 3 hari
 * untuk mencegah database Supabase masuk ke mode auto-pause (free tier).
 *
 * Responses:
 *   200 OK            – Query berhasil dieksekusi, database aktif.
 *   401 Unauthorized  – Header Authorization tidak cocok dengan CRON_SECRET.
 *   500 Internal      – Gagal menghubungi database (koneksi putus, timeout, dll).
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  // ── 401 Unauthorized ─────────────────────────────────────────────
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      {
        success: false,
        status: 401,
        error: "Unauthorized",
        message: "Header Authorization tidak valid atau CRON_SECRET tidak cocok.",
      },
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // ── 200 OK ────────────────────────────────────────────────────────
  try {
    const userCount = await prisma.user.count();
    const letterCount = await prisma.letter.count();

    return NextResponse.json(
      {
        success: true,
        status: 200,
        message: "Database keepalive query executed successfully.",
        timestamp: new Date().toISOString(),
        data: {
          activeUsers: userCount,
          totalLetters: letterCount,
        },
      },
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  // ── 500 Internal Server Error ──────────────────────────────────────
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json(
      {
        success: false,
        status: 500,
        error: "Internal Server Error",
        message: `Gagal mengeksekusi keepalive query: ${message}`,
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
