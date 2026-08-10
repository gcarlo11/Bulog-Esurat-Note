"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { logoutAction } from "@/actions/auth";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import {
  LayoutDashboard,
  BookOpen,
  Mail,
  FileCheck,
  Layers,
  ShieldCheck,
  LogOut,
  Inbox,
  FileText,
  Menu,
  X,
  Users,
} from "lucide-react";

interface SidebarProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

const navGroups = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Pencatatan",
    items: [
      { name: "Surat Agenda", href: "/dashboard/letters?category=AGENDA", icon: BookOpen },
      { name: "Surat Keluar / Masuk", href: "/dashboard/letters?category=KELUAR_MASUK", icon: Mail },
      { name: "Surat Dinas Internal", href: "/dashboard/letters?category=SURAT_DINAS_INTERNAL", icon: FileText },
      { name: "Nota Verifikasi", href: "/dashboard/letters?category=NOTA_VERIFIKASI", icon: FileCheck },
      { name: "Nota Internal / Divisi", href: "/dashboard/letters?category=NOTA_DIVISI", icon: FileText },
      { name: "Semua Dokumen", href: "/dashboard/letters", icon: Layers },
    ],
  },
];

const adminGroup = {
  label: "Administrasi",
  items: [
    { name: "Manajemen Pengguna", href: "/dashboard/users", icon: Users },
    { name: "Log Audit", href: "/dashboard/audit-logs", icon: ShieldCheck },
  ],
};

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "ALL";
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const groups = user.role === "ADMIN" ? [...navGroups, adminGroup] : navGroups;

  function isActive(href: string): boolean {
    const url = new URL(href, "http://localhost");
    const basePath = url.pathname;
    const categoryParam = url.searchParams.get("category") || "ALL";

    if (basePath !== pathname) {
      if (basePath === "/dashboard/letters" && pathname.startsWith("/dashboard/letters/")) {
        return true;
      }
      return false;
    }

    if (basePath === "/dashboard/letters") {
      return categoryParam === currentCategory;
    }

    return true;
  }

  return (
    <>
      <div className="mobile-header">
        <button
          className="mobile-menu-btn"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label="Buka menu navigasi"
        >
          {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="mobile-brand" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* <div className="sidebar-brand-icon" style={{ width: 24, height: 24, borderRadius: 5 }}>
            <Inbox size={14} strokeWidth={2.5} />
          </div> */}
          <img src="/brand.svg" alt="BULOG" style={{ height: "35px", width: "auto", display: "block" }} />
        </div>
        <ThemeSwitcher />
      </div>

      {isMobileOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${isMobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-brand" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* <div className="sidebar-brand-icon">
            <Inbox size={16} strokeWidth={2.5} />
          </div> */}
          <img src="/brand.svg" alt="BULOG" style={{ height: "40px", width: "auto", display: "block" }} />
        </div>

        <nav style={{ flex: 1 }}>
          {groups.map((group) => (
            <div key={group.label} className="nav-section">
              <div className="nav-label">{group.label}</div>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`nav-link ${isActive(item.href) ? "active" : ""}`}
                  >
                    <Icon size={16} strokeWidth={1.8} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 12px",
              marginBottom: 12,
            }}
          >
            <ThemeSwitcher />
            <form action={logoutAction}>
              <button type="submit" className="btn btn-ghost btn-sm">
                <LogOut size={14} strokeWidth={1.8} />
                Keluar
              </button>
            </form>
          </div>
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <p>{user.name}</p>
              <span>{user.role}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
