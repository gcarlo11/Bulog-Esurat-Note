"use client";

import { useState, useRef, useEffect } from "react";
import { loginAction, seedAdminAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StarfieldBackground } from "@/components/ui/starfield";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useTheme } from "next-themes";
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
  Inbox,
} from "lucide-react";

const DEMO_ACCOUNTS = [
  { role: "Admin", email: "admin@esurat.local", password: "admin123", color: "bg-brand-blue/10 text-brand-blue dark:text-brand-gold border-brand-blue/20 dark:border-brand-gold/20 hover:bg-brand-blue/20 dark:hover:bg-brand-gold/10" },
  { role: "Staff", email: "staff@esurat.local", password: "staff123", color: "bg-brand-gold/10 text-brand-gold dark:text-brand-blue border-brand-gold/20 dark:border-brand-blue/20 hover:bg-brand-gold/20 dark:hover:bg-brand-blue/10" },
  { role: "Viewer", email: "viewer@esurat.local", password: "viewer123", color: "bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-600/20" },
];

export default function LoginPage() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mounted, setMounted] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const isDark = !mounted || resolvedTheme === "dark";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500">
      <StarfieldBackground className="absolute inset-0 z-0" count={450} speed={0.4} />

      <div className="absolute top-4 right-4 z-50">
        <ThemeSwitcher />
      </div>

      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-4">
            <img src="/logo.svg" alt="BULOG Logo" className="h-16 w-auto object-contain" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-zinc-950 dark:text-white tracking-tight">SISTEM E-SURAT</h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-xs mt-1.5 flex items-center justify-center gap-1.5 font-medium">
            <Building2 size={12} />
            PERUM BULOG KANTOR WILAYAH SUMSEL &amp; BABEL
          </p>
        </div>

        <Card className="border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/65 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/40 text-zinc-900 dark:text-white transition-all duration-300">
          <CardHeader className="pb-4 text-center">
            <CardTitle className="text-zinc-950 dark:text-white text-xl font-bold">Masuk ke Sistem</CardTitle>
            <CardDescription className="text-zinc-500 dark:text-zinc-400 text-xs">
              Gunakan kredensial akun Anda untuk melanjutkan
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-600 dark:text-red-300">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-600 dark:text-emerald-300">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-zinc-700 dark:text-zinc-300 text-xs font-semibold">
                  Alamat Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  ref={emailRef}
                  type="email"
                  placeholder="nama@gmail.com"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/40 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus-visible:ring-indigo-500/20 h-10 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-zinc-700 dark:text-zinc-300 text-xs font-semibold">
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
                    className="bg-white/40 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus-visible:ring-indigo-500/20 h-10 pr-10 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-10 bg-brand-blue hover:bg-indigo-700 border border-brand-blue text-white dark:bg-brand-blue dark:border-brand-gold dark:hover:bg-brand-gold dark:hover:text-brand-blue font-semibold shadow-md transition-all duration-200 text-sm"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <LogIn size={14} />
                    Login
                  </>
                )}
              </Button>
            </form>

            <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-500 font-medium pt-2">
              <ShieldCheck size={11} />
              <span>Dilindungi kriptografi JWT HS256 &amp; hash bcrypt</span>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-[10px] text-zinc-400 dark:text-zinc-600 mt-5 font-medium transition-colors duration-500">
          © 2026 Perum BULOG Kanwil Sumsel &amp; Babel. Sistem E-Surat v1.2
        </p>
      </div>
    </div>
  );
}
