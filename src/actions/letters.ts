"use server";

import { prisma } from "@/lib/prisma";
import { requireRole, getAuthenticatedUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ============================================
// Helper: Generate Nomor Surat Otomatis
// Format: [TIPE]-[TAHUN][BULAN]-[NOMOR_URUT]
// Contoh: SM-202607-0001 (Surat Masuk ke-1 bulan Juli 2026)
// ============================================
async function generateLetterNumber(
  category: string,
  agendaType?: string,
  type?: string
): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  let prefix = "DOC";

  if (category === "KELUAR_MASUK") {
    prefix = type === "MASUK" ? "SM" : "SK";
  } else if (category === "AGENDA") {
    const agendaPrefixes: Record<string, string> = {
      "Surat Perintah": "SP",
      "Surat Keputusan": "SKEP",
      "Surat Perjanjian Kerjasama": "SPK",
      "Berita Acara Serah Terima": "BAST",
      "Berita Acara": "BA",
      "Surat Pengantar": "SPG",
      "Edaran": "EDR",
      "Pengumuman": "PENG",
      "Surat Keterangan/Pernyataan": "SKET",
      "Memo/Nota Intern": "MEMO",
      "Surat Kuasa": "SKU",
      "Undangan": "UND",
      "Claim": "CLM",
      "Surat Izin (Cuti)": "CUTI",
    };
    prefix = agendaPrefixes[agendaType || ""] || "AGD";
  } else if (category === "NOTA_VERIFIKASI") {
    prefix = "NV";
  }

  // Cari nomor urut terakhir bulan ini untuk kategori/tipe ini
  const startOfMonth = new Date(year, now.getMonth(), 1);
  const endOfMonth = new Date(year, now.getMonth() + 1, 0, 23, 59, 59);

  const lastLetter = await prisma.letter.findFirst({
    where: {
      category,
      agendaType: category === "AGENDA" ? agendaType : undefined,
      type: category === "KELUAR_MASUK" ? type : undefined,
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  let sequence = 1;
  if (lastLetter) {
    const parts = lastLetter.letterNumber.split("-");
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) {
      sequence = lastSeq + 1;
    }
  }

  return `${prefix}-${year}${month}-${String(sequence).padStart(4, "0")}`;
}

// ============================================
// Helper: Catat Audit Log
// ============================================
async function createAuditLog(params: {
  action: string;
  entityType: string;
  entityId?: string;
  userId: string;
  letterId?: string;
  details?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      userId: params.userId,
      letterId: params.letterId,
      details: params.details ? JSON.stringify(params.details) : null,
    },
  });
}

// ============================================
// Tambah Surat Baru
// ============================================
export async function createLetterAction(formData: FormData) {
  const user = await requireRole(["ADMIN", "STAFF"]);

  const category = (formData.get("category") as string) || "KELUAR_MASUK";
  const subject = formData.get("subject") as string;
  const letterDate = formData.get("letterDate") as string;
  const description = formData.get("description") as string;
  const classification = (formData.get("classification") as string) || "BIASA";

  // Field spesifik kategori
  const type = formData.get("type") as string; // KELUAR_MASUK
  const sender = formData.get("sender") as string; // KELUAR_MASUK
  const recipient = formData.get("recipient") as string; // KELUAR_MASUK, AGENDA
  const receivedDate = formData.get("receivedDate") as string; // KELUAR_MASUK

  const agendaType = formData.get("agendaType") as string; // AGENDA
  const code = formData.get("code") as string; // AGENDA, KELUAR_MASUK (sebagai nomor petunjuk)

  const nomorBerkas = formData.get("nomorBerkas") as string; // KELUAR_MASUK
  const nomorPetunjuk = formData.get("nomorPetunjuk") as string; // KELUAR_MASUK

  const nominalStr = formData.get("nominal") as string; // NOTA_VERIFIKASI
  const paraf = formData.get("paraf") as string; // NOTA_VERIFIKASI

  // Validasi Berdasarkan Kategori
  if (category === "AGENDA") {
    if (!agendaType || !subject || !letterDate || !recipient) {
      return { error: "Field Jenis Agenda, Perihal, Tanggal, dan Tujuan wajib diisi." };
    }
  } else if (category === "KELUAR_MASUK") {
    if (!type || !subject || !letterDate || !recipient || !sender) {
      return { error: "Field Tipe, Pengirim, Penerima, Perihal, dan Tanggal wajib diisi." };
    }
  } else if (category === "NOTA_VERIFIKASI") {
    if (!subject || !letterDate || !nominalStr || !paraf) {
      return { error: "Field Perihal, Tanggal, Nominal, dan Paraf wajib diisi." };
    }
  }

  const nominal = nominalStr ? parseFloat(nominalStr.replace(/[^0-9.-]+/g, "")) : null;
  const letterNumber = await generateLetterNumber(category, agendaType, type);

  const letter = await prisma.letter.create({
    data: {
      letterNumber,
      category,
      type: category === "KELUAR_MASUK" ? type : null,
      subject,
      sender: category === "KELUAR_MASUK" ? sender : null,
      recipient: category === "NOTA_VERIFIKASI" ? null : recipient,
      letterDate: new Date(letterDate),
      receivedDate: category === "KELUAR_MASUK" && receivedDate ? new Date(receivedDate) : null,
      description: description || null,
      classification,
      createdById: user.id,
      agendaType: category === "AGENDA" ? agendaType : null,
      code: category === "AGENDA" ? code : null,
      nomorBerkas: category === "KELUAR_MASUK" ? nomorBerkas : null,
      nomorPetunjuk: category === "KELUAR_MASUK" ? nomorPetunjuk : null,
      nominal: category === "NOTA_VERIFIKASI" ? nominal : null,
      paraf: category === "NOTA_VERIFIKASI" ? paraf : null,
    },
  });

  // Catat audit log
  await createAuditLog({
    action: "CREATE",
    entityType: "LETTER",
    entityId: letter.id,
    userId: user.id,
    letterId: letter.id,
    details: {
      letterNumber,
      category,
      subject,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/letters");
  return { success: `Dokumen ${letterNumber} berhasil diregistrasi.` };
}

// ============================================
// Edit Surat (dengan Version Tracking)
// ============================================
export async function updateLetterAction(
  letterId: string,
  formData: FormData
) {
  const user = await requireRole(["ADMIN", "STAFF"]);

  const letter = await prisma.letter.findUnique({
    where: { id: letterId },
  });

  if (!letter || letter.status === "ARCHIVED") {
    return { error: "Surat tidak ditemukan atau sudah diarsipkan." };
  }

  // Simpan versi lama sebelum diedit
  const versionCount = await prisma.letterVersion.count({
    where: { letterId },
  });

  await prisma.letterVersion.create({
    data: {
      version: versionCount + 1,
      letterId,
      category: letter.category,
      type: letter.type,
      subject: letter.subject,
      sender: letter.sender,
      recipient: letter.recipient,
      letterDate: letter.letterDate,
      description: letter.description,
      classification: letter.classification,
      changeNote: (formData.get("changeNote") as string) || null,
      agendaType: letter.agendaType,
      code: letter.code,
      nomorBerkas: letter.nomorBerkas,
      nomorPetunjuk: letter.nomorPetunjuk,
      nominal: letter.nominal,
      paraf: letter.paraf,
    },
  });

  // Ambil data form
  const subject = formData.get("subject") as string;
  const sender = formData.get("sender") as string;
  const recipient = formData.get("recipient") as string;
  const letterDate = formData.get("letterDate") as string;
  const description = formData.get("description") as string;
  const classification = formData.get("classification") as string;

  // Field spesifik kategori
  const agendaType = formData.get("agendaType") as string;
  const code = formData.get("code") as string;
  const nomorBerkas = formData.get("nomorBerkas") as string;
  const nomorPetunjuk = formData.get("nomorPetunjuk") as string;
  const nominalStr = formData.get("nominal") as string;
  const paraf = formData.get("paraf") as string;

  const nominal = nominalStr ? parseFloat(nominalStr.replace(/[^0-9.-]+/g, "")) : letter.nominal;

  const updated = await prisma.letter.update({
    where: { id: letterId },
    data: {
      subject: subject || letter.subject,
      sender: letter.category === "KELUAR_MASUK" ? (sender || letter.sender) : null,
      recipient: letter.category === "NOTA_VERIFIKASI" ? null : (recipient || letter.recipient),
      letterDate: letterDate ? new Date(letterDate) : letter.letterDate,
      description: description ?? letter.description,
      classification: classification || letter.classification,
      agendaType: letter.category === "AGENDA" ? (agendaType || letter.agendaType) : null,
      code: letter.category === "AGENDA" ? (code || letter.code) : null,
      nomorBerkas: letter.category === "KELUAR_MASUK" ? (nomorBerkas || letter.nomorBerkas) : null,
      nomorPetunjuk: letter.category === "KELUAR_MASUK" ? (nomorPetunjuk || letter.nomorPetunjuk) : null,
      nominal: letter.category === "NOTA_VERIFIKASI" ? (nominalStr ? nominal : letter.nominal) : null,
      paraf: letter.category === "NOTA_VERIFIKASI" ? (paraf || letter.paraf) : null,
    },
  });

  // Catat audit log
  await createAuditLog({
    action: "UPDATE",
    entityType: "LETTER",
    entityId: letterId,
    userId: user.id,
    letterId,
    details: {
      letterNumber: updated.letterNumber,
      version: versionCount + 1,
      changes: {
        subject: { from: letter.subject, to: updated.subject },
      },
    },
  });

  revalidatePath(`/dashboard/letters/${letterId}`);
  revalidatePath("/dashboard/letters");
  return { success: "Dokumen berhasil diperbarui." };
}

// ============================================
// Arsipkan Surat (Soft Delete)
// ============================================
export async function archiveLetterAction(
  letterId: string,
  reason: string
) {
  const user = await requireRole(["ADMIN"]);

  if (!reason || reason.trim().length < 10) {
    return {
      error: "Alasan pengarsipan wajib diisi minimal 10 karakter.",
    };
  }

  const letter = await prisma.letter.findUnique({
    where: { id: letterId },
  });

  if (!letter) {
    return { error: "Surat tidak ditemukan." };
  }

  await prisma.letter.update({
    where: { id: letterId },
    data: {
      status: "ARCHIVED",
      archiveReason: reason.trim(),
    },
  });

  await createAuditLog({
    action: "ARCHIVE",
    entityType: "LETTER",
    entityId: letterId,
    userId: user.id,
    letterId,
    details: {
      letterNumber: letter.letterNumber,
      reason: reason.trim(),
    },
  });

  revalidatePath("/letters");
  revalidatePath("/dashboard");
  return { success: "Surat berhasil diarsipkan." };
}

export async function getLetters(params?: {
  category?: string;
  type?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  await getAuthenticatedUser();

  const page = params?.page || 1;
  const limit = params?.limit || 15;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (params?.category && params.category !== "ALL") {
    where.category = params.category;
  }
  if (params?.type && params.type !== "ALL") {
    where.type = params.type;
  }
  if (params?.status && params.status !== "ALL") {
    where.status = params.status;
  } else {
    where.status = "ACTIVE"; // Default: tampilkan hanya surat aktif
  }
  if (params?.search) {
    where.OR = [
      { subject: { contains: params.search } },
      { sender: { contains: params.search } },
      { recipient: { contains: params.search } },
      { letterNumber: { contains: params.search } },
      { agendaType: { contains: params.search } },
      { code: { contains: params.search } },
      { nomorBerkas: { contains: params.search } },
      { nomorPetunjuk: { contains: params.search } },
      { paraf: { contains: params.search } },
    ];
  }

  const [letters, total] = await Promise.all([
    prisma.letter.findMany({
      where,
      include: {
        createdBy: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.letter.count({ where }),
  ]);

  return {
    letters,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

// ============================================
// Ambil Detail Surat + Versi + Log
// ============================================
export async function getLetterDetail(letterId: string) {
  await getAuthenticatedUser();

  const letter = await prisma.letter.findUnique({
    where: { id: letterId },
    include: {
      createdBy: {
        select: { name: true, email: true },
      },
      versions: {
        orderBy: { version: "desc" },
      },
      auditLogs: {
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      },
    },
  });

  return letter;
}

// ============================================
// Dashboard Statistics
// ============================================
export async function getDashboardStats() {
  await getAuthenticatedUser();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalLetters,
    suratMasuk,
    suratKeluar,
    suratBulanIni,
    recentLogs,
    recentLetters,
  ] = await Promise.all([
    prisma.letter.count({ where: { status: "ACTIVE" } }),
    prisma.letter.count({
      where: { type: "MASUK", status: "ACTIVE" },
    }),
    prisma.letter.count({
      where: { type: "KELUAR", status: "ACTIVE" },
    }),
    prisma.letter.count({
      where: {
        status: "ACTIVE",
        createdAt: { gte: startOfMonth },
      },
    }),
    prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true } },
      },
    }),
    prisma.letter.findMany({
      where: { status: "ACTIVE" },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { name: true } },
      },
    }),
  ]);

  return {
    totalLetters,
    suratMasuk,
    suratKeluar,
    suratBulanIni,
    recentLogs,
    recentLetters,
  };
}

// ============================================
// Ambil Audit Logs (Admin only)
// ============================================
export async function getAuditLogs(params?: {
  page?: number;
  limit?: number;
}) {
  await requireRole(["ADMIN"]);

  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        letter: { select: { letterNumber: true, subject: true } },
      },
      skip,
      take: limit,
    }),
    prisma.auditLog.count(),
  ]);

  return {
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

// ============================================
// Ambil Semua Surat untuk Export (tanpa paginasi)
// ============================================
export async function getLettersForExport(params?: {
  category?: string;
  type?: string;
}) {
  await getAuthenticatedUser();

  const where: Record<string, unknown> = {
    status: "ACTIVE",
  };

  if (params?.category && params.category !== "ALL") {
    where.category = params.category;
  }
  if (params?.type && params.type !== "ALL") {
    where.type = params.type;
  }

  const letters = await prisma.letter.findMany({
    where,
    include: {
      createdBy: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return letters;
}
