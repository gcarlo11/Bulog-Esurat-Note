"use client";

import { useState } from "react";
import { createUserAction } from "@/actions/users";
import { X, Save, AlertCircle } from "lucide-react";

interface CreateUserModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateUserModal({ onClose, onSuccess }: CreateUserModalProps) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await createUserAction(formData);
      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setSuccess(result.success);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      }
    } catch (e: any) {
      setError(e.message || "Gagal membuat akun.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: "480px" }}>
        <div className="modal-header">
          <div>
            <h3>Registrasi Akun Baru</h3>
            <span style={{ fontSize: "11px", color: "var(--text-tertiary)", fontWeight: 500 }}>
              Tanda (*) menunjukkan kolom yang wajib diisi
            </span>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Tutup modal">
            <X size={16} />
          </button>
        </div>

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

        <form action={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">
              Nama Lengkap *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className="form-input"
              placeholder="Masukkan nama lengkap..."
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Alamat Email *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-input"
              placeholder="Masukkan alamat email..."
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="role">
                Peran Akses (Role) *
              </label>
              <select id="role" name="role" className="form-select" required>
                <option value="STAFF">STAFF (Tata Usaha)</option>
                <option value="ADMIN">ADMIN (Administrator)</option>
                <option value="VIEWER">VIEWER (Pimpinan)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password Awal *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="form-input"
                placeholder="Minimal 6 karakter..."
                minLength={6}
                required
              />
            </div>
          </div>

          <div className="modal-actions" style={{ marginTop: "24px" }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Save size={14} />
              {loading ? "Menyimpan..." : "Registrasikan Akun"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
