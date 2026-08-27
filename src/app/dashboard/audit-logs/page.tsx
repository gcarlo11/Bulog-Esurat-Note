"use client";

import { useState, useEffect, useCallback } from "react";
import { getAuditLogs } from "@/actions/letters";
import { ShieldCheck, ArrowLeft, ArrowRight, Key, Clock, User, FileText, Activity } from "lucide-react";

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

function formatDateTime(dateStr: Date) {
  const d = new Date(dateStr);
  const wibOptions = { timeZone: "Asia/Jakarta" } as const;
  const dateFormatted = d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...wibOptions,
  });
  const timeFormatted = d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    ...wibOptions,
  }).replace(":", ".");

  return { dateFormatted, timeFormatted };
}

function renderActionBadge(action: string) {
  switch (action) {
    case "CREATE":
      return (
        <span className="type-badge" style={{ backgroundColor: "rgba(16, 185, 129, 0.12)", color: "#059669", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
          Registrasi Surat
        </span>
      );
    case "UPDATE":
      return (
        <span className="type-badge" style={{ backgroundColor: "rgba(59, 130, 246, 0.12)", color: "#2563eb", border: "1px solid rgba(59, 130, 246, 0.3)" }}>
          Modifikasi Surat
        </span>
      );
    case "ARCHIVE":
      return (
        <span className="type-badge" style={{ backgroundColor: "rgba(107, 114, 128, 0.12)", color: "#4b5563", border: "1px solid rgba(107, 114, 128, 0.3)" }}>
          Arsip Surat
        </span>
      );
    case "LOGIN":
      return (
        <span className="type-badge" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.25)" }}>
          Sesi Masuk
        </span>
      );
    case "LOGOUT":
      return (
        <span className="type-badge" style={{ backgroundColor: "rgba(156, 163, 175, 0.15)", color: "#6b7280", border: "1px solid rgba(156, 163, 175, 0.3)" }}>
          Sesi Keluar
        </span>
      );
    case "CREATE_USER":
      return (
        <span className="type-badge" style={{ backgroundColor: "rgba(147, 51, 234, 0.12)", color: "#7c3aed", border: "1px solid rgba(147, 51, 234, 0.3)" }}>
          Buat User Baru
        </span>
      );
    case "ENABLE_USER":
      return (
        <span className="type-badge" style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#047857", border: "1px solid rgba(16, 185, 129, 0.35)" }}>
          Aktifkan User
        </span>
      );
    case "DISABLE_USER":
      return (
        <span className="type-badge" style={{ backgroundColor: "rgba(239, 68, 68, 0.12)", color: "#dc2626", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
          Nonaktifkan User
        </span>
      );
    case "RESET_PASSWORD_USER":
      return (
        <span className="type-badge" style={{ backgroundColor: "rgba(245, 158, 11, 0.12)", color: "#d97706", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
          Reset Password
        </span>
      );
    default:
      return (
        <span className="type-badge" style={{ backgroundColor: "var(--bg-secondary)", color: "var(--text-secondary)" }}>
          {action}
        </span>
      );
  }
}

function formatLogDetails(log: AuditLogEntry) {
  if (!log.details) return "—";
  try {
    const data = JSON.parse(log.details);
    if (data.targetEmail) {
      let text = `User: ${data.targetEmail}`;
      if (data.targetRole) text += ` • Role: ${data.targetRole}`;
      return text;
    }
    if (data.reason) return `Alasan: ${data.reason}`;
    if (data.email) return `Email: ${data.email}`;
    if (typeof data === "string") return data;
    return JSON.stringify(data);
  } catch {
    return log.details;
  }
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter Tanggal Mulai / Akhir / Bulan / Tahun
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getAuditLogs({
        page,
        startDate: filterStartDate || undefined,
        endDate: filterEndDate || undefined,
        month: filterMonth ? parseInt(filterMonth, 10) : undefined,
        year: filterYear ? parseInt(filterYear, 10) : undefined,
      });
      setLogs(result.logs as AuditLogEntry[]);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch {
      setError("Akses ditolak. Halaman ini hanya dapat diakses oleh Administrator.");
    } finally {
      setLoading(false);
    }
  }, [page, filterStartDate, filterEndDate, filterMonth, filterYear]);

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
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--border-default)", gap: "12px" }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", width: "100%" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
              <Activity size={16} style={{ color: "var(--brand-primary)" }} />
              Log Aktivitas Keamanan
            </div>
            
            {/* Date Filters */}
            <div className="filter-bar" style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Dari:</span>
                <input
                  type="date"
                  className="filter-select"
                  value={filterStartDate}
                  onChange={(e) => {
                    setFilterStartDate(e.target.value);
                    setFilterMonth("");
                    setFilterYear("");
                    setPage(1);
                  }}
                  title="Filter Tanggal Mulai"
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Sampai:</span>
                <input
                  type="date"
                  className="filter-select"
                  value={filterEndDate}
                  onChange={(e) => {
                    setFilterEndDate(e.target.value);
                    setFilterMonth("");
                    setFilterYear("");
                    setPage(1);
                  }}
                  title="Filter Tanggal Akhir"
                />
              </div>

              <select
                className="filter-select"
                value={filterMonth}
                onChange={(e) => {
                  setFilterMonth(e.target.value);
                  setFilterStartDate("");
                  setFilterEndDate("");
                  setPage(1);
                }}
                title="Filter Bulan"
              >
                <option value="">Semua Bulan</option>
                <option value="1">Januari</option>
                <option value="2">Februari</option>
                <option value="3">Maret</option>
                <option value="4">April</option>
                <option value="5">Mei</option>
                <option value="6">Juni</option>
                <option value="7">Juli</option>
                <option value="8">Agustus</option>
                <option value="9">September</option>
                <option value="10">Oktober</option>
                <option value="11">November</option>
                <option value="12">Desember</option>
              </select>
              <input
                type="number"
                className="filter-select"
                style={{ width: "90px" }}
                placeholder="Tahun"
                value={filterYear}
                onChange={(e) => {
                  setFilterYear(e.target.value);
                  setFilterStartDate("");
                  setFilterEndDate("");
                  setPage(1);
                }}
                min="2000"
                max="2100"
                title="Filter Tahun"
              />
              {(filterStartDate || filterEndDate || filterMonth || filterYear) && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setFilterStartDate("");
                    setFilterEndDate("");
                    setFilterMonth("");
                    setFilterYear("");
                    setPage(1);
                  }}
                  style={{ height: "32px", padding: "0 10px" }}
                >
                  Reset
                </button>
              )}
            </div>
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
                  <th>Aksi Aktivitas</th>
                  <th>Aktor (Pelaksana)</th>
                  <th>Dokumen Terkait</th>
                  <th>Detail Catatan</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const { dateFormatted, timeFormatted } = formatDateTime(log.createdAt);
                  return (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <div style={{ fontWeight: 600, fontSize: "12px", color: "var(--text-primary)" }}>
                          {dateFormatted}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: "3px" }} className="mono">
                          <Clock size={10} />
                          {timeFormatted} WIB
                        </div>
                      </td>
                      <td>
                        {renderActionBadge(log.action)}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)" }}>
                          {log.user.name}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                          {log.user.email}
                        </div>
                      </td>
                      <td>
                        {log.letter ? (
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "12px" }} className="mono">
                              {log.letter.letterNumber}
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--text-tertiary)", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {log.letter.subject}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-tertiary)", fontSize: "12px" }}>—</span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>
                          {formatLogDetails(log)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
