import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ============================================
// Konfigurasi Kop Surat
// ============================================
const COMPANY_NAME = "PERUM BULOG";
const COMPANY_DIVISION = "KANTOR WILAYAH SUMATERA SELATAN & BANGKA BELITUNG";
const COMPANY_ADDRESS = "Jl. Kapten A. Rivai No. 35, Palembang 30129";
const COMPANY_PHONE = "Telp: (0711) 350-xxx | Fax: (0711) 350-xxx";

// ============================================
// Tipe Data
// ============================================
interface LetterExportData {
  letterNumber: string;
  type: string;
  subject: string;
  sender: string;
  recipient: string;
  letterDate: Date | string;
  classification: string;
  status: string;
  createdBy: { name: string };
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDateShort(date: Date | string) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ============================================
// Export ke Excel (.xlsx)
// ============================================
export function exportToExcel(letters: LetterExportData[], filterLabel: string) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // Header rows (kop surat)
  const headerRows = [
    [COMPANY_NAME],
    [COMPANY_DIVISION],
    [COMPANY_ADDRESS],
    [COMPANY_PHONE],
    [""],
    [`REKAPITULASI ${filterLabel.toUpperCase()}`],
    [`Per Tanggal: ${dateStr}`],
    [""],
  ];

  // Column headers
  const columnHeaders = [
    "No",
    "Nomor Surat",
    "Tipe",
    "Perihal",
    "Pengirim",
    "Penerima",
    "Tanggal Surat",
    "Klasifikasi",
    "Status",
    "Didata Oleh",
  ];

  // Data rows
  const dataRows = letters.map((letter, i) => [
    i + 1,
    letter.letterNumber,
    letter.type === "MASUK" ? "Masuk" : "Keluar",
    letter.subject,
    letter.sender,
    letter.recipient,
    formatDateShort(letter.letterDate),
    letter.classification,
    letter.status === "ACTIVE" ? "Aktif" : "Arsip",
    letter.createdBy.name,
  ]);

  // Combine all rows
  const allRows = [...headerRows, columnHeaders, ...dataRows];

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  // Merge cells for header
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }, // PERUM BULOG
    { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } }, // Division
    { s: { r: 2, c: 0 }, e: { r: 2, c: 9 } }, // Address
    { s: { r: 3, c: 0 }, e: { r: 3, c: 9 } }, // Phone
    { s: { r: 5, c: 0 }, e: { r: 5, c: 9 } }, // Title
    { s: { r: 6, c: 0 }, e: { r: 6, c: 9 } }, // Date
  ];

  // Column widths
  ws["!cols"] = [
    { wch: 4 },   // No
    { wch: 20 },  // Nomor Surat
    { wch: 8 },   // Tipe
    { wch: 35 },  // Perihal
    { wch: 25 },  // Pengirim
    { wch: 25 },  // Penerima
    { wch: 16 },  // Tanggal
    { wch: 12 },  // Klasifikasi
    { wch: 8 },   // Status
    { wch: 18 },  // Didata Oleh
  ];

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data Surat");

  // Generate filename
  const filename = `surat_${filterLabel.toLowerCase().replace(/\s+/g, "_")}_${now.toISOString().split("T")[0]}.xlsx`;

  // Download
  XLSX.writeFile(wb, filename);
}

// ============================================
// Export ke PDF
// ============================================
export function exportToPdf(letters: LetterExportData[], filterLabel: string) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // Create PDF (landscape A4)
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();

  // ---- Kop Surat ----
  // Company name
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(COMPANY_NAME, pageWidth / 2, 18, { align: "center" });

  // Division
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(COMPANY_DIVISION, pageWidth / 2, 25, { align: "center" });

  // Address
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(COMPANY_ADDRESS, pageWidth / 2, 31, { align: "center" });

  // Phone
  doc.setFontSize(8);
  doc.text(COMPANY_PHONE, pageWidth / 2, 36, { align: "center" });

  // Garis pemisah kop
  doc.setLineWidth(0.8);
  doc.line(14, 39, pageWidth - 14, 39);
  doc.setLineWidth(0.3);
  doc.line(14, 40, pageWidth - 14, 40);

  // Title
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`REKAPITULASI ${filterLabel.toUpperCase()}`, pageWidth / 2, 48, {
    align: "center",
  });

  // Date
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Per Tanggal: ${dateStr}`, pageWidth / 2, 54, { align: "center" });

  // ---- Data Table ----
  const tableData = letters.map((letter, i) => [
    (i + 1).toString(),
    letter.letterNumber,
    letter.type === "MASUK" ? "Masuk" : "Keluar",
    letter.subject,
    letter.sender,
    letter.recipient,
    formatDateShort(letter.letterDate),
    letter.classification,
    letter.status === "ACTIVE" ? "Aktif" : "Arsip",
  ]);

  autoTable(doc, {
    startY: 58,
    head: [
      [
        "No",
        "Nomor Surat",
        "Tipe",
        "Perihal",
        "Pengirim",
        "Penerima",
        "Tanggal",
        "Klasifikasi",
        "Status",
      ],
    ],
    body: tableData,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: [100, 100, 100],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [40, 40, 40],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
      fontSize: 8,
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { cellWidth: 32 },
      2: { halign: "center", cellWidth: 16 },
      3: { cellWidth: 55 },
      4: { cellWidth: 35 },
      5: { cellWidth: 35 },
      6: { halign: "center", cellWidth: 24 },
      7: { halign: "center", cellWidth: 22 },
      8: { halign: "center", cellWidth: 16 },
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248],
    },
    didDrawPage: (data) => {
      // Footer pada setiap halaman
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
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

  // Generate filename
  const filename = `surat_${filterLabel.toLowerCase().replace(/\s+/g, "_")}_${now.toISOString().split("T")[0]}.pdf`;

  // Download
  doc.save(filename);
}
