"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getLetterDetail,
  updateLetterAction,
  archiveLetterAction,
} from "@/actions/letters";
import Link from "next/link";
import { useUser, canEdit, canArchive } from "@/components/UserProvider";
import { generateLetterHash } from "@/lib/hash";
import {
  ArrowLeft,
  Edit2,
  Archive,
  FileText,
  History,
  ShieldAlert,
  Save,
  X,
  XCircle,
  Key,
} from "lucide-react";

interface LetterVersion {
  id: string;
  version: number;
  category: string;
  type: string | null;
  subject: string;
  sender: string | null;
  recipient: string | null;
  letterDate: Date;
  description: string | null;
  classification: string;
  changeNote: string | null;
  createdAt: Date;
  agendaType: string | null;
  code: string | null;
  nomorBerkas: string | null;
  nomorPetunjuk: string | null;
  nominal: number | null;
  paraf: string | null;
}

interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  details: string | null;
  createdAt: Date;
  user: { name: string; email: string };
}

interface LetterDetail {
  id: string;
  letterNumber: string;
  category: string;
  type: string | null;
  subject: string;
  sender: string | null;
  recipient: string | null;
  letterDate: Date;
  receivedDate: Date | null;
  description: string | null;
  classification: string;
  status: string;
  archiveReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  agendaType: string | null;
  code: string | null;
  nomorBerkas: string | null;
  nomorPetunjuk: string | null;
  nominal: number | null;
  paraf: string | null;
  createdBy: { name: string; email: string };
  versions: LetterVersion[];
  auditLogs: AuditLogEntry[];
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

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(date: Date) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

function getActionLabel(action: string) {
  const map: Record<string, string> = {
    CREATE: "Dokumen didaftarkan",
    UPDATE: "Dokumen diperbarui",
    ARCHIVE: "Dokumen diarsipkan",
  };
  return map[action] || action;
}

export default function LetterDetailPage() {
  const user = useUser();
  const params = useParams();
  const router = useRouter();
  const letterId = params.id as string;

  const [letter, setLetter] = useState<LetterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveReason, setArchiveReason] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState<"detail" | "versions" | "logs">("detail");
  
  // Controlled fields for edit modal
  const [nominalRaw, setNominalRaw] = useState("");

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLetterDetail(letterId);
      setLetter(data as LetterDetail | null);
      if (data && data.nominal) {
        setNominalRaw(new Intl.NumberFormat("id-ID").format(data.nominal));
      }
    } catch (e) {
      console.error("Failed to fetch letter detail:", e);
    } finally {
      setLoading(false);
    }
  }, [letterId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  function handleNominalChange(value: string) {
    const clean = value.replace(/[^\d]/g, "");
    if (!clean) {
      setNominalRaw("");
      return;
    }
    setNominalRaw(new Intl.NumberFormat("id-ID").format(parseInt(clean, 10)));
  }

  async function handleEdit(formData: FormData) {
    setEditLoading(true);
    try {
      if (letter?.category === "NOTA_VERIFIKASI" || letter?.category === "NOTA_DIVISI") {
        formData.set("nominal", nominalRaw.replace(/\./g, ""));
      }
      const result = await updateLetterAction(letterId, formData);
      if (result?.error) {
        setMessage({ type: "error", text: result.error });
      } else if (result?.success) {
        setMessage({ type: "success", text: result.success });
        setShowEdit(false);
        fetchDetail();
      }
    } catch {
      setMessage({ type: "error", text: "Gagal memperbarui dokumen." });
    } finally {
      setEditLoading(false);
    }
  }

  async function handleArchive() {
    setArchiveLoading(true);
    try {
      const result = await archiveLetterAction(letterId, archiveReason);
      if (result?.error) {
        setMessage({ type: "error", text: result.error });
      } else if (result?.success) {
        setMessage({ type: "success", text: result.success });
        setShowArchive(false);
        fetchDetail();
      }
    } catch {
      setMessage({ type: "error", text: "Gagal mengarsipkan dokumen." });
    } finally {
      setArchiveLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <FileText style={{ animation: "pulse 2s infinite" }} />
        </div>
        <h3>Memuat detail dokumen...</h3>
      </div>
    );
  }

  if (!letter) {
    return (
      <div className="empty-state">
        <XCircle />
        <h3>Dokumen Tidak Ditemukan</h3>
        <p>Dokumen dengan ID ini tidak ada dalam sistem.</p>
        <Link href="/dashboard/letters" className="btn btn-secondary" style={{ marginTop: "1rem" }}>
          <ArrowLeft size={14} />
          Kembali
        </Link>
      </div>
    );
  }

  const cryptographicHash = generateLetterHash({
    id: letter.id,
    letterNumber: letter.letterNumber,
    subject: letter.subject,
    sender: letter.sender || "",
    recipient: letter.recipient || "",
    letterDate: letter.letterDate,
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <Link href="/dashboard/letters" className="text-link" style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "4px" }}>
              <ArrowLeft size={12} />
              Kembali ke Daftar
            </Link>
          </div>
          <h2>{letter.letterNumber}</h2>
          <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "var(--text-secondary)", background: "var(--bg-muted)", padding: "2px 8px", borderRadius: "4px" }}>
              {letter.category.replace("_", " ")}
            </span>
            {letter.category === "KELUAR_MASUK" && (
              <span className={`type-badge type-${(letter.type || "").toLowerCase()}`}>
                {letter.type === "MASUK" ? "Masuk" : "Keluar"}
              </span>
            )}
            <span className={`status-badge status-${letter.status.toLowerCase()}`}>
              <span className="status-dot"></span>
              {letter.status === "ACTIVE" ? "Aktif" : "Arsip"}
            </span>
          </div>
        </div>
        {letter.status === "ACTIVE" && (
          <div style={{ display: "flex", gap: "8px" }}>
            {canEdit(user.role) && (
              <button className="btn btn-secondary" onClick={() => setShowEdit(!showEdit)}>
                <Edit2 size={14} />
                Ubah Data
              </button>
            )}
            {canArchive(user.role) && (
              <button className="btn btn-danger" onClick={() => setShowArchive(true)}>
                <Archive size={14} />
                Arsipkan
              </button>
            )}
          </div>
        )}
      </div>

      {/* Message Alerts */}
      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.type === "success" ? <FileText /> : <ShieldAlert />}
          {message.text}
        </div>
      )}

      {/* Archive Reason Banner */}
      {letter.status === "ARCHIVED" && letter.archiveReason && (
        <div className="alert alert-error" style={{ marginBottom: "24px" }}>
          <Archive size={16} />
          <span><strong>Keterangan Arsip:</strong> {letter.archiveReason}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === "detail" ? "active" : ""}`}
          onClick={() => setActiveTab("detail")}
        >
          <FileText size={14} />
          Detail Dokumen
        </button>
        <button
          className={`tab ${activeTab === "versions" ? "active" : ""}`}
          onClick={() => setActiveTab("versions")}
        >
          <History size={14} />
          Riwayat Versi
          <span className="tab-count">{letter.versions.length}</span>
        </button>
        <button
          className={`tab ${activeTab === "logs" ? "active" : ""}`}
          onClick={() => setActiveTab("logs")}
        >
          <ShieldAlert size={14} />
          Log Audit
          <span className="tab-count">{letter.auditLogs.length}</span>
        </button>
      </div>

      {/* Tab Content: Detail */}
      {activeTab === "detail" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: "24px", alignItems: "start" }}>
          {/* Main Info */}
          <div className="card" style={{ padding: "24px", background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)" }}>
            <div className="detail-grid">
              <div className="detail-item" style={{ gridColumn: "span 2" }}>
                <div className="detail-label">Perihal</div>
                <div className="detail-value" style={{ fontWeight: 600, fontSize: "16px", color: "var(--text-primary)" }}>{letter.subject}</div>
              </div>

              {/* SPECIFIC FIELDS: SURAT AGENDA */}
              {letter.category === "AGENDA" && (
                <>
                  <div className="detail-item">
                    <div className="detail-label">Jenis Agenda</div>
                    <div className="detail-value">{letter.agendaType}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Kode Arsip</div>
                    <div className="detail-value"><code className="mono">{letter.code || "—"}</code></div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Tujuan Dokumen</div>
                    <div className="detail-value">{letter.recipient}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Tanggal Agenda</div>
                    <div className="detail-value">{formatDate(letter.letterDate)}</div>
                  </div>
                </>
              )}

              {/* SPECIFIC FIELDS: KELUAR MASUK */}
              {letter.category === "KELUAR_MASUK" && (
                <>
                  <div className="detail-item">
                    <div className="detail-label">Pengirim</div>
                    <div className="detail-value">{letter.sender || "—"}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Penerima</div>
                    <div className="detail-value">{letter.recipient || "—"}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Tanggal Surat</div>
                    <div className="detail-value">{formatDate(letter.letterDate)}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Diterima Pada</div>
                    <div className="detail-value">
                      {letter.receivedDate ? formatDate(letter.receivedDate) : "—"}
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Nomor Berkas</div>
                    <div className="detail-value">{letter.nomorBerkas || "—"}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Nomor Petunjuk</div>
                    <div className="detail-value">{letter.nomorPetunjuk || "—"}</div>
                  </div>
                </>
              )}

              {/* SPECIFIC FIELDS: NOTA INTERNAL / DIVISI */}
              {letter.category === "NOTA_DIVISI" && (
                <>
                  <div className="detail-item">
                    <div className="detail-label">Jumlah</div>
                    <div className="detail-value" style={{ fontWeight: 700, fontSize: "16px", color: "var(--text-primary)" }}>
                      {letter.nominal ? formatRupiah(letter.nominal) : "—"}
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Tanggal Nota</div>
                    <div className="detail-value">{formatDate(letter.letterDate)}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">TTD / Mengetahui</div>
                    <div className="detail-value" style={{ fontStyle: "italic" }}>{letter.paraf || "—"}</div>
                  </div>
                  <div className="detail-item">
                    {/* Empty cell spacer */}
                  </div>
                </>
              )}

              {/* SPECIFIC FIELDS: NOTA VERIFIKASI */}
              {letter.category === "NOTA_VERIFIKASI" && (
                <>
                  <div className="detail-item">
                    <div className="detail-label">Nominal Verifikasi</div>
                    <div className="detail-value" style={{ fontWeight: 700, fontSize: "16px", color: "var(--text-primary)" }}>
                      {letter.nominal ? formatRupiah(letter.nominal) : "—"}
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Tanggal Verifikasi</div>
                    <div className="detail-value">{formatDate(letter.letterDate)}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Paraf / Disetujui Oleh</div>
                    <div className="detail-value" style={{ fontStyle: "italic" }}>{letter.paraf || "—"}</div>
                  </div>
                  <div className="detail-item">
                    {/* Empty cell spacer */}
                  </div>
                </>
              )}

              <div className="detail-item" style={{ borderTop: "1px solid var(--border-muted)", marginTop: "12px", paddingTop: "12px" }}>
                <div className="detail-label">Didata Oleh</div>
                <div className="detail-value">{letter.createdBy.name}</div>
              </div>
              <div className="detail-item" style={{ borderTop: "1px solid var(--border-muted)", marginTop: "12px", paddingTop: "12px" }}>
                <div className="detail-label">Tanggal Input</div>
                <div className="detail-value">{formatDateTime(letter.createdAt)}</div>
              </div>
            </div>

            {letter.description && (
              <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border-default)" }}>
                <div className="detail-label">Keterangan / Catatan Tambahan</div>
                <div className="detail-value" style={{ lineHeight: 1.6, fontSize: "13px" }}>
                  {letter.description}
                </div>
              </div>
            )}
          </div>

          {/* Cryptographic Integrity Panel */}
          <div className="card" style={{ padding: "24px", background: "var(--bg-subtle)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)" }}>
            <div className="hash-label">
              <Key size={12} />
              Integritas Data Kriptografis
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px", lineHeight: 1.5 }}>
              Hash SHA-256 di bawah dihasilkan secara unik dari data surat ini. Setiap perubahan pada properti surat akan menghasilkan hash yang berbeda untuk menjamin transparansi sistem.
            </p>
            <div className="hash-display">
              {cryptographicHash}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Versions */}
      {activeTab === "versions" && (
        <div>
          {letter.versions.length > 0 ? (
            letter.versions.map((v) => (
              <div key={v.id} className="version-card">
                <div className="version-header">
                  <span className="version-number">VERSI #{v.version}</span>
                  <span className="version-date">{formatDateTime(v.createdAt)}</span>
                </div>
                <div className="version-content">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px", fontSize: "13px", color: "var(--text-secondary)" }}>
                    <div style={{ gridColumn: "span 2" }}><strong>Perihal:</strong> {v.subject}</div>
                    
                    {letter.category === "AGENDA" && (
                      <>
                        <div><strong>Jenis Agenda:</strong> {v.agendaType}</div>
                        <div><strong>Tujuan:</strong> {v.recipient}</div>
                        <div><strong>Kode:</strong> {v.code || "—"}</div>
                      </>
                    )}

                    {letter.category === "KELUAR_MASUK" && (
                      <>
                        <div><strong>Pengirim:</strong> {v.sender || "—"}</div>
                        <div><strong>Penerima:</strong> {v.recipient || "—"}</div>
                        <div><strong>No. Berkas:</strong> {v.nomorBerkas || "—"}</div>
                        <div><strong>No. Petunjuk:</strong> {v.nomorPetunjuk || "—"}</div>
                      </>
                    )}

                    {(letter.category === "NOTA_VERIFIKASI" || letter.category === "NOTA_DIVISI") && (
                      <>
                        <div><strong>Jumlah / Nominal:</strong> {v.nominal ? formatRupiah(v.nominal) : "—"}</div>
                        <div><strong>TTD / Paraf:</strong> {v.paraf || "—"}</div>
                      </>
                    )}

                    <div><strong>Klasifikasi:</strong> {v.classification}</div>
                    <div><strong>Tanggal:</strong> {formatDate(v.letterDate)}</div>
                  </div>
                  {v.changeNote && (
                    <div style={{ marginTop: "12px", padding: "8px 12px", background: "var(--bg-subtle)", borderRadius: "var(--radius-sm)", fontSize: "12px", color: "var(--text-secondary)", borderLeft: "2px solid var(--accent)" }}>
                      <strong>Catatan Perubahan:</strong> {v.changeNote}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <History />
              <h3>Tidak Ada Riwayat Versi</h3>
              <p>Dokumen ini belum pernah diubah sejak didaftarkan.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Audit Logs */}
      {activeTab === "logs" && (
        <div className="card" style={{ padding: "24px" }}>
          {letter.auditLogs.length > 0 ? (
            <div className="timeline">
              {letter.auditLogs.map((log) => (
                <div key={log.id} className={`timeline-item ${log.action.toLowerCase()}`}>
                  <div className="timeline-action">{getActionLabel(log.action)}</div>
                  <div className="timeline-meta">
                    {log.user.name} • {formatDateTime(log.createdAt)}
                  </div>
                  {log.details && (
                    <div className="mono" style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "4px" }}>
                      {(() => {
                        try {
                          const d = JSON.parse(log.details);
                          return d.reason || d.letterNumber || JSON.stringify(d);
                        } catch { return log.details; }
                      })()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <ShieldAlert />
              <h3>Belum Ada Log Audit</h3>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowEdit(false)}>
          <div className="modal" style={{ maxWidth: "580px" }}>
            <div className="modal-header">
              <h3>Ubah Data Dokumen</h3>
              <button className="modal-close" onClick={() => setShowEdit(false)}>
                <X size={16} />
              </button>
            </div>
            <form action={handleEdit}>
              {/* SPECIFIC FIELDS FOR AGENDA */}
              {letter.category === "AGENDA" && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="agendaType">Jenis Agenda</label>
                      <select id="agendaType" name="agendaType" className="form-select" defaultValue={letter.agendaType || ""} required>
                        {agendaTypes.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="code">Kode Arsip</label>
                      <input id="code" name="code" className="form-input" defaultValue={letter.code || ""} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="subject">Perihal *</label>
                    <input id="subject" name="subject" className="form-input" defaultValue={letter.subject} required />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="recipient">Tujuan *</label>
                      <input id="recipient" name="recipient" className="form-input" defaultValue={letter.recipient || ""} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="letterDate">Tanggal Agenda *</label>
                      <input id="letterDate" name="letterDate" type="date" className="form-input" defaultValue={new Date(letter.letterDate).toISOString().split("T")[0]} required />
                    </div>
                  </div>
                </>
              )}

              {/* SPECIFIC FIELDS FOR KELUAR MASUK */}
              {letter.category === "KELUAR_MASUK" && (
                <>
                  <div className="form-group">
                    <label className="form-label" htmlFor="subject">Perihal *</label>
                    <input id="subject" name="subject" className="form-input" defaultValue={letter.subject} required />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="sender">Pengirim *</label>
                      <input id="sender" name="sender" className="form-input" defaultValue={letter.sender || ""} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="recipient">Penerima *</label>
                      <input id="recipient" name="recipient" className="form-input" defaultValue={letter.recipient || ""} required />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="letterDate">Tanggal Surat *</label>
                      <input id="letterDate" name="letterDate" type="date" className="form-input" defaultValue={new Date(letter.letterDate).toISOString().split("T")[0]} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="classification">Klasifikasi</label>
                      <select id="classification" name="classification" className="form-select" defaultValue={letter.classification}>
                        <option value="BIASA">Biasa</option>
                        <option value="PENTING">Penting</option>
                        <option value="RAHASIA">Rahasia</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="nomorBerkas">Nomor Berkas</label>
                      <input id="nomorBerkas" name="nomorBerkas" className="form-input" defaultValue={letter.nomorBerkas || ""} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="nomorPetunjuk">Nomor Petunjuk</label>
                      <input id="nomorPetunjuk" name="nomorPetunjuk" className="form-input" defaultValue={letter.nomorPetunjuk || ""} />
                    </div>
                  </div>
                </>
              )}

              {/* SPECIFIC FIELDS FOR NOTA INTERNAL / DIVISI */}
              {letter.category === "NOTA_DIVISI" && (
                <>
                  <div className="form-group">
                    <label className="form-label" htmlFor="subject">Keterangan Nota *</label>
                    <input id="subject" name="subject" className="form-input" defaultValue={letter.subject} required />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="nominal">Jumlah (Rp) *</label>
                      <input
                        id="nominal"
                        type="text"
                        className="form-input"
                        value={nominalRaw}
                        onChange={(e) => handleNominalChange(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="letterDate">Tanggal Nota *</label>
                      <input id="letterDate" name="letterDate" type="date" className="form-input" defaultValue={new Date(letter.letterDate).toISOString().split("T")[0]} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="paraf">TTD / Mengetahui *</label>
                    <input id="paraf" name="paraf" className="form-input" defaultValue={letter.paraf || ""} required />
                  </div>
                </>
              )}

              {/* SPECIFIC FIELDS FOR NOTA VERIFIKASI */}
              {letter.category === "NOTA_VERIFIKASI" && (
                <>
                  <div className="form-group">
                    <label className="form-label" htmlFor="subject">Perihal Verifikasi *</label>
                    <input id="subject" name="subject" className="form-input" defaultValue={letter.subject} required />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="nominal">Nominal Keuangan (Rp) *</label>
                      <input
                        id="nominal"
                        type="text"
                        className="form-input"
                        value={nominalRaw}
                        onChange={(e) => handleNominalChange(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="letterDate">Tanggal Verifikasi *</label>
                      <input id="letterDate" name="letterDate" type="date" className="form-input" defaultValue={new Date(letter.letterDate).toISOString().split("T")[0]} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="paraf">Paraf / Disetujui Oleh *</label>
                    <input id="paraf" name="paraf" className="form-input" defaultValue={letter.paraf || ""} required />
                  </div>
                </>
              )}

              <div className="form-group" style={{ marginTop: "12px" }}>
                <label className="form-label" htmlFor="description">Keterangan Tambahan</label>
                <textarea id="description" name="description" className="form-textarea" defaultValue={letter.description || ""} rows={2} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="changeNote">Catatan Perubahan *</label>
                <input id="changeNote" name="changeNote" className="form-input" placeholder="Alasan mengapa data dokumen diubah..." required />
              </div>
              
              <div className="modal-actions" style={{ marginTop: "20px" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEdit(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={editLoading}>
                  <Save size={14} />
                  {editLoading ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Archive Modal */}
      {showArchive && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowArchive(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Arsip Dokumen</h3>
              <button className="modal-close" onClick={() => setShowArchive(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="alert alert-error" style={{ marginBottom: "16px" }}>
              <ShieldAlert size={16} />
              <span>Dokumen yang diarsipkan tidak akan muncul di antrean kerja aktif. Log audit tetap tersimpan permanen.</span>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="archiveReason">Alasan Pengarsipan * (minimal 10 karakter)</label>
              <textarea
                id="archiveReason"
                className="form-textarea"
                placeholder="Masukkan alasan pengarsipan dokumen ini..."
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                rows={3}
                required
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowArchive(false)}>Batal</button>
              <button
                className="btn btn-danger"
                onClick={handleArchive}
                disabled={archiveLoading || archiveReason.trim().length < 10}
              >
                <Archive size={14} />
                {archiveLoading ? "Memproses..." : "Arsipkan Dokumen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
