import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";
// Trigger stylesheet reload


export const metadata: Metadata = {
  title: "E-Surat | Sistem Pencatatan Surat Digital",
  description:
    "Aplikasi manajemen surat masuk dan keluar yang aman dengan audit trail, penomoran otomatis, dan pencegahan manipulasi data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
