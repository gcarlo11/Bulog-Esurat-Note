"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { getLetters, getLettersForExport } from "@/actions/letters";
import { CreateLetterModal } from "@/components/CreateLetterModal";
import { useUser, canEdit } from "@/components/UserProvider";
import { exportToExcel, exportToPdf } from "@/lib/export";
import {
  Search,
  Plus,
  Inbox,
  FileText,
  ArrowLeft,
  ArrowRight,
  Eye,
  FileSpreadsheet,
  FileDown,
  Layers,
} from "lucide-react";

interface Letter {
  id: string;
  letterNumber: string;
  category: string;
  type: string | null;
  subject: string;
  sender: string | null;
  recipient: string | null;
  letterDate: Date;
  classification: string;
  status: string;
  createdAt: Date;
  agendaType: string | null;
  code: string | null;
  nomorBerkas: string | null;
  nomorPetunjuk: string | null;
  nominal: number | null;
  paraf: string | null;
  createdBy: { name: string; email: string };
}

function formatDate(date: Date) {
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

const CATEGORIES = [
  { key: "ALL", label: "Semua Dokumen" },
  { key: "KELUAR_MASUK", label: "Surat Keluar / Masuk" },
  { key: "AGENDA", label: "Surat Agenda" },
  { key: "NOTA_VERIFIKASI", label: "Nota Verifikasi" },
];

export default function LettersPage() {
  const user = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryFilter = searchParams.get("category") || "ALL";
  const typeFilter = searchParams.get("type") || "ALL";
  const openCreate = searchParams.get("create") === "true";

  const [categoryTab, setCategoryTab] = useState<string>(categoryFilter);
  const [letters, setLetters] = useState<Letter[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState(typeFilter);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filter Tanggal / Bulan / Tahun
  const [filterDate, setFilterDate] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");

  // Sync categoryTab state when URL query parameter changes
  useEffect(() => {
    setCategoryTab(searchParams.get("category") || "ALL");
    setPage(1);
  }, [searchParams]);

  const filterLabel =
    categoryTab === "ALL"
      ? "Semua Dokumen"
      : categoryTab === "KELUAR_MASUK"
      ? "Surat Keluar Masuk"
      : categoryTab === "AGENDA"
      ? "Surat Agenda"
      : "Nota Verifikasi";

  const fetchLetters = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getLetters({
        category: categoryTab,
        type: type !== "ALL" ? type : undefined,
        search: search || undefined,
        page,
        date: filterDate || undefined,
        month: filterMonth ? parseInt(filterMonth, 10) : undefined,
        year: filterYear ? parseInt(filterYear, 10) : undefined,
      });
      setLetters(result.letters as Letter[]);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (e) {
      console.error("Failed to fetch letters:", e);
    } finally {
      setLoading(false);
    }
  }, [categoryTab, type, search, page, filterDate, filterMonth, filterYear]);

  useEffect(() => {
    fetchLetters();
  }, [fetchLetters]);

  useEffect(() => {
    setType(typeFilter);
    setPage(1);
  }, [typeFilter]);

  useEffect(() => {
    if (openCreate && canEdit(user.role)) {
      setShowModal(true);
    }
  }, [openCreate, user.role]);

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  async function handleExport(format: "excel" | "pdf") {
    setExporting(true);
    try {
      const allLetters = await getLettersForExport({
        category: categoryTab,
        type: type !== "ALL" ? type : undefined,
        date: filterDate || undefined,
        month: filterMonth ? parseInt(filterMonth, 10) : undefined,
        year: filterYear ? parseInt(filterYear, 10) : undefined,
      });
      if (format === "excel") {
        exportToExcel(allLetters as any, filterLabel);
      } else {
        exportToPdf(allLetters as any, filterLabel);
      }
    } catch (e) {
      console.error("Export failed:", e);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2>Pencatatan Dokumen</h2>
          <p>Kelola pencatatan arsip surat agenda, surat masuk keluar, dan nota verifikasi secara aman.</p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleExport("excel")}
            disabled={exporting || total === 0}
            title="Export ke Excel"
          >
            <FileSpreadsheet size={14} />
            Excel
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleExport("pdf")}
            disabled={exporting || total === 0}
            title="Export ke PDF"
          >
            <FileDown size={14} />
            PDF
          </button>

          {canEdit(user.role) && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
              <Plus size={14} />
              Registrasi Dokumen
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="tabs" style={{ marginBottom: "16px" }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            className={`tab ${categoryTab === cat.key ? "active" : ""}`}
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              if (cat.key === "ALL") {
                params.delete("category");
              } else {
                params.set("category", cat.key);
              }
              params.set("page", "1");
              router.push(`/dashboard/letters?${params.toString()}`);
            }}
          >
            <Layers size={14} />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Table Card */}
      <div className="table-wrapper" style={{ border: "1px solid var(--border-default)" }}>
        {/* Toolbar */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--border-default)", gap: "12px" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <div className="search-wrapper">
              <Search />
              <input
                type="text"
                className="search-input"
                placeholder="Cari kata kunci..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            {categoryTab === "KELUAR_MASUK" && (
              <select
                className="filter-select"
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  setPage(1);
                }}
              >
                <option value="ALL">Semua Tipe</option>
                <option value="MASUK">Surat Masuk</option>
                <option value="KELUAR">Surat Keluar</option>
              </select>
            )}

            {/* Date Filters */}
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <input
                type="date"
                className="filter-select"
                value={filterDate}
                onChange={(e) => {
                  setFilterDate(e.target.value);
                  setFilterMonth("");
                  setFilterYear("");
                  setPage(1);
                }}
                title="Filter Tanggal Spesifik"
              />
              <select
                className="filter-select"
                value={filterMonth}
                onChange={(e) => {
                  setFilterMonth(e.target.value);
                  setFilterDate("");
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
                  setFilterDate("");
                  setPage(1);
                }}
                min="2000"
                max="2100"
                title="Filter Tahun"
              />
              {(filterDate || filterMonth || filterYear) && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setFilterDate("");
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
            {total} dokumen ditemukan
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <FileText />
            <h3>Memuat data...</h3>
          </div>
        ) : letters.length > 0 ? (
          <>
            <table>
              {/* ======================================================== */}
              {/* CONDITIONAL TABLE THEAD BY CATEGORY                      */}
              {/* ======================================================== */}
              {categoryTab === "AGENDA" ? (
                <thead>
                  <tr>
                    <th>No. Agenda</th>
                    <th>Jenis Agenda</th>
                    <th>Perihal</th>
                    <th>Tujuan</th>
                    <th>Tanggal</th>
                    <th>Kode</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
              ) : categoryTab === "KELUAR_MASUK" ? (
                <thead>
                  <tr>
                    <th>No. Surat</th>
                    <th>Tipe</th>
                    <th>Perihal</th>
                    <th>Pengirim</th>
                    <th>Penerima</th>
                    <th>Tanggal</th>
                    <th>No. Berkas</th>
                    <th>No. Petunjuk</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
              ) : categoryTab === "NOTA_VERIFIKASI" ? (
                <thead>
                  <tr>
                    <th>No. Nota</th>
                    <th>Perihal</th>
                    <th>Tanggal</th>
                    <th>Nominal</th>
                    <th>Paraf</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
              ) : (
                <thead>
                  <tr>
                    <th>No. Dokumen</th>
                    <th>Kategori</th>
                    <th>Perihal</th>
                    <th>Penerima/Tujuan</th>
                    <th>Tanggal</th>
                    <th>Info Tambahan</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
              )}

              {/* ======================================================== */}
              {/* CONDITIONAL TABLE TBODY BY CATEGORY                      */}
              {/* ======================================================== */}
              <tbody>
                {letters.map((letter) => {
                  if (categoryTab === "AGENDA") {
                    return (
                      <tr key={letter.id}>
                        <td><span className="id-cell">{letter.letterNumber}</span></td>
                        <td><span style={{ fontWeight: 500 }}>{letter.agendaType}</span></td>
                        <td style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{letter.subject}</td>
                        <td>{letter.recipient}</td>
                        <td style={{ fontSize: "12px" }}>{formatDate(letter.letterDate)}</td>
                        <td><code className="mono">{letter.code || "—"}</code></td>
                        <td>
                          <span className={`status-badge status-${letter.status.toLowerCase()}`}>
                            <span className="status-dot"></span>
                            {letter.status === "ACTIVE" ? "Aktif" : "Arsip"}
                          </span>
                        </td>
                        <td>
                          <Link href={`/dashboard/letters/${letter.id}`} className="btn btn-secondary btn-sm" style={{ padding: "4px 8px" }}>
                            <Eye size={12} /> Detail
                          </Link>
                        </td>
                      </tr>
                    );
                  }

                  if (categoryTab === "KELUAR_MASUK") {
                    return (
                      <tr key={letter.id}>
                        <td><span className="id-cell">{letter.letterNumber}</span></td>
                        <td>
                          <span className={`type-badge type-${(letter.type || "").toLowerCase()}`}>
                            {letter.type === "MASUK" ? "Masuk" : "Keluar"}
                          </span>
                        </td>
                        <td style={{ maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{letter.subject}</td>
                        <td>{letter.sender || "—"}</td>
                        <td>{letter.recipient || "—"}</td>
                        <td style={{ fontSize: "12px" }}>{formatDate(letter.letterDate)}</td>
                        <td>{letter.nomorBerkas || "—"}</td>
                        <td>{letter.nomorPetunjuk || "—"}</td>
                        <td>
                          <Link href={`/dashboard/letters/${letter.id}`} className="btn btn-secondary btn-sm" style={{ padding: "4px 8px" }}>
                            <Eye size={12} /> Detail
                          </Link>
                        </td>
                      </tr>
                    );
                  }

                  if (categoryTab === "NOTA_VERIFIKASI") {
                    return (
                      <tr key={letter.id}>
                        <td><span className="id-cell">{letter.letterNumber}</span></td>
                        <td style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{letter.subject}</td>
                        <td style={{ fontSize: "12px" }}>{formatDate(letter.letterDate)}</td>
                        <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{letter.nominal ? formatRupiah(letter.nominal) : "—"}</td>
                        <td><span style={{ fontStyle: "italic", fontSize: "12px" }}>{letter.paraf || "—"}</span></td>
                        <td>
                          <span className={`status-badge status-${letter.status.toLowerCase()}`}>
                            <span className="status-dot"></span>
                            {letter.status === "ACTIVE" ? "Aktif" : "Arsip"}
                          </span>
                        </td>
                        <td>
                          <Link href={`/dashboard/letters/${letter.id}`} className="btn btn-secondary btn-sm" style={{ padding: "4px 8px" }}>
                            <Eye size={12} /> Detail
                          </Link>
                        </td>
                      </tr>
                    );
                  }

                  // Default Fallback (All)
                  return (
                    <tr key={letter.id}>
                      <td>
                        <span className="id-cell">{letter.letterNumber}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "var(--text-tertiary)" }}>
                          {letter.category.replace("_", " ")}
                        </span>
                      </td>
                      <td style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500, color: "var(--text-primary)" }}>
                        {letter.subject}
                      </td>
                      <td>{letter.recipient || letter.sender || "—"}</td>
                      <td style={{ fontSize: "12px" }}>{formatDate(letter.letterDate)}</td>
                      <td style={{ fontSize: "12px" }}>
                        {letter.category === "AGENDA" && (
                          <span>Type: {letter.agendaType}</span>
                        )}
                        {letter.category === "KELUAR_MASUK" && (
                          <span>Tipe: {letter.type}</span>
                        )}
                        {letter.category === "NOTA_VERIFIKASI" && (
                          <span style={{ fontWeight: 500 }}>{letter.nominal ? formatRupiah(letter.nominal) : "—"}</span>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge status-${letter.status.toLowerCase()}`}>
                          <span className="status-dot"></span>
                          {letter.status === "ACTIVE" ? "Aktif" : "Arsip"}
                        </span>
                      </td>
                      <td>
                        <Link href={`/dashboard/letters/${letter.id}`} className="btn btn-secondary btn-sm" style={{ padding: "4px 8px" }}>
                          <Eye size={12} /> Detail
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="pagination">
              <div className="pagination-info">
                Menampilkan {letters.length} dari {total} dokumen
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
            <Inbox />
            <h3>Belum Ada Dokumen</h3>
            <p>
              {search
                ? "Tidak ditemukan dokumen yang cocok dengan pencarian."
                : canEdit(user.role)
                ? "Mulai dengan mendaftarkan dokumen pertama."
                : "Belum ada dokumen yang terdaftar di sistem."}
            </p>
          </div>
        )}
      </div>

      {showModal && canEdit(user.role) && (
        <CreateLetterModal
          onClose={() => setShowModal(false)}
          onSuccess={fetchLetters}
        />
      )}
    </div>
  );
}
