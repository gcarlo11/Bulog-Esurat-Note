"use client";

import { useState } from "react";
import { loginAction, seedAdminAction } from "@/actions/auth";
import { Inbox, Key, AlertCircle, CheckCircle, Settings, Shield } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  async function handleLogin(formData: FormData) {
    setLoading(true);
    setError("");
    try {
      const result = await loginAction(formData);
      if (result?.error) {
        setError(result.error);
      }
    } catch {
      // redirect throws - this is expected
    } finally {
      setLoading(false);
    }
  }

  async function handleSeed() {
    setSeeding(true);
    setError("");
    setSuccess("");
    try {
      const result = await seedAdminAction();
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setSuccess(result.success);
      }
    } catch {
      setError("Gagal membuat akun demo.");
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Header */}
        <div className="login-header">
          <div className="login-logo-icon">
            <Inbox size={20} strokeWidth={2.5} />
          </div>
          <h2>E-Surat</h2>
          <p>Sistem Pencatatan Surat Digital</p>
        </div>

        {/* Login Card */}
        <div className="login-card">
          {error && (
            <div className="alert alert-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="alert alert-success">
              <CheckCircle size={16} />
              <span>{success}</span>
            </div>
          )}

          <form action={handleLogin}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Alamat Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                placeholder="masukkan email anda..."
                required
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="form-input"
                placeholder="masukkan password..."
                required
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Key size={14} />
              {loading ? "Memproses..." : "Masuk ke Sistem"}
            </button>
          </form>

          {/* Demo Accounts */}
          <div className="login-demo">
            <h4>Akun Demo</h4>
            <div className="demo-account">
              <span>Admin</span>
              <code>admin@esurat.local / admin123</code>
            </div>
            <div className="demo-account">
              <span>Staff</span>
              <code>staff@esurat.local / staff123</code>
            </div>
            <div className="demo-account">
              <span>Viewer</span>
              <code>viewer@esurat.local / viewer123</code>
            </div>
            <button
              onClick={handleSeed}
              className="btn btn-secondary btn-sm"
              disabled={seeding}
              style={{ width: "100%", justifyContent: "center", marginTop: "12px" }}
            >
              <Settings size={12} />
              {seeding ? "Membuat akun..." : "Inisialisasi Akun Demo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
