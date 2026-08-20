"use server";

import { prisma } from "@/lib/prisma";
import { requireRole, getAuthenticatedUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Helper: Generate Nomor Surat Otomatis

// Format: [TIPE]-[TAHUN][BULAN]-[NOMOR_URUT]
// Contoh: SM-202607-0001 (Surat Masuk ke-1 bulan Juli 2026)

// Helper: Penomoran Suffix Backdate & Klasifikasi

function getSuffix(index: number): string {
  let suffix = "";
  let temp = index;
  while (temp >= 0) {
    suffix = String.fromCharCode((temp % 26) + 65) + suffix;
    temp = Math.floor(temp / 26) - 1;
  }
  return suffix;
}

function suffixToIndex(suffix: string): number {
  if (!suffix) return -1;
  let index = 0;
  for (let i = 0; i < suffix.length; i++) {
    index = index * 26 + (suffix.charCodeAt(i) - 64);
  }
  return index - 1;
}

function parseLetterNumber(letterNumber: string, kode: string) {
  const prefix = `${kode}-`;
  if (!letterNumber.startsWith(prefix)) return null;
  const rest = letterNumber.slice(prefix.length);
  const match = rest.match(/^(\d+)([A-Z]*)$/);
  if (!match) return null;
  return {
    baseNumber: parseInt(match[1], 10),
    suffix: match[2]
  };
}

async function generateLetterNumber(
  category: string,
  letterDate: Date,
  agendaType?: string,
  type?: string
): Promise<string> {
  const now = new Date();
  let prefix = "DOC";

  if (category === "KELUAR_MASUK") {
    prefix = type === "MASUK" ? "SM" : "B";
  } else if (category === "AGENDA") {
    const agendaPrefixes: Record<string, string> = {
      "Surat Perintah": "SP",
      "Surat Keputusan": "K",
      "Surat Perjanjian Kerjasama": "PK",
      "Berita Acara Serah Terima": "BAST",
      "Berita Acara": "BA",
      "Surat Pengantar": "PT",
      "Edaran": "SE",
      "Pengumuman": "PENG",
      "Surat Keterangan/Pernyataan": "T",
      "Memo/Nota Intern": "M/NI",
      "Surat Kuasa": "S",
      "Undangan": "U",
      "Claim": "C",
      "Surat Izin (Cuti)": "I",
    };
    prefix = agendaPrefixes[agendaType || ""] || "AGD";
  } else if (category === "NOTA_VERIFIKASI") {
    prefix = "V";
  } else if (category === "NOTA_DIVISI") {
    prefix = "ND";
  }

  const yearOfLetter = letterDate.getFullYear();
  const startOfYear = new Date(yearOfLetter, 0, 1, 0, 0, 0);
  const endOfYear = new Date(yearOfLetter, 11, 31, 23, 59, 59);

  // Ambil seluruh dokumen dengan prefix yang sama yang aktif di tahun yang sama
  const samePrefixLetters = await prisma.letter.findMany({
    where: {
      category,
      agendaType: category === "AGENDA" ? agendaType : undefined,
      type: category === "KELUAR_MASUK" ? type : undefined,
      status: "ACTIVE",
      letterDate: {
        gte: startOfYear,
        lte: endOfYear,
      },
    },
    orderBy: [
      { letterDate: "asc" },
      { createdAt: "asc" },
    ],
  });

  if (samePrefixLetters.length === 0) {
    return `${prefix}-001`;
  }

  // Parse nomor surat
  const parsedLetters = samePrefixLetters
    .map((l) => {
      const parsed = parseLetterNumber(l.letterNumber, prefix);
      if (!parsed) return null;
      return {
        id: l.id,
        letterDate: new Date(l.letterDate),
        baseNumber: parsed.baseNumber,
        suffix: parsed.suffix,
        createdAt: new Date(l.createdAt),
      };
    })
    .filter((l) => l !== null) as {
      id: string;
      letterDate: Date;
      baseNumber: number;
      suffix: string;
      createdAt: Date;
    }[];

  if (parsedLetters.length === 0) {
    return `${prefix}-001`;
  }

  // Cek backdate
  const targetTime = letterDate.getTime();
  const afterLetters = parsedLetters.filter((l) => l.letterDate.getTime() > targetTime);
  const isBackdated = afterLetters.length > 0;

  if (!isBackdated) {
    const maxBase = Math.max(...parsedLetters.map((l) => l.baseNumber));
    const nextBase = maxBase > 0 ? maxBase + 1 : 1;
    return `${prefix}-${String(nextBase).padStart(3, "0")}`;
  } else {
    let baseNumberToUse = 1;

    const candidateBases = Array.from(
      new Set(
        parsedLetters
          .filter((l) => l.letterDate.getTime() <= targetTime)
          .map((l) => l.baseNumber)
      )
    ).sort((a, b) => b - a);

    let foundValidBase = false;
    for (const B of candidateBases) {
      const hasFutureSibling = parsedLetters.some(
        (l) => l.baseNumber === B && l.letterDate.getTime() > targetTime
      );
      if (!hasFutureSibling) {
        baseNumberToUse = B;
        foundValidBase = true;
        break;
      }
    }

    if (!foundValidBase) {
      if (candidateBases.length > 0) {
        baseNumberToUse = candidateBases[candidateBases.length - 1]; // Terkecil dari candidate
      } else {
        const allBases = parsedLetters.map((l) => l.baseNumber);
        baseNumberToUse = Math.min(...allBases);
      }
    }

    const siblings = parsedLetters.filter((l) => l.baseNumber === baseNumberToUse);
    const suffixIndexes = siblings.map((l) => suffixToIndex(l.suffix));
    const maxSuffixIndex = Math.max(...suffixIndexes);
    const nextSuffixIndex = maxSuffixIndex + 1;
    const nextSuffix = getSuffix(nextSuffixIndex);

    return `${prefix}-${String(baseNumberToUse).padStart(3, "0")}${nextSuffix}`;
  }
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

import { processAndSaveFile } from "@/lib/serverFileUtils";

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
  const customLetterNumber = formData.get("customLetterNumber") as string;

  // Field spesifik kategori
  const type = formData.get("type") as string; // KELUAR_MASUK, SURAT_DINAS_INTERNAL
  const sender = formData.get("sender") as string; // KELUAR_MASUK, SURAT_DINAS_INTERNAL
  const recipient = formData.get("recipient") as string; // KELUAR_MASUK, AGENDA, SURAT_DINAS_INTERNAL
  const receivedDate = formData.get("receivedDate") as string; // KELUAR_MASUK

  const agendaType = formData.get("agendaType") as string; // AGENDA
  const code = formData.get("code") as string; // AGENDA, KELUAR_MASUK (sebagai nomor petunjuk)

  const nomorBerkas = formData.get("nomorBerkas") as string; // KELUAR_MASUK
  const nomorPetunjuk = formData.get("nomorPetunjuk") as string; // KELUAR_MASUK

  const nominalStr = formData.get("nominal") as string; // NOTA_VERIFIKASI
  const paraf = formData.get("paraf") as string; // NOTA_VERIFIKASI

  // Field Spesifik Surat Dinas Internal
  const sdiNomor = formData.get("sdiNomor") as string;
  const sdiKodeDivisi = formData.get("sdiKodeDivisi") as string;
  const sdiNoTanggal = formData.get("sdiNoTanggal") as string;
  const tembusan = formData.get("tembusan") as string;
  const jumlahLembar = formData.get("jumlahLembar") as string;

  // File Upload Backup
  const attachmentFile = formData.get("attachment") as File | null;
  let fileData = null;
  if (attachmentFile && attachmentFile.size > 0) {
    fileData = await processAndSaveFile(attachmentFile);
  }

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
  } else if (category === "SURAT_DINAS_INTERNAL") {
    if (!type || !subject || !letterDate || !sender || !recipient) {
      return { error: "Field Tipe, Pengirim (Dari), Penerima (Kepada), Perihal (Hal), dan Tanggal wajib diisi." };
    }
  }

  const nominal = nominalStr ? parseFloat(nominalStr.replace(/[^0-9.-]+/g, "")) : null;

  let letterNumber = "";
  if (customLetterNumber && customLetterNumber.trim()) {
    letterNumber = customLetterNumber.trim();
    // Periksa keunikan nomor surat manual
    const existing = await prisma.letter.findUnique({ where: { letterNumber } });
    if (existing) {
      return { error: `Nomor surat "${letterNumber}" sudah terdaftar di sistem. Harap gunakan nomor yang berbeda.` };
    }
  } else if (category === "SURAT_DINAS_INTERNAL" && (sdiNomor || sdiKodeDivisi || sdiNoTanggal)) {
    const num = (sdiNomor || "001").trim();
    const div = (sdiKodeDivisi || "DIV").trim();
    const dt = (sdiNoTanggal || "01").trim();
    letterNumber = `SDI-${num}/06040/${div}/${dt}`;

    // Periksa keunikan nomor surat manual SDI
    const existing = await prisma.letter.findUnique({ where: { letterNumber } });
    if (existing) {
      return { error: `Nomor surat "${letterNumber}" sudah terdaftar di sistem. Harap gunakan nomor urut yang berbeda.` };
    }
  } else {
    letterNumber = await generateLetterNumber(category, new Date(letterDate), agendaType, type);
  }

  const letter = await prisma.letter.create({
    data: {
      letterNumber,
      category,
      type: (category === "KELUAR_MASUK" || category === "SURAT_DINAS_INTERNAL") ? type : null,
      subject,
      sender: (category === "KELUAR_MASUK" || category === "SURAT_DINAS_INTERNAL") ? sender : null,
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
      nominal: (category === "NOTA_VERIFIKASI" || category === "NOTA_DIVISI") ? nominal : null,
      paraf: (category === "NOTA_VERIFIKASI" || category === "NOTA_DIVISI") ? paraf : null,
      tembusan: category === "SURAT_DINAS_INTERNAL" ? (tembusan || null) : null,
      jumlahLembar: category === "SURAT_DINAS_INTERNAL" ? (jumlahLembar || null) : null,
      fileUrl: fileData?.fileUrl || null,
      fileName: fileData?.fileName || null,
      fileSize: fileData?.fileSize || null,
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
      tembusan: letter.tembusan,
      jumlahLembar: letter.jumlahLembar,
      fileUrl: letter.fileUrl,
      fileName: letter.fileName,
      fileSize: letter.fileSize,
    },
  });

  // Ambil data form
  const type = formData.get("type") as string;
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
  const tembusan = formData.get("tembusan") as string;
  const jumlahLembar = formData.get("jumlahLembar") as string;

  // File Upload Backup Baru
  const attachmentFile = formData.get("attachment") as File | null;
  let fileData = null;
  if (attachmentFile && attachmentFile.size > 0) {
    fileData = await processAndSaveFile(attachmentFile);
  }

  const nominal = nominalStr ? parseFloat(nominalStr.replace(/[^0-9.-]+/g, "")) : letter.nominal;

  const updated = await prisma.letter.update({
    where: { id: letterId },
    data: {
      type: (letter.category === "KELUAR_MASUK" || letter.category === "SURAT_DINAS_INTERNAL") ? (type || letter.type) : null,
      subject: subject || letter.subject,
      sender: (letter.category === "KELUAR_MASUK" || letter.category === "SURAT_DINAS_INTERNAL") ? (sender || letter.sender) : null,
      recipient: letter.category === "NOTA_VERIFIKASI" ? null : (recipient || letter.recipient),
      letterDate: letterDate ? new Date(letterDate) : letter.letterDate,
      description: description ?? letter.description,
      classification: classification || letter.classification,
      agendaType: letter.category === "AGENDA" ? (agendaType || letter.agendaType) : null,
      code: letter.category === "AGENDA" ? (code || letter.code) : null,
      nomorBerkas: letter.category === "KELUAR_MASUK" ? (nomorBerkas || letter.nomorBerkas) : null,
      nomorPetunjuk: letter.category === "KELUAR_MASUK" ? (nomorPetunjuk || letter.nomorPetunjuk) : null,
      nominal: (letter.category === "NOTA_VERIFIKASI" || letter.category === "NOTA_DIVISI") ? (nominalStr ? nominal : letter.nominal) : null,
      paraf: (letter.category === "NOTA_VERIFIKASI" || letter.category === "NOTA_DIVISI") ? (paraf || letter.paraf) : null,
      tembusan: letter.category === "SURAT_DINAS_INTERNAL" ? (tembusan ?? letter.tembusan) : null,
      jumlahLembar: letter.category === "SURAT_DINAS_INTERNAL" ? (jumlahLembar ?? letter.jumlahLembar) : null,
      fileUrl: fileData ? fileData.fileUrl : letter.fileUrl,
      fileName: fileData ? fileData.fileName : letter.fileName,
      fileSize: fileData ? fileData.fileSize : letter.fileSize,
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

// ============================================
// Helper: Membangun Filter Tanggal
// ============================================
function buildDateFilter(
  startDate?: string,
  endDate?: string,
  month?: number | string,
  year?: number | string
) {
  if (startDate || endDate) {
    const filter: Record<string, any> = {};
    if (startDate) {
      filter.gte = new Date(startDate + "T00:00:00");
    }
    if (endDate) {
      filter.lte = new Date(endDate + "T23:59:59");
    }
    return filter;
  }
  
  if (month || year) {
    const currentYear = new Date().getFullYear();
    const parsedYear = year ? parseInt(String(year), 10) : currentYear;
    if (month) {
      const parsedMonth = parseInt(String(month), 10);
      const start = new Date(parsedYear, parsedMonth - 1, 1, 0, 0, 0);
      const end = new Date(parsedYear, parsedMonth, 0, 23, 59, 59);
      return { gte: start, lte: end };
    } else {
      const start = new Date(parsedYear, 0, 1, 0, 0, 0);
      const end = new Date(parsedYear, 12, 0, 23, 59, 59);
      return { gte: start, lte: end };
    }
  }
  return undefined;
}

export async function getLetters(params?: {
  category?: string;
  type?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  month?: number;
  year?: number;
  agendaType?: string;
}) {
  await getAuthenticatedUser();

  const page = params?.page || 1;
  const limit = params?.limit || 15;
  const skip = (page - 1) * limit;

  const where: Record<string, any> = {};

  if (params?.category && params.category !== "ALL") {
    where.category = params.category;
  }
  if (params?.type && params.type !== "ALL") {
    where.type = params.type;
  }
  if (params?.agendaType && params.agendaType !== "ALL") {
    where.agendaType = params.agendaType;
  }
  if (params?.status && params.status !== "ALL") {
    where.status = params.status;
  } else {
    where.status = "ACTIVE"; // Default: tampilkan hanya surat aktif
  }

  const dateFilter = buildDateFilter(params?.startDate, params?.endDate, params?.month, params?.year);
  if (dateFilter) {
    where.letterDate = dateFilter;
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
export async function getDashboardStats(params?: {
  startDate?: string;
  endDate?: string;
  month?: number;
  year?: number;
}) {
  await getAuthenticatedUser();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const baseWhere: Record<string, any> = { status: "ACTIVE" };
  const dateFilter = buildDateFilter(params?.startDate, params?.endDate, params?.month, params?.year);
  if (dateFilter) {
    baseWhere.letterDate = dateFilter;
  }

  const oneYearAgo = new Date();
  oneYearAgo.setHours(0, 0, 0, 0);
  oneYearAgo.setDate(oneYearAgo.getDate() - 365);

  const [
    totalLetters,
    suratMasuk,
    suratKeluar,
    suratBulanIni,
    recentLogs,
    recentLetters,
    heatmapDataRaw,
  ] = await Promise.all([
    prisma.letter.count({ where: baseWhere }),
    prisma.letter.count({
      where: { ...baseWhere, type: "MASUK" },
    }),
    prisma.letter.count({
      where: { ...baseWhere, type: "KELUAR" },
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
    prisma.letter.findMany({
      where: {
        status: "ACTIVE",
        letterDate: { gte: oneYearAgo },
      },
      select: {
        letterDate: true,
      },
    }),
  ]);

  const heatmap: Record<string, number> = {};
  heatmapDataRaw.forEach((item) => {
    try {
      const d = new Date(item.letterDate);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const date = String(d.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${date}`;
      heatmap[dateStr] = (heatmap[dateStr] || 0) + 1;
    } catch (e) {
      // ignore
    }
  });

  return {
    totalLetters,
    suratMasuk,
    suratKeluar,
    suratBulanIni,
    recentLogs,
    recentLetters,
    heatmap,
  };
}

// ============================================
// Ambil Audit Logs (Admin only)
// ============================================
export async function getAuditLogs(params?: {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  month?: number;
  year?: number;
}) {
  await requireRole(["ADMIN"]);

  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const skip = (page - 1) * limit;

  const where: Record<string, any> = {};
  const dateFilter = buildDateFilter(params?.startDate, params?.endDate, params?.month, params?.year);
  if (dateFilter) {
    where.createdAt = dateFilter;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        letter: { select: { letterNumber: true, subject: true } },
      },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
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
  startDate?: string;
  endDate?: string;
  month?: number;
  year?: number;
  agendaType?: string;
}) {
  await getAuthenticatedUser();

  const where: Record<string, any> = {
    status: "ACTIVE",
  };

  if (params?.category && params.category !== "ALL") {
    where.category = params.category;
  }
  if (params?.type && params.type !== "ALL") {
    where.type = params.type;
  }
  if (params?.agendaType && params.agendaType !== "ALL") {
    where.agendaType = params.agendaType;
  }

  const dateFilter = buildDateFilter(params?.startDate, params?.endDate, params?.month, params?.year);
  if (dateFilter) {
    where.letterDate = dateFilter;
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
