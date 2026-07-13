import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ============================================
// Konfigurasi Kop Surat
// ============================================
const COMPANY_NAME = "PERUM BULOG";
const COMPANY_DIVISION = "KANTOR WILAYAH SUMATERA SELATAN & BANGKA BELITUNG";
const COMPANY_ADDRESS = "Jl. Perintis Kemerdekaan No.1, Duku, Ilir Tim. II, Kota Palembang, Sumatera Selatan 30114, Indonesia";
const COMPANY_PHONE = "Telp: (0711) 712-246 | Web: bulog.co.id";

interface LetterExportData {
  id: string;
  letterNumber: string;
  category: string;
  type: string | null;
  subject: string;
  sender: string | null;
  recipient: string | null;
  letterDate: Date | string;
  classification: string;
  status: string;
  agendaType: string | null;
  code: string | null;
  nomorBerkas: string | null;
  nomorPetunjuk: string | null;
  nominal: number | null;
  paraf: string | null;
  createdBy: { name: string };
}

function formatDateShort(date: Date | string) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

// ============================================
// Export ke Excel (.xlsx)
// ============================================
// ============================================
// Export ke Excel (.xlsx)
// ============================================
export function exportToExcel(letters: LetterExportData[], filterLabel: string, periodLabel: string) {
  const now = new Date();

  // Determine column headers and row mapping based on category
  let columnHeaders: string[] = [];
  let dataRows: any[][] = [];

  // Check if all letters share the same category
  const firstCategory = letters.length > 0 ? letters[0].category : "ALL";
  const isUniformCategory = letters.every((l) => l.category === firstCategory);
  const activeCategory = isUniformCategory ? firstCategory : "ALL";

  if (activeCategory === "AGENDA") {
    columnHeaders = [
      "No",
      "Nomor Agenda",
      "Jenis Agenda",
      "Perihal",
      "Tujuan",
      "Tanggal Agenda",
      "Kode Arsip",
      "Status",
      "Didata Oleh",
    ];
    dataRows = letters.map((l, i) => [
      i + 1,
      l.letterNumber,
      l.agendaType || "—",
      l.subject,
      l.recipient || "—",
      formatDateShort(l.letterDate),
      l.code || "—",
      l.status === "ACTIVE" ? "Aktif" : "Arsip",
      l.createdBy.name,
    ]);
  } else if (activeCategory === "KELUAR_MASUK") {
    columnHeaders = [
      "No",
      "Nomor Surat",
      "Tipe",
      "Perihal",
      "Pengirim",
      "Penerima",
      "Tanggal Surat",
      "No. Berkas",
      "No. Petunjuk",
      "Status",
      "Didata Oleh",
    ];
    dataRows = letters.map((l, i) => [
      i + 1,
      l.letterNumber,
      l.type === "MASUK" ? "Masuk" : "Keluar",
      l.subject,
      l.sender || "—",
      l.recipient || "—",
      formatDateShort(l.letterDate),
      l.nomorBerkas || "—",
      l.nomorPetunjuk || "—",
      l.status === "ACTIVE" ? "Aktif" : "Arsip",
      l.createdBy.name,
    ]);
  } else if (activeCategory === "NOTA_VERIFIKASI") {
    columnHeaders = [
      "No",
      "Nomor Nota",
      "Perihal",
      "Tanggal Verifikasi",
      "Nominal",
      "Paraf",
      "Status",
      "Didata Oleh",
    ];
    dataRows = letters.map((l, i) => [
      i + 1,
      l.letterNumber,
      l.subject,
      formatDateShort(l.letterDate),
      l.nominal ? formatRupiah(l.nominal) : "—",
      l.paraf || "—",
      l.status === "ACTIVE" ? "Aktif" : "Arsip",
      l.createdBy.name,
    ]);
  } else {
    // ALL categories
    columnHeaders = [
      "No",
      "Nomor Dokumen",
      "Kategori",
      "Perihal",
      "Pihak Terkait",
      "Tanggal",
      "Detail Spesifik",
      "Status",
      "Didata Oleh",
    ];
    dataRows = letters.map((l, i) => {
      let detail = "—";
      if (l.category === "AGENDA") detail = `Jenis: ${l.agendaType}`;
      else if (l.category === "KELUAR_MASUK") detail = `Tipe: ${l.type}`;
      else if (l.category === "NOTA_VERIFIKASI") detail = `Nominal: ${l.nominal ? formatRupiah(l.nominal) : "—"}`;

      return [
        i + 1,
        l.letterNumber,
        l.category.replace("_", " "),
        l.subject,
        l.recipient || l.sender || "—",
        formatDateShort(l.letterDate),
        detail,
        l.status === "ACTIVE" ? "Aktif" : "Arsip",
        l.createdBy.name,
      ];
    });
  }

  // Header rows (kop surat)
  const headerRows = [
    [COMPANY_NAME],
    [COMPANY_DIVISION],
    [COMPANY_ADDRESS],
    [COMPANY_PHONE],
    [""],
    [`REKAPITULASI ${filterLabel.toUpperCase()}`],
    [periodLabel],
    [""],
  ];

  const allRows = [...headerRows, columnHeaders, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  const colCount = columnHeaders.length;
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: colCount - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: colCount - 1 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: colCount - 1 } },
    { s: { r: 5, c: 0 }, e: { r: 5, c: colCount - 1 } },
    { s: { r: 6, c: 0 }, e: { r: 6, c: colCount - 1 } },
  ];

  // Auto-width logic or standard widths
  ws["!cols"] = Array(colCount).fill({ wch: 15 });
  ws["!cols"][0] = { wch: 4 }; // No
  ws["!cols"][1] = { wch: 22 }; // Nomor
  ws["!cols"][3] = { wch: 35 }; // Perihal

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Rekap Dokumen");

  const filename = `rekap_${filterLabel.toLowerCase().replace(/\s+/g, "_")}_${now.toISOString().split("T")[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// ============================================
// Export ke PDF
// ============================================
export function exportToPdf(letters: LetterExportData[], filterLabel: string, periodLabel: string) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Kop Surat - Times New Roman
  doc.setFontSize(16);
  doc.setFont("times", "bold");
  doc.text(COMPANY_NAME, pageWidth / 2, 18, { align: "center" });

  doc.setFontSize(11);
  doc.text(COMPANY_DIVISION, pageWidth / 2, 25, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("times", "normal");
  doc.text(COMPANY_ADDRESS, pageWidth / 2, 31, { align: "center" });

  doc.setFontSize(8);
  doc.text(COMPANY_PHONE, pageWidth / 2, 36, { align: "center" });

  doc.setLineWidth(0.8);
  doc.line(14, 39, pageWidth - 14, 39);
  doc.setLineWidth(0.3);
  doc.line(14, 40, pageWidth - 14, 40);

  doc.setFontSize(12);
  doc.setFont("times", "bold");
  doc.text(`REKAPITULASI ${filterLabel.toUpperCase()}`, pageWidth / 2, 48, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("times", "normal");
  doc.text(periodLabel, pageWidth / 2, 54, { align: "center" });

  // Map fields dynamically based on category
  const firstCategory = letters.length > 0 ? letters[0].category : "ALL";
  const isUniformCategory = letters.every((l) => l.category === firstCategory);
  const activeCategory = isUniformCategory ? firstCategory : "ALL";

  let headers: string[] = [];
  let bodyData: string[][] = [];
  let columnStyles: any = {};
  let totalTableWidth = 240;

  if (activeCategory === "AGENDA") {
    headers = ["No", "Nomor Agenda", "Jenis Agenda", "Perihal", "Tujuan", "Tanggal", "Kode", "Status"];
    bodyData = letters.map((l, i) => [
      (i + 1).toString(),
      l.letterNumber,
      l.agendaType || "—",
      l.subject,
      l.recipient || "—",
      formatDateShort(l.letterDate),
      l.code || "—",
      l.status === "ACTIVE" ? "Aktif" : "Arsip",
    ]);
    columnStyles = {
      0: { halign: "center", cellWidth: 10 },
      1: { cellWidth: 32 },
      2: { cellWidth: 35 },
      3: { cellWidth: 60 },
      4: { cellWidth: 40 },
      5: { halign: "center", cellWidth: 25 },
      6: { halign: "center", cellWidth: 20 },
      7: { halign: "center", cellWidth: 18 },
    };
    totalTableWidth = 240; // Total: 10+32+35+60+40+25+20+18 = 240
  } else if (activeCategory === "KELUAR_MASUK") {
    headers = ["No", "Nomor Surat", "Tipe", "Perihal", "Pengirim", "Penerima", "Tanggal", "No. Berkas", "No. Petunjuk"];
    bodyData = letters.map((l, i) => [
      (i + 1).toString(),
      l.letterNumber,
      l.type === "MASUK" ? "Masuk" : "Keluar",
      l.subject,
      l.sender || "—",
      l.recipient || "—",
      formatDateShort(l.letterDate),
      l.nomorBerkas || "—",
      l.nomorPetunjuk || "—",
    ]);
    columnStyles = {
      0: { halign: "center", cellWidth: 10 },
      1: { cellWidth: 30 },
      2: { halign: "center", cellWidth: 16 },
      3: { cellWidth: 55 },
      4: { cellWidth: 35 },
      5: { cellWidth: 35 },
      6: { halign: "center", cellWidth: 24 },
      7: { cellWidth: 20 },
      8: { cellWidth: 20 },
    };
    totalTableWidth = 245; // Total: 10+30+16+55+35+35+24+20+20 = 245
  } else if (activeCategory === "NOTA_VERIFIKASI") {
    headers = ["No", "Nomor Nota", "Perihal", "Tanggal", "Nominal", "Paraf", "Status"];
    bodyData = letters.map((l, i) => [
      (i + 1).toString(),
      l.letterNumber,
      l.subject,
      formatDateShort(l.letterDate),
      l.nominal ? formatRupiah(l.nominal) : "—",
      l.paraf || "—",
      l.status === "ACTIVE" ? "Aktif" : "Arsip",
    ]);
    columnStyles = {
      0: { halign: "center", cellWidth: 12 },
      1: { cellWidth: 40 },
      2: { cellWidth: 80 },
      3: { halign: "center", cellWidth: 30 },
      4: { halign: "right", cellWidth: 35 },
      5: { halign: "center", cellWidth: 35 },
      6: { halign: "center", cellWidth: 20 },
    };
    totalTableWidth = 252; // Total: 12+40+80+30+35+35+20 = 252
  } else {
    headers = ["No", "Nomor Dokumen", "Kategori", "Perihal", "Penerima/Tujuan", "Tanggal", "Detail Info", "Status"];
    bodyData = letters.map((l, i) => {
      let detail = "—";
      if (l.category === "AGENDA") detail = `Jenis: ${l.agendaType}`;
      else if (l.category === "KELUAR_MASUK") detail = `Tipe: ${l.type}`;
      else if (l.category === "NOTA_VERIFIKASI") detail = `Nominal: ${l.nominal ? formatRupiah(l.nominal) : "—"}`;

      return [
        (i + 1).toString(),
        l.letterNumber,
        l.category.replace("_", " "),
        l.subject,
        l.recipient || l.sender || "—",
        formatDateShort(l.letterDate),
        detail,
        l.status === "ACTIVE" ? "Aktif" : "Arsip",
      ];
    });
    columnStyles = {
      0: { halign: "center", cellWidth: 10 },
      1: { cellWidth: 30 },
      2: { cellWidth: 28 },
      3: { cellWidth: 55 },
      4: { cellWidth: 40 },
      5: { halign: "center", cellWidth: 24 },
      6: { cellWidth: 35 },
      7: { halign: "center", cellWidth: 18 },
    };
    totalTableWidth = 240; // Total: 10+30+28+55+40+24+35+18 = 240
  }

  // Centering Table Horizontally
  const leftMargin = (pageWidth - totalTableWidth) / 2;

  autoTable(doc, {
    startY: 58,
    head: [headers],
    body: bodyData,
    theme: "grid",
    styles: {
      font: "times",
      fontSize: 8,
      cellPadding: 3,
      lineColor: [100, 100, 100],
      lineWidth: 0.2,
    },
    headStyles: {
      font: "times",
      fillColor: [40, 40, 40],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
      fontSize: 8,
    },
    margin: { left: leftMargin, right: leftMargin },
    columnStyles,
    alternateRowStyles: {
      fillColor: [248, 248, 248],
    },
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(7);
      doc.setFont("times", "normal");
      doc.text(
        `Dicetak pada: ${dateStr} — Halaman ${data.pageNumber} dari ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: "center" }
      );
      doc.text(
        "Dokumen ini dihasilkan oleh Sistem E-Surat — Data terverifikasi secara kriptografis (SHA-256)",
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 4,
        { align: "center" }
      );
    },
  });

  const filename = `rekap_${filterLabel.toLowerCase().replace(/\s+/g, "_")}_${now.toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
}
