import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  // Verifikasi token rahasia dari Vercel Cron (jika ada)
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // Jalankan query ringan untuk memancing aktivitas database Supabase
    const userCount = await prisma.user.count();
    
    return NextResponse.json({
      success: true,
      message: "Keepalive database query executed successfully",
      timestamp: new Date().toISOString(),
      activeUsersCount: userCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
