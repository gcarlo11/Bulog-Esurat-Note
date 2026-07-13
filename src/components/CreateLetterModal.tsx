"use client";

import { useState } from "react";
import { createLetterAction } from "@/actions/letters";
import { X, Save, AlertCircle } from "lucide-react";

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
  const [category, setCategory] = useState<"KELUAR_MASUK" | "AGENDA" | "NOTA_VERIFIKASI">("KELUAR_MASUK");
  const [letterType, setLetterType] = useState("MASUK");
  const [nominalRaw, setNominalRaw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    
    // Append fields that might be modified/controlled by React state
    formData.set("category", category);
    if (category === "NOTA_VERIFIKASI") {
      formData.set("nominal", nominalRaw.replace(/\./g, ""));
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
              <option value="AGENDA">Surat Agenda (14 Jenis)</option>
              <option value="NOTA_VERIFIKASI">Nota Verifikasi Keuangan</option>
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
