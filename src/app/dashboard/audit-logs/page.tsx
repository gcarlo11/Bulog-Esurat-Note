"use client";

import { useState, useEffect, useCallback } from "react";
import { getAuditLogs } from "@/actions/letters";
import { ShieldCheck, FileText, ArrowLeft, ArrowRight, Key } from "lucide-react";

interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  createdAt: Date;
  user: { name: string; email: string };
  letter: { letterNumber: string; subject: string } | null;
}

function formatDateTime(date: Date) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getActionLabel(action: string) {
  const map: Record<string, string> = {
    CREATE: "Registrasi Surat",
    UPDATE: "Modifikasi Surat",
    ARCHIVE: "Arsip Surat",
    LOGIN: "Sesi Masuk",
    LOGOUT: "Sesi Keluar",
  };
  return map[action] || action;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getAuditLogs({ page });
      setLogs(result.logs as AuditLogEntry[]);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch {
      setError("Akses ditolak. Halaman ini hanya dapat diakses oleh Administrator.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  if (error) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <Key size={40} style={{ color: "var(--status-error)" }} />
          <h3>Akses Terbatas</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <h2>Log Audit Keamanan</h2>
        <p>
          Rekam jejak seluruh aktivitas sistem yang tercatat permanen untuk pengawasan kepatuhan dan integritas data.
        </p>
      </div>

      <div className="table-wrapper" style={{ border: "1px solid var(--border-default)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--border-default)", gap: "12px" }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
            Log Aktivitas Keamanan
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
            {total} aktivitas tercatat
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <ShieldCheck style={{ animation: "pulse 2s infinite" }} />
            </div>
            <h3>Memuat log audit...</h3>
          </div>
        ) : logs.length > 0 ? (
          <>
            <table>
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Aksi</th>
                  <th>Aktor</th>
                  <th>Dokumen Terkait</th>
                  <th>Detail Catatan</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: "nowrap", fontSize: "12px" }} className="mono">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, fontSize: "12px" }}>
                        {getActionLabel(log.action)}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                        {log.user.name}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                        {log.user.email}
                      </div>
                    </td>
                    <td>
                      {log.letter ? (
                        <div>
                          <div style={{ fontWeight: 500, color: "var(--text-primary)", fontSize: "13px" }}>
                            {log.letter.letterNumber}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--text-tertiary)", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {log.letter.subject}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: "var(--text-tertiary)" }}>—</span>
                      )}
                    </td>
                    <td>
                      {log.details ? (
                        <div className="mono" style={{ fontSize: "11px", color: "var(--text-tertiary)", maxWidth: "250px", wordBreak: "break-all" }}>
                          {(() => {
                            try {
                              const d = JSON.parse(log.details);
                              if (d.reason) return `Alasan: ${d.reason}`;
                              if (d.email) return `Email: ${d.email}`;
                              return JSON.stringify(d);
                            } catch { return log.details; }
                          })()}
                        </div>
                      ) : (
                        <span style={{ color: "var(--text-tertiary)" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="pagination">
              <div className="pagination-info">
                Halaman {page} dari {totalPages} ({total} catatan)
              </div>
              <div className="pagination-controls">
                <button
                  className="pagination-btn"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <ArrowLeft size={12} />
                  Sebelumnya
                </button>
                <button
                  className="pagination-btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  Selanjutnya
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <ShieldCheck />
            <h3>Belum Ada Log Aktivitas</h3>
            <p>Log akan muncul saat ada interaksi di dalam sistem.</p>
          </div>
        )}
      </div>
    </div>
  );
}
