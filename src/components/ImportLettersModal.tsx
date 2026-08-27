"use client";

import { useState } from "react";
import { createLetterAction } from "@/actions/letters";
import { DIVISION_UNITS, getDivisionUnitLabel, isValidDivisionUnit } from "@/lib/divisions";
import { X, Upload, FileSpreadsheet, Check, AlertTriangle, Play } from "lucide-react";
import * as XLSX from "xlsx";

interface ImportLettersModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const agendaTypes = [
  "Surat Perintah",
  "Surat Keputusan",
  "Surat Perjanjian Kerjasama",
  "Berita Acara Serah Terima",
  "Berita Acara",
  "Surat Pengantar",
  "Edaran",
  "Pengumuman",
  "Surat Keterangan/Pernyataan",
  "Memo/Nota Intern",
  "Surat Kuasa",
  "Undangan",
  "Claim",
  "Surat Izin (Cuti)",
];

const categoryLabels: Record<string, string> = {
  KELUAR_MASUK: "Surat Keluar / Masuk",
  AGENDA: "Surat Agenda",
  NOTA_VERIFIKASI: "Nota Verifikasi",
  NOTA_DIVISI: "Nota Internal / Divisi",
  SURAT_DINAS_INTERNAL: "Surat Dinas Internal",
};

function normalizeDivisionUnit(value: string) {
  const clean = value.trim();
  if (isValidDivisionUnit(clean)) return clean;

  const byLabel = DIVISION_UNITS.find((unit) => unit.label.toLowerCase() === clean.toLowerCase());
  return byLabel?.value || clean;
}

export function ImportLettersModal({ onClose, onSuccess }: ImportLettersModalProps) {
  const [category, setCategory] = useState<"KELUAR_MASUK" | "AGENDA" | "NOTA_VERIFIKASI" | "NOTA_DIVISI" | "SURAT_DINAS_INTERNAL">(
    "KELUAR_MASUK"
  );
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  // Generate and Download Excel Template dynamically
  const handleDownloadTemplate = () => {
    let headers: string[] = [];
    let sampleData: Record<string, string>[] = [];

    if (category === "KELUAR_MASUK") {
      headers = [
        "Nomor Surat (Opsional)",
        "Tanggal Surat (YYYY-MM-DD)",
        "Tipe (MASUK/KELUAR)",
        "Pengirim",
        "Penerima",
        "Perihal",
        "Klasifikasi (BIASA/PENTING/RAHASIA)",
        "Keterangan",
        "Nomor Berkas",
        "Nomor Petunjuk",
        "Tanggal Diterima (YYYY-MM-DD)"
      ];
      sampleData = [{
        "Nomor Surat (Opsional)": "SM-202606-0001",
        "Tanggal Surat (YYYY-MM-DD)": "2026-06-01",
        "Tipe (MASUK/KELUAR)": "MASUK",
        "Pengirim": "Kementerian Pertanian",
        "Penerima": "Perum BULOG",
        "Perihal": "Permohonan Stok Beras",
        "Klasifikasi (BIASA/PENTING/RAHASIA)": "PENTING",
        "Keterangan": "Segera ditindaklanjuti",
        "Nomor Berkas": "001",
        "Nomor Petunjuk": "002",
        "Tanggal Diterima (YYYY-MM-DD)": "2026-06-02"
      }];
    } else if (category === "AGENDA") {
      headers = [
        "Nomor Surat (Opsional)",
        "Tanggal Surat (YYYY-MM-DD)",
        "Jenis Agenda (Surat Perintah/Surat Keputusan/...)",
        "Tujuan",
        "Perihal",
        "Kode Arsip",
        "Keterangan"
      ];
      sampleData = [{
        "Nomor Surat (Opsional)": "SP-001",
        "Tanggal Surat (YYYY-MM-DD)": "2026-06-01",
        "Jenis Agenda (Surat Perintah/Surat Keputusan/...)": "Surat Perintah",
        "Tujuan": "Divisi SDM",
        "Perihal": "Penunjukan Panitia Diklat",
        "Kode Arsip": "SDM-01",
        "Keterangan": "Arsip aktif"
      }];
    } else if (category === "NOTA_VERIFIKASI" || category === "NOTA_DIVISI") {
      headers = [
        "Nomor Surat (Opsional)",
        "Divisi / Unit (Enum)",
        "Tanggal Surat (YYYY-MM-DD)",
        "Perihal",
        "Nominal (Angka saja)",
        "Paraf/Disetujui Oleh",
        "Keterangan"
      ];
      sampleData = [{
        "Nomor Surat (Opsional)": "V/ND-001",
        "Divisi / Unit (Enum)": "MINKU_TU",
        "Tanggal Surat (YYYY-MM-DD)": "2026-06-01",
        "Perihal": "Reimburse Uang Jalan",
        "Nominal (Angka saja)": "150000",
        "Paraf/Disetujui Oleh": "Manager Adm. & Keuangan",
        "Keterangan": "Sudah verifikasi"
      }];
    } else if (category === "SURAT_DINAS_INTERNAL") {
      headers = [
        "Nomor Surat (Opsional - Jika ingin manual)",
        "Tanggal Surat (YYYY-MM-DD)",
        "Tipe (MASUK/KELUAR)",
        "Pengirim (Dari)",
        "Penerima (Kepada)",
        "Perihal (Hal)",
        "Klasifikasi (BIASA/PENTING/RAHASIA)",
        "Nomor Urut SDI (Angka, Contoh: 001)",
        "Kode Divisi SDI (Contoh: SPI)",
        "No/Tanggal Suffix SDI (Contoh: 01)",
        "Tembusan",
        "Jumlah Lembar",
        "Keterangan"
      ];
      sampleData = [{
        "Nomor Surat (Opsional - Jika ingin manual)": "",
        "Tanggal Surat (YYYY-MM-DD)": "2026-06-01",
        "Tipe (MASUK/KELUAR)": "KELUAR",
        "Pengirim (Dari)": "Sekretariat Umum",
        "Penerima (Kepada)": "Kepala SPI",
        "Perihal (Hal)": "Undangan Rapat Evaluasi Kerja",
        "Klasifikasi (BIASA/PENTING/RAHASIA)": "BIASA",
        "Nomor Urut SDI (Angka, Contoh: 001)": "001",
        "Kode Divisi SDI (Contoh: SPI)": "SPI",
        "No/Tanggal Suffix SDI (Contoh: 01)": "01",
        "Tembusan": "Direktur Utama",
        "Jumlah Lembar": "2",
        "Keterangan": "Rapat di Lt. 2"
      }];
    }

    const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Template_Impor_${category}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Parse Excel to JSON array
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setSuccessMessage("");

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (json.length === 0) {
          setError("File Excel kosong atau format tidak sesuai.");
          setParsedRows([]);
          return;
        }

        setParsedRows(json);
      } catch (err) {
        setError("Gagal membaca file Excel. Harap periksa format file Anda.");
        setParsedRows([]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Map raw Excel properties to field names
  const getMappedRows = (): any[] => {
    return parsedRows.map((row, idx) => {
      const getVal = (possibleHeaders: string[]): string => {
        for (const h of possibleHeaders) {
          if (row[h] !== undefined) return String(row[h]).trim();
        }
        return "";
      };

      const customLetterNumber = getVal([
        "Nomor Surat (Opsional)",
        "Nomor Surat (Opsional - Jika ingin manual)",
        "Nomor Surat",
        "No. Surat",
        "No Surat",
        "Nomor Dokumen",
        "No. Dokumen",
        "No Dokumen"
      ]);
      const letterDate = getVal(["Tanggal Surat (YYYY-MM-DD)", "Tanggal Surat", "Tanggal", "Date"]);
      const type = getVal(["Tipe (MASUK/KELUAR)", "Tipe", "Tipe Surat", "Type"]);
      const sender = getVal(["Pengirim", "Pengirim (Dari)", "Dari", "Sender"]);
      const recipient = getVal(["Penerima", "Penerima (Kepada)", "Kepada", "Tujuan", "Recipient"]);
      const subject = getVal(["Perihal", "Perihal (Hal)", "Hal", "Subject"]);
      const classification = getVal(["Klasifikasi (BIASA/PENTING/RAHASIA)", "Klasifikasi", "Sifat Surat", "Classification"]);
      const description = getVal(["Keterangan", "Keterangan / Catatan Tambahan", "Description"]);
      const nomorBerkas = getVal(["Nomor Berkas", "Berkas"]);
      const nomorPetunjuk = getVal(["Nomor Petunjuk", "Petunjuk"]);
      const receivedDate = getVal(["Tanggal Diterima (YYYY-MM-DD)", "Tanggal Diterima", "Diterima Tanggal"]);
      const agendaType = getVal([
        "Jenis Agenda (Surat Perintah/Surat Keputusan/...)",
        "Jenis Agenda",
        "Agenda Type"
      ]);
      const code = getVal(["Kode Arsip", "Kode"]);
      const nominal = getVal(["Nominal (Angka saja)", "Nominal", "Jumlah (Rp)", "Amount"]);
      const paraf = getVal(["Paraf/Disetujui Oleh", "Paraf", "Disetujui Oleh"]);
      const divisionUnit = normalizeDivisionUnit(getVal([
        "Divisi / Unit (Enum)",
        "Divisi / Unit",
        "Division Unit",
        "divisionUnit",
        "Divisi",
        "Unit"
      ]));
      const sdiNomor = getVal(["Nomor Urut SDI (Angka, Contoh: 001)", "Nomor Urut SDI", "Nomor Urut"]);
      const sdiKodeDivisi = getVal(["Kode Divisi SDI (Contoh: SPI)", "Kode Divisi SDI", "Kode Divisi"]);
      const sdiNoTanggal = getVal(["No/Tanggal Suffix SDI (Contoh: 01)", "No/Tanggal Suffix SDI", "Suffix"]);
      const tembusan = getVal(["Tembusan"]);
      const jumlahLembar = getVal(["Jumlah Lembar", "Lembar"]);

      return {
        index: idx + 1,
        customLetterNumber,
        letterDate,
        type: type.toUpperCase(),
        sender,
        recipient,
        subject,
        classification: classification.toUpperCase() || "BIASA",
        description,
        nomorBerkas,
        nomorPetunjuk,
        receivedDate,
        agendaType,
        code,
        nominal,
        paraf,
        divisionUnit,
        sdiNomor,
        sdiKodeDivisi,
        sdiNoTanggal,
        tembusan,
        jumlahLembar
      };
    });
  };

  // Perform validation on each row
  const validateRow = (row: any): string[] => {
    const errors: string[] = [];

    if (!row.letterDate) {
      errors.push("Tanggal Surat kosong.");
    } else {
      const d = new Date(row.letterDate);
      if (isNaN(d.getTime())) {
        errors.push("Format Tanggal salah.");
      }
    }

    if (!row.subject) {
      errors.push("Perihal/Keterangan kosong.");
    }

    if (category === "KELUAR_MASUK") {
      if (!row.type || (row.type !== "MASUK" && row.type !== "KELUAR")) {
        errors.push("Tipe wajib 'MASUK'/'KELUAR'.");
      }
      if (!row.sender) errors.push("Pengirim kosong.");
      if (!row.recipient) errors.push("Penerima kosong.");
    } else if (category === "AGENDA") {
      if (!row.agendaType) {
        errors.push("Jenis Agenda kosong.");
      } else if (!agendaTypes.includes(row.agendaType)) {
        errors.push("Jenis Agenda tidak dikenal.");
      }
      if (!row.recipient) errors.push("Tujuan kosong.");
    } else if (category === "NOTA_VERIFIKASI" || category === "NOTA_DIVISI") {
      if (!isValidDivisionUnit(row.divisionUnit)) {
        errors.push("Divisi / Unit wajib salah satu enum yang valid.");
      }
      if (!row.nominal) {
        errors.push("Nominal kosong.");
      } else if (isNaN(Number(row.nominal))) {
        errors.push("Nominal bukan angka.");
      }
    } else if (category === "SURAT_DINAS_INTERNAL") {
      if (!row.type || (row.type !== "MASUK" && row.type !== "KELUAR")) {
        errors.push("Tipe wajib 'MASUK'/'KELUAR'.");
      }
      if (!row.sender) errors.push("Dari (Pengirim) kosong.");
      if (!row.recipient) errors.push("Kepada (Penerima) kosong.");
    }

    return errors;
  };

  const mappedRows = getMappedRows();
  const rowsWithValidation = mappedRows.map((row) => ({
    ...row,
    errors: validateRow(row)
  }));
  const totalErrors = rowsWithValidation.reduce((sum, r) => sum + r.errors.length, 0);

  // Bulk Import sequentially
  const handleImport = async () => {
    if (rowsWithValidation.length === 0 || totalErrors > 0) return;

    setImporting(true);
    setError("");
    setSuccessMessage("");
    setImportProgress(0);

    for (let i = 0; i < rowsWithValidation.length; i++) {
      const row = rowsWithValidation[i];
      const formData = new FormData();
      formData.append("category", category);
      formData.append("subject", row.subject);
      formData.append("letterDate", row.letterDate);
      formData.append("description", row.description);
      formData.append("classification", row.classification);
      if (row.customLetterNumber) {
        formData.append("customLetterNumber", row.customLetterNumber);
      }

      if (category === "KELUAR_MASUK" || category === "SURAT_DINAS_INTERNAL") {
        formData.append("type", row.type);
        formData.append("sender", row.sender);
        formData.append("recipient", row.recipient);
      }
      if (category === "KELUAR_MASUK") {
        formData.append("nomorBerkas", row.nomorBerkas);
        formData.append("nomorPetunjuk", row.nomorPetunjuk);
        if (row.receivedDate) {
          formData.append("receivedDate", row.receivedDate);
        }
      }
      if (category === "AGENDA") {
        formData.append("agendaType", row.agendaType);
        formData.append("recipient", row.recipient);
        formData.append("code", row.code);
      }
      if (category === "NOTA_VERIFIKASI" || category === "NOTA_DIVISI") {
        formData.append("nominal", row.nominal);
        formData.append("paraf", row.paraf);
        formData.append("divisionUnit", row.divisionUnit);
      }
      if (category === "SURAT_DINAS_INTERNAL") {
        formData.append("sdiNomor", row.sdiNomor);
        formData.append("sdiKodeDivisi", row.sdiKodeDivisi);
        formData.append("sdiNoTanggal", row.sdiNoTanggal);
        formData.append("tembusan", row.tembusan);
        formData.append("jumlahLembar", row.jumlahLembar);
      }

      try {
        const res = await createLetterAction(formData);
        if (res && res.error) {
          setError(`Gagal pada baris ke-${row.index}: ${res.error}`);
          setImporting(false);
          return;
        }
        setImportProgress(i + 1);
      } catch (err) {
        setError(`Terjadi kesalahan pada koneksi di baris ke-${row.index}.`);
        setImporting(false);
        return;
      }
    }

    setSuccessMessage(`Berhasil mengimpor ${rowsWithValidation.length} data dokumen.`);
    setImporting(false);
    onSuccess();
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && !importing && onClose()}>
      <div className="modal" style={{ maxWidth: "800px", width: "95%" }}>
        <div className="modal-header">
          <h3>Impor Data Dokumen (Excel)</h3>
          {!importing && (
            <button className="modal-close" onClick={onClose} aria-label="Tutup modal">
              <X size={16} />
            </button>
          )}
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: "16px" }}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success" style={{ marginBottom: "16px" }}>
            <Check size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        {importing && (
          <div style={{ marginBottom: "20px", padding: "16px", background: "var(--bg-subtle)", borderRadius: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>
              <span>Proses Migrasi Data...</span>
              <span>{Math.round((importProgress / rowsWithValidation.length) * 100)}% ({importProgress}/{rowsWithValidation.length})</span>
            </div>
            <div style={{ width: "100%", height: "8px", background: "var(--border-default)", borderRadius: "4px", overflow: "hidden" }}>
              <div
                style={{
                  width: `${(importProgress / rowsWithValidation.length) * 100}%`,
                  height: "100%",
                  background: "var(--accent-text)",
                  transition: "width 0.2s ease"
                }}
              />
            </div>
          </div>
        )}

        {!importing && !successMessage && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="import-category">Pilih Kategori Dokumen *</label>
                <select
                  id="import-category"
                  className="form-select"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value as any);
                    setParsedRows([]);
                  }}
                >
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleDownloadTemplate}
                  style={{ width: "100%", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                >
                  <FileSpreadsheet size={16} style={{ color: "var(--status-success)" }} />
                  Unduh Template Excel ({categoryLabels[category]})
                </button>
              </div>
            </div>

            <div style={{
              border: "2px dashed var(--border-default)",
              borderRadius: "8px",
              padding: "24px",
              textAlign: "center",
              background: "var(--bg-subtle)",
              marginBottom: "20px"
            }}>
              <Upload size={32} style={{ margin: "0 auto 12px", color: "var(--text-tertiary)" }} />
              <p style={{ fontSize: "13px", fontWeight: 500, marginBottom: "8px" }}>Upload File Excel yang Telah Diisi</p>
              <p style={{ fontSize: "11px", color: "var(--text-tertiary)", marginBottom: "16px" }}>Mendukung format .xlsx dan .xls</p>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                style={{ display: "none" }}
                id="excel-file-input"
              />
              <label htmlFor="excel-file-input" className="btn btn-secondary btn-sm" style={{ cursor: "pointer" }}>
                Pilih File Excel
              </label>
            </div>

            {rowsWithValidation.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>
                  Pratinjau Data ({rowsWithValidation.length} baris terdeteksi)
                </h4>
                <div style={{
                  maxHeight: "220px",
                  overflowY: "auto",
                  border: "1px solid var(--border-default)",
                  borderRadius: "6px"
                }}>
                  <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "var(--bg-subtle)", position: "sticky", top: 0, zIndex: 1 }}>
                        <th style={{ padding: "8px", borderBottom: "1px solid var(--border-default)", width: "50px" }}>No</th>
                        <th style={{ padding: "8px", borderBottom: "1px solid var(--border-default)", textAlign: "left" }}>Tanggal</th>
                        {(category === "NOTA_VERIFIKASI" || category === "NOTA_DIVISI") && (
                          <th style={{ padding: "8px", borderBottom: "1px solid var(--border-default)", textAlign: "left" }}>Divisi</th>
                        )}
                        <th style={{ padding: "8px", borderBottom: "1px solid var(--border-default)", textAlign: "left" }}>Perihal</th>
                        <th style={{ padding: "8px", borderBottom: "1px solid var(--border-default)", width: "100px" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rowsWithValidation.map((row) => (
                        <tr key={row.index} style={{ borderBottom: "1px solid var(--border-default)" }}>
                          <td style={{ padding: "8px", textAlign: "center" }}>{row.index}</td>
                          <td style={{ padding: "8px" }}>{row.letterDate || "-"}</td>
                          {(category === "NOTA_VERIFIKASI" || category === "NOTA_DIVISI") && (
                            <td style={{ padding: "8px" }}>{getDivisionUnitLabel(row.divisionUnit)}</td>
                          )}
                          <td style={{ padding: "8px" }}>{row.subject || "-"}</td>
                          <td style={{ padding: "8px", textAlign: "center" }}>
                            {row.errors.length === 0 ? (
                              <span style={{ color: "var(--status-success)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "2px" }}>
                                <Check size={12} /> Valid
                              </span>
                            ) : (
                              <span
                                style={{ color: "var(--status-error)", fontWeight: 600, cursor: "help", display: "inline-flex", alignItems: "center", gap: "2px" }}
                                title={row.errors.join(", ")}
                              >
                                <AlertTriangle size={12} /> {row.errors.length} Error
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalErrors > 0 && (
                  <p style={{ color: "var(--status-error)", fontSize: "11px", marginTop: "8px", fontWeight: 500 }}>
                    ⚠️ Ada {totalErrors} error terdeteksi pada file Excel. Harap perbaiki sebelum mengimpor data.
                  </p>
                )}
              </div>
            )}
          </>
        )}

        <div className="modal-actions" style={{ marginTop: "24px" }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={importing}>
            Tutup
          </button>
          {rowsWithValidation.length > 0 && !importing && !successMessage && (
            <button
              type="button"
              className="btn btn-primary"
              disabled={totalErrors > 0}
              onClick={handleImport}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Play size={14} />
              Mulai Impor Data
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
