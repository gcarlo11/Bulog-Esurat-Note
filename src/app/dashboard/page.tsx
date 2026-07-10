import { getDashboardStats } from "@/actions/letters";
import { getAuthenticatedUser } from "@/lib/auth";
import Link from "next/link";
import { generateLetterHash } from "@/lib/hash";
import {
  FileText,
  Inbox,
  Send,
  Calendar,
  ArrowUpRight,
  ShieldCheck,
  Plus,
} from "lucide-react";

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getActionLabel(action: string) {
  const map: Record<string, string> = {
    CREATE: "Mendaftarkan surat",
    UPDATE: "Mengubah surat",
    ARCHIVE: "Mengarsipkan surat",
    LOGIN: "Masuk ke sistem",
    LOGOUT: "Keluar dari sistem",
  };
  return map[action] || action;
}

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();
  const stats = await getDashboardStats();

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2>Ringkasan Dokumen</h2>
          <p>Pantau arus masuk dan keluar surat secara real-time dan aman.</p>
        </div>
        {(user?.role === "ADMIN" || user?.role === "STAFF") && (
          <Link href="/dashboard/letters?create=true" className="btn btn-primary btn-sm">
            <Plus size={14} />
            Registrasi Baru
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">
            <FileText size={14} />
            Total Surat Aktif
          </div>
          <div className="stat-value">{stats.totalLetters}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">
            <Inbox size={14} />
            Surat Masuk
          </div>
          <div className="stat-value">{stats.suratMasuk}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">
            <Send size={14} />
            Surat Keluar
          </div>
          <div className="stat-value">{stats.suratKeluar}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">
            <Calendar size={14} />
            Surat Bulan Ini
          </div>
          <div className="stat-value">{stats.suratBulanIni}</div>
        </div>
      </div>

      {/* Content Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "24px", alignItems: "start" }}>
        {/* Left: Scannable Data Table */}
        <div className="table-section">
          <div className="table-toolbar">
            <h3>Pencatatan Terbaru</h3>
            <Link href="/dashboard/letters" className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              Semua Surat
              <ArrowUpRight size={12} />
            </Link>
          </div>

          <div className="table-wrapper">
            {stats.recentLetters.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>No. Surat / Hash</th>
                    <th>Perihal</th>
                    <th>Tipe</th>
                    <th>Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentLetters.map((letter) => {
                    const hash = generateLetterHash({
                      id: letter.id,
                      letterNumber: letter.letterNumber,
                      subject: letter.subject,
                      sender: letter.sender,
                      recipient: letter.recipient,
                      letterDate: letter.letterDate,
                    });
                    const shortHash = hash.substring(0, 12) + "...";

                    return (
                      <tr key={letter.id}>
                        <td>
                          <div className="id-cell">
                            <Link href={`/dashboard/letters/${letter.id}`} className="text-link">
                              {letter.letterNumber}
                            </Link>
                          </div>
                          <div className="mono" style={{ fontSize: "10px", color: "var(--text-tertiary)", marginTop: "2px" }} title={hash}>
                            SHA256: {shortHash}
                          </div>
                        </td>
                        <td style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{letter.subject}</span>
                        </td>
                        <td>
                          <span className={`type-badge type-${letter.type.toLowerCase()}`}>
                            {letter.type === "MASUK" ? "Masuk" : "Keluar"}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: "12px" }}>{formatDate(letter.letterDate)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <FileText />
                <h3>Belum Ada Dokumen</h3>
                <p>Mulai mendaftarkan surat masuk atau keluar untuk melihat pencatatan.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Modern Audit Log Feed */}
        <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", padding: "24px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <ShieldCheck size={16} />
            Log Keamanan Sistem
          </h3>

          {stats.recentLogs.length > 0 ? (
            <div className="timeline">
              {stats.recentLogs.map((log) => (
                <div key={log.id} className={`timeline-item ${log.action.toLowerCase()}`}>
                  <div className="timeline-action">
                    {getActionLabel(log.action)}
                  </div>
                  <div className="timeline-meta">
                    {log.user.name} • {new Date(log.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <ShieldCheck />
              <h3>Log Masih Kosong</h3>
              <p>Segala aktivitas sistem akan tercatat di sini dengan imutabel.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
