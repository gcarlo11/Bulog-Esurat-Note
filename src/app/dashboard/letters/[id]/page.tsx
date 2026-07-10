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
  subject: string;
  sender: string;
  recipient: string;
  letterDate: Date;
  description: string | null;
  classification: string;
  changeNote: string | null;
  createdAt: Date;
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
  type: string;
  subject: string;
  sender: string;
  recipient: string;
  letterDate: Date;
  receivedDate: Date | null;
  description: string | null;
  classification: string;
  status: string;
  archiveReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: { name: string; email: string };
  versions: LetterVersion[];
  auditLogs: AuditLogEntry[];
}

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

function getActionLabel(action: string) {
  const map: Record<string, string> = {
    CREATE: "Surat didaftarkan",
    UPDATE: "Surat diperbarui",
    ARCHIVE: "Surat diarsipkan",
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

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLetterDetail(letterId);
      setLetter(data as LetterDetail | null);
    } catch (e) {
      console.error("Failed to fetch letter detail:", e);
    } finally {
      setLoading(false);
    }
  }, [letterId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  async function handleEdit(formData: FormData) {
    setEditLoading(true);
    try {
      const result = await updateLetterAction(letterId, formData);
      if (result?.error) {
        setMessage({ type: "error", text: result.error });
      } else if (result?.success) {
        setMessage({ type: "success", text: result.success });
        setShowEdit(false);
        fetchDetail();
      }
    } catch {
      setMessage({ type: "error", text: "Gagal memperbarui surat." });
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
      setMessage({ type: "error", text: "Gagal mengarsipkan surat." });
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
        <h3>Memuat detail surat...</h3>
      </div>
    );
  }

  if (!letter) {
    return (
      <div className="empty-state">
        <XCircle />
        <h3>Surat Tidak Ditemukan</h3>
        <p>Surat dengan ID ini tidak ada dalam sistem.</p>
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
    sender: letter.sender,
    recipient: letter.recipient,
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
            <span className={`type-badge type-${letter.type.toLowerCase()}`}>
              {letter.type === "MASUK" ? "Masuk" : "Keluar"}
            </span>
            <span className={`status-badge status-${letter.status.toLowerCase()}`}>
              <span className="status-dot"></span>
              {letter.status === "ACTIVE" ? "Aktif" : "Arsip"}
            </span>
            <span className={`classification-badge classification-${letter.classification.toLowerCase()}`}>
              Klasifikasi: {letter.classification}
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
          <div className="card" style={{ padding: "24px" }}>
            <div className="detail-grid">
              <div className="detail-item">
                <div className="detail-label">Perihal</div>
                <div className="detail-value" style={{ fontWeight: 600 }}>{letter.subject}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Nomor Surat</div>
                <div className="detail-value">{letter.letterNumber}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Pengirim</div>
                <div className="detail-value">{letter.sender}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Penerima</div>
                <div className="detail-value">{letter.recipient}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Tanggal Surat</div>
                <div className="detail-value">{formatDate(letter.letterDate)}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Diterima Pada</div>
                <div className="detail-value">
                  {letter.receivedDate ? formatDate(letter.receivedDate) : "-"}
                </div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Didata Oleh</div>
                <div className="detail-value">{letter.createdBy.name}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Tanggal Input</div>
                <div className="detail-value">{formatDateTime(letter.createdAt)}</div>
              </div>
            </div>

            {letter.description && (
              <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border-default)" }}>
                <div className="detail-label">Keterangan / Catatan</div>
                <div className="detail-value" style={{ lineHeight: 1.6, fontSize: "13px" }}>
                  {letter.description}
                </div>
              </div>
            )}
          </div>

          {/* Cryptographic Integrity Panel */}
          <div className="card" style={{ padding: "24px", background: "var(--bg-subtle)" }}>
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
                    <div><strong>Perihal:</strong> {v.subject}</div>
                    <div><strong>Pengirim:</strong> {v.sender}</div>
                    <div><strong>Penerima:</strong> {v.recipient}</div>
                    <div><strong>Klasifikasi:</strong> {v.classification}</div>
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
          <div className="modal">
            <div className="modal-header">
              <h3>Ubah Data Surat</h3>
              <button className="modal-close" onClick={() => setShowEdit(false)}>
                <X size={16} />
              </button>
            </div>
            <form action={handleEdit}>
              <div className="form-group">
                <label className="form-label" htmlFor="subject">Perihal</label>
                <input id="subject" name="subject" className="form-input" defaultValue={letter.subject} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="sender">Pengirim</label>
                  <input id="sender" name="sender" className="form-input" defaultValue={letter.sender} required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="recipient">Penerima</label>
                  <input id="recipient" name="recipient" className="form-input" defaultValue={letter.recipient} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="letterDate">Tanggal Surat</label>
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
              <div className="form-group">
                <label className="form-label" htmlFor="description">Keterangan</label>
                <textarea id="description" name="description" className="form-textarea" defaultValue={letter.description || ""} rows={3} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="changeNote">Catatan Perubahan *</label>
                <input id="changeNote" name="changeNote" className="form-input" placeholder="Alasan mengapa data diubah..." required />
              </div>
              <div className="modal-actions">
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
                {archiveLoading ? "Memproses..." : "Arsipkan Surat"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
