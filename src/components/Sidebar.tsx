"use client";

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
      { name: "Nota Verifikasi", href: "/dashboard/letters?category=NOTA_VERIFIKASI", icon: FileCheck },
      { name: "Semua Dokumen", href: "/dashboard/letters", icon: Layers },
    ],
  },
];

const adminGroup = {
  label: "Administrasi",
  items: [
    { name: "Log Audit", href: "/dashboard/audit-logs", icon: ShieldCheck },
  ],
};

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "ALL";

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
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Inbox size={16} strokeWidth={2.5} />
        </div>
        <h1>SISTEM E-SURAT</h1>
      </div>

      {/* Navigation */}
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

      {/* Footer */}
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
  );
}
