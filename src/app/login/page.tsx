"use client";

import { useState, useRef } from "react";
import { loginAction, seedAdminAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InteractiveParticles } from "@/components/ui/interactive-particles";
import {
  Eye,
  EyeOff,
  LogIn,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  FileText,
  Building2,
} from "lucide-react";

// Akun demo untuk quick-fill
const DEMO_ACCOUNTS = [
  { role: "Admin", email: "admin@esurat.local", password: "admin123", color: "bg-indigo-600/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-600/20" },
  { role: "Staff", email: "staff@esurat.local", password: "staff123", color: "bg-sky-600/10 text-sky-400 border-sky-500/20 hover:bg-sky-600/20" },
  { role: "Viewer", email: "viewer@esurat.local", password: "viewer123", color: "bg-emerald-600/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-600/20" },
];

export default function LoginPage() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const emailRef = useRef<HTMLInputElement>(null);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const formData = new FormData(e.currentTarget);

    try {
      const result = await loginAction(formData);
      if (result?.error) {
        setError(result.error);
      }
    } catch {
      // redirect throws — expected
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

  function fillDemo(acc: typeof DEMO_ACCOUNTS[0]) {
    setEmail(acc.email);
    setPassword(acc.password);
    setError("");
    emailRef.current?.focus();
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Interactive Particles Background */}
      <InteractiveParticles className="absolute inset-0 z-0" quantity={100} />

      {/* Decorative glows */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/40 mb-4 ring-4 ring-indigo-500/20">
            <FileText className="text-white" size={28} strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">E-Surat</h1>
          <p className="text-slate-400 text-sm mt-1 flex items-center justify-center gap-1.5">
            <Building2 size={13} />
            PERUM BULOG — Kanwil Sumsel &amp; Babel
          </p>
        </div>

        {/* Card with sleek glassmorphism styling */}
        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-2xl shadow-black/40 text-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-xl">Masuk ke Sistem</CardTitle>
            <CardDescription className="text-slate-400">
              Gunakan kredensial akun Anda untuk melanjutkan
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Alert Error */}
            {error && (
              <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Alert Success */}
            {success && (
              <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">
                  Alamat Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  ref={emailRef}
                  type="email"
                  placeholder="nama@esurat.local"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-950/40 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500/30 h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-slate-950/40 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500/30 h-11 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30 transition-all duration-200"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <LogIn size={16} />
                    Masuk ke Sistem
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900/60 px-2 text-slate-500">Akun Demo</span>
              </div>
            </div>

            {/* Demo Account Quick-Fill Buttons */}
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => fillDemo(acc)}
                  className={`text-xs font-semibold px-2 py-2 rounded-lg border transition-all duration-150 ${acc.color}`}
                >
                  {acc.role}
                </button>
              ))}
            </div>

            {/* Seed Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSeed}
              disabled={seeding}
              className="w-full border-slate-800 bg-slate-950/20 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              {seeding ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Membuat akun...
                </>
              ) : (
                <>
                  <RefreshCw size={13} />
                  Inisialisasi Akun Demo
                </>
              )}
            </Button>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 pt-1">
              <ShieldCheck size={12} />
              <span>Dilindungi JWT &amp; bcrypt — Sesi 24 jam</span>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-600 mt-6">
          © 2024 Perum BULOG Kanwil Sumsel &amp; Babel. Sistem E-Surat v1.0
        </p>
      </div>
    </div>
  );
}
