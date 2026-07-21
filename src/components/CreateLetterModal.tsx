"use client";

import { useState } from "react";
import { createLetterAction } from "@/actions/letters";
import { formatFileSize } from "@/lib/fileUtils";
import { X, Save, AlertCircle, Upload, Paperclip } from "lucide-react";

interface CreateLetterModalProps {
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

export function CreateLetterModal({ onClose, onSuccess }: CreateLetterModalProps) {
  const [category, setCategory] = useState<"KELUAR_MASUK" | "AGENDA" | "NOTA_VERIFIKASI" | "NOTA_DIVISI" | "SURAT_DINAS_INTERNAL">("KELUAR_MASUK");
  const [letterType, setLetterType] = useState("MASUK");
  const [nominalRaw, setNominalRaw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // SDI Specific state
  const [sdiNomor, setSdiNomor] = useState("");
  const [sdiKodeDivisi, setSdiKodeDivisi] = useState("");
  const [sdiNoTanggal, setSdiNoTanggal] = useState("");

  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [compressionStats, setCompressionStats] = useState<{ original: number; compressed: number } | null>(null);

  // Helper formatting Rupiah
  function handleNominalChange(value: string) {
    const clean = value.replace(/[^\d]/g, "");
    if (!clean) {
      setNominalRaw("");
      return;
    }
    const formatted = new Intl.NumberFormat("id-ID").format(parseInt(clean, 10));
    setNominalRaw(formatted);
  }

  // Handle client-side file selection & automatic image compression
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setCompressedFile(null);
      setCompressionStats(null);
      return;
    }

    if (file.type.startsWith("image/")) {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = (event) => {
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_DIM = 1600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_DIM) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            }
          } else {
            if (height > MAX_DIM) {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".webp"), {
                  type: "image/webp",
                  lastModified: Date.now(),
                });
                setCompressedFile(compFile);
                setCompressionStats({ original: file.size, compressed: compFile.size });
              } else {
                setCompressedFile(file);
                setCompressionStats({ original: file.size, compressed: file.size });
              }
            },
            "image/webp",
            0.75
          );
        };
      };
      reader.readAsDataURL(file);
    } else {
      setCompressedFile(file);
      setCompressionStats({ original: file.size, compressed: file.size });
    }
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    
    // Append fields that might be modified/controlled by React state
    formData.set("category", category);
    if (category === "NOTA_VERIFIKASI" || category === "NOTA_DIVISI") {
      formData.set("nominal", nominalRaw.replace(/\./g, ""));
    }

    if (compressedFile) {
      formData.set("attachment", compressedFile);
    }

    try {
      const result = await createLetterAction(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        onSuccess();
        onClose();
      }
    } catch {
      setError("Terjadi kesalahan saat menyimpan dokumen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: "580px" }}>
        <div className="modal-header" style={{ flexDirection: "column", alignItems: "flex-start", gap: "2px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
            <h3>Registrasi Dokumen Baru</h3>
            <button className="modal-close" onClick={onClose} aria-label="Tutup modal">
              <X size={16} />
            </button>
          </div>
          <span style={{ fontSize: "11px", color: "var(--text-tertiary)", fontWeight: 500 }}>
            Tanda (*) menunjukkan kolom yang wajib diisi
          </span>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form action={handleSubmit}>
          {/* Kategori Utama Dokumen */}
          <div className="form-group">
            <label className="form-label" htmlFor="category-select">
              Kategori Registrasi *
            </label>
            <select
              id="category-select"
              className="form-select"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as any);
                setError("");
              }}
            >
              <option value="KELUAR_MASUK">Surat Keluar / Masuk</option>
              <option value="SURAT_DINAS_INTERNAL">Surat Dinas Internal</option>
              <option value="AGENDA">Surat Agenda (14 Jenis)</option>
              <option value="NOTA_VERIFIKASI">Nota Verifikasi Keuangan</option>
              <option value="NOTA_DIVISI">Nota Internal / Divisi</option>
            </select>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--border-default)", margin: "16px 0" }} />

          {/* ======================================================== */}
          {/* FORM A: SURAT AGENDA                                     */}
          {/* ======================================================== */}
          {category === "AGENDA" && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="agendaType">
                    Jenis Agenda *
                  </label>
                  <select id="agendaType" name="agendaType" className="form-select" required>
                    <option value="">Pilih Jenis Agenda...</option>
                    {agendaTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="code">
                    Kode Arsip / Klasifikasi
                  </label>
                  <input
                    id="code"
                    name="code"
                    type="text"
                    className="form-input"
                    placeholder="Contoh: K-100, PM-200..."
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="subject">
                  Perihal *
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  className="form-input"
                  placeholder="Isi ringkasan perihal agenda..."
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="recipient">
                    Tujuan *
                  </label>
                  <input
                    id="recipient"
                    name="recipient"
                    type="text"
                    className="form-input"
                    placeholder="Pihak penerima / tujuan..."
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="letterDate">
                    Tanggal Agenda *
                  </label>
                  <input
                    id="letterDate"
                    name="letterDate"
                    type="date"
                    className="form-input"
                    required
                  />
                </div>
              </div>
            </>
          )}

          {/* ======================================================== */}
          {/* FORM B: SURAT KELUAR MASUK                               */}
          {/* ======================================================== */}
          {category === "KELUAR_MASUK" && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="type">
                    Tipe Surat *
                  </label>
                  <select
                    id="type"
                    name="type"
                    className="form-select"
                    value={letterType}
                    onChange={(e) => setLetterType(e.target.value)}
                    required
                  >
                    <option value="MASUK">Surat Masuk</option>
                    <option value="KELUAR">Surat Keluar</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="classification">
                    Tingkat Keamanan
                  </label>
                  <select id="classification" name="classification" className="form-select">
                    <option value="BIASA">Biasa</option>
                    <option value="PENTING">Penting</option>
                    <option value="RAHASIA">Rahasia</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="subject">
                  Perihal *
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  className="form-input"
                  placeholder="Perihal utama surat..."
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="sender">
                    Pengirim *
                  </label>
                  <input
                    id="sender"
                    name="sender"
                    type="text"
                    className="form-input"
                    placeholder="Nama pengirim / instansi..."
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="recipient">
                    Penerima / Alamat Penerima *
                  </label>
                  <input
                    id="recipient"
                    name="recipient"
                    type="text"
                    className="form-input"
                    placeholder="Nama penerima / instansi..."
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="letterDate">
                    Tanggal Surat *
                  </label>
                  <input
                    id="letterDate"
                    name="letterDate"
                    type="date"
                    className="form-input"
                    required
                  />
                </div>
                {letterType === "MASUK" ? (
                  <div className="form-group">
                    <label className="form-label" htmlFor="receivedDate">
                      Tanggal Diterima
                    </label>
                    <input
                      id="receivedDate"
                      name="receivedDate"
                      type="date"
                      className="form-input"
                    />
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label" htmlFor="nomorBerkas">
                      Nomor Berkas
                    </label>
                    <input
                      id="nomorBerkas"
                      name="nomorBerkas"
                      type="text"
                      className="form-input"
                      placeholder="Masukkan No. Berkas..."
                    />
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="nomorPetunjuk">
                    Nomor Petunjuk
                  </label>
                  <input
                    id="nomorPetunjuk"
                    name="nomorPetunjuk"
                    type="text"
                    className="form-input"
                    placeholder="Masukkan No. Petunjuk..."
                  />
                </div>
                {letterType === "MASUK" && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="nomorBerkas">
                      Nomor Berkas
                    </label>
                    <input
                      id="nomorBerkas"
                      name="nomorBerkas"
                      type="text"
                      className="form-input"
                      placeholder="Masukkan No. Berkas..."
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* ======================================================== */}
          {/* FORM C: NOTA VERIFIKASI                                  */}
          {/* ======================================================== */}
          {category === "NOTA_VERIFIKASI" && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="subject">
                  Perihal Verifikasi *
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  className="form-input"
                  placeholder="Perihal/Keperluan pengeluaran keuangan..."
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="nominal">
                    Nominal Keuangan (Rupiah) *
                  </label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>
                      Rp
                    </span>
                    <input
                      id="nominal"
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: "36px" }}
                      placeholder="Masukkan jumlah nominal..."
                      value={nominalRaw}
                      onChange={(e) => handleNominalChange(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="letterDate">
                    Tanggal Verifikasi *
                  </label>
                  <input
                    id="letterDate"
                    name="letterDate"
                    type="date"
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="paraf">
                  Paraf / Disetujui Oleh *
                </label>
                <input
                  id="paraf"
                  name="paraf"
                  type="text"
                  className="form-input"
                  placeholder="Nama pejabat pemberi persetujuan paraf..."
                  required
                />
              </div>
            </>
          )}

          {/* ======================================================== */}
          {/* FORM D: NOTA INTERNAL / DIVISI                           */}
          {/* ======================================================== */}
          {category === "NOTA_DIVISI" && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="subject">
                  Keterangan Nota *
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  className="form-input"
                  placeholder="Masukkan keterangan/keperluan nota divisi..."
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="nominal">
                    Jumlah (Rupiah) *
                  </label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>
                      Rp
                    </span>
                    <input
                      id="nominal"
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: "36px" }}
                      placeholder="Masukkan jumlah..."
                      value={nominalRaw}
                      onChange={(e) => handleNominalChange(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="letterDate">
                    Tanggal Nota *
                  </label>
                  <input
                    id="letterDate"
                    name="letterDate"
                    type="date"
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="paraf">
                  TTD / Mengetahui *
                </label>
                <input
                  id="paraf"
                  name="paraf"
                  type="text"
                  className="form-input"
                  placeholder="Nama pejabat yang menandatangani / TTD..."
                  required
                />
              </div>
            </>
          )}

          {/* ======================================================== */}
          {/* FORM E: SURAT DINAS INTERNAL                             */}
          {/* ======================================================== */}
          {category === "SURAT_DINAS_INTERNAL" && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="type">
                    Tipe Surat *
                  </label>
                  <select
                    id="type"
                    name="type"
                    className="form-select"
                    value={letterType}
                    onChange={(e) => setLetterType(e.target.value)}
                    required
                  >
                    <option value="MASUK">Surat Masuk</option>
                    <option value="KELUAR">Surat Keluar</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="classification">
                    Sifat Surat *
                  </label>
                  <select id="classification" name="classification" className="form-select" required>
                    <option value="BIASA">Biasa</option>
                    <option value="PENTING">Penting</option>
                    <option value="RAHASIA">Rahasia</option>
                  </select>
                </div>
              </div>

              {/* Format Nomor Surat Manual SDI */}
              <div className="form-group" style={{ background: "var(--bg-subtle)", padding: "12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", marginBottom: "16px" }}>
                <label className="form-label" style={{ fontWeight: 600, marginBottom: "8px" }}>
                  Format Nomor Surat: <code style={{ color: "var(--accent-text)", fontSize: "12px" }}>SDI-[Nomor]/06040/[Kode Divisi]/[Nomor Tanggal]</code>
                </label>

                <div className="sdi-number-grid">
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--text-tertiary)", display: "block", marginBottom: "4px" }}>Input Nomor *</span>
                    <input
                      type="text"
                      name="sdiNomor"
                      className="form-input"
                      placeholder="001"
                      value={sdiNomor}
                      onChange={(e) => setSdiNomor(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--text-tertiary)", display: "block", marginBottom: "4px" }}>Kode Divisi *</span>
                    <input
                      type="text"
                      name="sdiKodeDivisi"
                      className="form-input"
                      placeholder="HUB / VER..."
                      value={sdiKodeDivisi}
                      onChange={(e) => setSdiKodeDivisi(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--text-tertiary)", display: "block", marginBottom: "4px" }}>Nomor Tanggal *</span>
                    <input
                      type="text"
                      name="sdiNoTanggal"
                      className="form-input"
                      placeholder="21/07/2026..."
                      value={sdiNoTanggal}
                      onChange={(e) => setSdiNoTanggal(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ fontSize: "12px", marginTop: "8px", color: "var(--text-secondary)", fontWeight: 500 }}>
                  Preview Nomor: <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-primary)" }}>SDI-{sdiNomor || "001"}/06040/{sdiKodeDivisi || "DIV"}/{sdiNoTanggal || "01"}</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="subject">
                  Hal (Perihal) *
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  className="form-input"
                  placeholder="Hal / perihal surat dinas internal..."
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="sender">
                    Dari (Pengirim) *
                  </label>
                  <input
                    id="sender"
                    name="sender"
                    type="text"
                    className="form-input"
                    placeholder="Pengirim / Unit asal..."
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="recipient">
                    Kepada (Penerima) *
                  </label>
                  <input
                    id="recipient"
                    name="recipient"
                    type="text"
                    className="form-input"
                    placeholder="Penerima / Unit tujuan..."
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="letterDate">
                    Tanggal Surat *
                  </label>
                  <input
                    id="letterDate"
                    name="letterDate"
                    type="date"
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="jumlahLembar">
                    Jumlah Lembar (Angka)
                  </label>
                  <input
                    id="jumlahLembar"
                    name="jumlahLembar"
                    type="text"
                    className="form-input"
                    placeholder="Contoh: 1, 2, 3..."
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="tembusan">
                  Tembusan
                </label>
                <input
                  id="tembusan"
                  name="tembusan"
                  type="text"
                  className="form-input"
                  placeholder="Tembusan surat (opsional)..."
                />
              </div>
            </>
          )}

          <div className="form-group" style={{ marginTop: "12px" }}>
            <label className="form-label" htmlFor="description">
              Keterangan / Catatan Tambahan
            </label>
            <textarea
              id="description"
              name="description"
              className="form-textarea"
              placeholder="Masukkan catatan pendukung (opsional)..."
              rows={2}
            />
          </div>

          <div className="form-group" style={{ marginTop: "12px" }}>
            <label className="form-label" htmlFor="attachment" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Paperclip size={13} style={{ color: "var(--accent-text)" }} />
              Upload File Backup (Opsional, Terkompresi Otomatis)
            </label>
            <input
              id="attachment"
              type="file"
              className="form-input"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
              onChange={handleFileChange}
              style={{ padding: "6px 10px" }}
            />
            {compressionStats && (
              <div style={{ fontSize: "11px", color: "var(--status-success)", marginTop: "6px", fontWeight: 500, display: "flex", alignItems: "center", gap: "4px" }}>
                ✓ File siap diunggah: <strong>{formatFileSize(compressionStats.compressed)}</strong>
                {compressionStats.original > compressionStats.compressed && (
                  <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>
                    (Hemat {Math.round((1 - compressionStats.compressed / compressionStats.original) * 100)}% dari {formatFileSize(compressionStats.original)})
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="modal-actions" style={{ marginTop: "24px" }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Save size={14} />
              {loading ? "Menyimpan..." : "Simpan Dokumen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
