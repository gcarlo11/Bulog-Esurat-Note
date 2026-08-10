"use client";

import { useState, useEffect, useCallback } from "react";
import { getUsers, toggleUserStatusAction, resetUserPasswordAction } from "@/actions/users";
import { CreateUserModal } from "@/components/CreateUserModal";
import { useUser } from "@/components/UserProvider";
import { 
  Users, 
  Plus, 
  Key, 
  UserX, 
  UserCheck, 
  AlertCircle, 
  Save, 
  X,
  Shield,
  ShieldCheck,
  Eye,
  Mail
} from "lucide-react";
import { useRouter } from "next/navigation";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
}

export default function UsersManagementPage() {
  const currentUser = useUser();
  const router = useRouter();
  
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState("");
  
  // State for Custom Reset Password Modal
  const [resetTarget, setResetTarget] = useState<{ id: string; name: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");

  // Melindungi halaman secara client-side juga
  useEffect(() => {
    if (currentUser.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [currentUser, router]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getUsers();
      setUsers(result as UserItem[]);
    } catch (e: any) {
      setError("Gagal memuat daftar pengguna. Anda mungkin tidak memiliki akses.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleToggleStatus(userId: string, currentStatus: boolean) {
    if (userId === currentUser.id) {
      setError("Anda tidak dapat menonaktifkan akun Anda sendiri.");
      return;
    }

    const confirmMsg = `Apakah Anda yakin ingin ${currentStatus ? "menonaktifkan" : "mengaktifkan"} akun pengguna ini?`;
    if (!confirm(confirmMsg)) return;

    setActionLoadingId(userId);
    setError("");
    setSuccess("");

    try {
      const result = await toggleUserStatusAction(userId, !currentStatus);
      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setSuccess(result.success);
        fetchUsers();
      }
    } catch (e: any) {
      setError(e.message || "Gagal memperbarui status akun.");
    } finally {
      setActionLoadingId("");
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetTarget) return;

    if (!newPassword || newPassword.trim().length < 6) {
      setResetError("Password baru harus minimal 6 karakter.");
      return;
    }

    setResetLoading(true);
    setResetError("");
    setSuccess("");

    try {
      const result = await resetUserPasswordAction(resetTarget.id, newPassword);
      if (result.error) {
        setResetError(result.error);
      } else if (result.success) {
        setSuccess(result.success);
        setNewPassword("");
        setResetTarget(null);
      }
    } catch (e: any) {
      setResetError(e.message || "Gagal mengubah password.");
    } finally {
      setResetLoading(false);
    }
  }

  function formatDate(dateVal: Date) {
    return new Date(dateVal).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }

  if (currentUser.role !== "ADMIN") {
    return null; // Pengalihan dihandle oleh useEffect
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2>Manajemen Pengguna</h2>
          <p>Tambahkan, kelola peran, dan atur status akses aktif bagi akun pengguna E-Surat.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)}>
          <Plus size={14} />
          Tambah Akun Baru
        </button>
      </div>

      {/* Alert Notices */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: "16px" }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success" style={{ marginBottom: "16px" }}>
          <Save size={16} />
          <span>{success}</span>
        </div>
      )}

      {/* Users Table section */}
      <div className="table-wrapper" style={{ border: "1px solid var(--border-default)" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-default)", fontWeight: 600, fontSize: "14px", color: "var(--text-primary)" }}>
          Daftar Akun Terdaftar
        </div>

        {loading ? (
          <div className="empty-state">
            <Users style={{ animation: "pulse 2s infinite" }} />
            <h3>Memuat data pengguna...</h3>
          </div>
        ) : users.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Nama Pengguna</th>
                <th>Alamat Email</th>
                <th>Peran / Akses</th>
                <th>Tanggal Terdaftar</th>
                <th>Status Akun</th>
                <th style={{ textAlign: "right" }}>Aksi Kelola</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ opacity: user.isActive ? 1 : 0.65 }}>
                  <td>
                    <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>{user.name}</div>
                    {user.id === currentUser.id && (
                      <span style={{ fontSize: "10px", color: "var(--accent)", fontWeight: 600 }}>
                        (Akun Anda)
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Mail size={12} className="text-tertiary" />
                      <span>{user.email}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ 
                      fontSize: "11px", 
                      fontWeight: 600, 
                      padding: "2px 8px", 
                      borderRadius: "4px", 
                      background: user.role === "ADMIN" ? "rgba(var(--accent-rgb), 0.1)" : "var(--bg-muted)",
                      color: user.role === "ADMIN" ? "var(--accent)" : "var(--text-secondary)"
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ fontSize: "12px" }}>
                    {formatDate(user.createdAt)}
                  </td>
                  <td>
                    <span className={`status-badge status-${user.isActive ? "active" : "archived"}`}>
                      <span className="status-dot"></span>
                      {user.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                      <button
                        title="Reset Password"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setResetTarget({ id: user.id, name: user.name });
                          setResetError("");
                        }}
                        style={{ padding: "4px 8px" }}
                      >
                        <Key size={12} />
                        Password
                      </button>
                      
                      {user.id !== currentUser.id && (
                        <button
                          title={user.isActive ? "Nonaktifkan Akun" : "Aktifkan Akun"}
                          className={`btn ${user.isActive ? "btn-secondary" : "btn-primary"} btn-sm`}
                          disabled={actionLoadingId === user.id}
                          onClick={() => handleToggleStatus(user.id, user.isActive)}
                          style={{ padding: "4px 8px", gap: "4px" }}
                        >
                          {user.isActive ? (
                            <>
                              <UserX size={12} />
                              Blokir
                            </>
                          ) : (
                            <>
                              <UserCheck size={12} />
                              Aktifkan
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <Users />
            <h3>Tidak Ada Pengguna</h3>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchUsers}
        />
      )}

      {/* Reset Password Modal */}
      {resetTarget && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setResetTarget(null)}>
          <div className="modal" style={{ maxWidth: "400px" }}>
            <div className="modal-header">
              <h3>Reset Password Akun</h3>
              <button className="modal-close" onClick={() => setResetTarget(null)} aria-label="Tutup">
                <X size={16} />
              </button>
            </div>
            {resetError && (
              <div className="alert alert-error" style={{ marginBottom: "12px" }}>
                <AlertCircle size={14} />
                <span>{resetError}</span>
              </div>
            )}
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label className="form-label">Nama Pengguna</label>
                <div className="form-input" style={{ background: "var(--bg-muted)", color: "var(--text-secondary)", pointerEvents: "none" }}>
                  {resetTarget.name}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="newPassword">Password Baru *</label>
                <input
                  id="newPassword"
                  type="password"
                  className="form-input"
                  placeholder="Masukkan password baru..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <div className="alert alert-warning" style={{ fontSize: "11px", padding: "8px 12px", gap: "8px", margin: "12px 0 20px" }}>
                <Key size={14} />
                <span>Menyetel password baru akan memaksa akun ini logout dari seluruh perangkat terhubung.</span>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setResetTarget(null)} disabled={resetLoading}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={resetLoading}>
                  <Save size={14} />
                  {resetLoading ? "Menyimpan..." : "Reset Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
