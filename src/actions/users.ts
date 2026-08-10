"use server";

import { prisma } from "@/lib/prisma";
import { requireRole, hashPassword } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Mendapatkan daftar seluruh pengguna.
 * Hanya dapat diakses oleh ADMIN.
 */
export async function getUsers() {
  await requireRole(["ADMIN"]);

  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
}

/**
 * Mendaftarkan akun pengguna baru.
 * Hanya dapat diakses oleh ADMIN.
 */
export async function createUserAction(formData: FormData) {
  try {
    const admin = await requireRole(["ADMIN"]);

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const role = formData.get("role") as string;
    const password = formData.get("password") as string;

    if (!name || !email || !role || !password) {
      return { error: "Semua kolom input wajib diisi." };
    }

    const emailNormalized = email.toLowerCase().trim();

    // Periksa apakah email sudah terdaftar
    const existing = await prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (existing) {
      return { error: "Email sudah terdaftar di sistem." };
    }

    const hashedPassword = await hashPassword(password);

    await prisma.user.create({
      data: {
        name: name.trim(),
        email: emailNormalized,
        role,
        password: hashedPassword,
      },
    });

    // Catat ke Log Audit
    await prisma.auditLog.create({
      data: {
        action: "CREATE_USER",
        entityType: "USER",
        userId: admin.id,
        details: JSON.stringify({ targetEmail: emailNormalized, targetRole: role }),
      },
    });

    revalidatePath("/dashboard/users");
    return { success: "Akun pengguna berhasil didaftarkan." };
  } catch (e: any) {
    console.error("Gagal membuat user:", e);
    return { error: e.message || "Gagal mendaftarkan akun." };
  }
}

/**
 * Mengaktifkan atau menonaktifkan akun pengguna.
 * Hanya dapat diakses oleh ADMIN.
 */
export async function toggleUserStatusAction(userId: string, isActive: boolean) {
  try {
    const admin = await requireRole(["ADMIN"]);

    // Mencegah admin menonaktifkan dirinya sendiri
    if (userId === admin.id) {
      return { error: "Anda tidak dapat menonaktifkan akun Anda sendiri." };
    }

    // Jika dinonaktifkan, kosongkan activeSessionId agar otomatis logout
    const updateData: { isActive: boolean; activeSessionId?: null } = { isActive };
    if (!isActive) {
      updateData.activeSessionId = null;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { email: true },
    });

    // Catat ke Log Audit
    await prisma.auditLog.create({
      data: {
        action: isActive ? "ENABLE_USER" : "DISABLE_USER",
        entityType: "USER",
        userId: admin.id,
        details: JSON.stringify({ targetUserId: userId, targetEmail: updatedUser.email }),
      },
    });

    revalidatePath("/dashboard/users");
    return { success: `Status akun pengguna berhasil ${isActive ? "diaktifkan" : "dinonaktifkan"}.` };
  } catch (e: any) {
    console.error("Gagal mengubah status user:", e);
    return { error: e.message || "Gagal mengubah status akun." };
  }
}

/**
 * Reset password pengguna dengan password baru.
 * Hanya dapat diakses oleh ADMIN.
 */
export async function resetUserPasswordAction(userId: string, newPassword: string) {
  try {
    const admin = await requireRole(["ADMIN"]);

    if (!newPassword || newPassword.trim().length < 6) {
      return { error: "Password baru minimal harus 6 karakter." };
    }

    const hashedPassword = await hashPassword(newPassword);

    // Update password dan kosongkan activeSessionId agar dipaksa login ulang
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        activeSessionId: null, // Force logout pada perangkat terhubung
      },
      select: { email: true },
    });

    // Catat ke Log Audit
    await prisma.auditLog.create({
      data: {
        action: "RESET_PASSWORD_USER",
        entityType: "USER",
        userId: admin.id,
        details: JSON.stringify({ targetUserId: userId, targetEmail: updatedUser.email }),
      },
    });

    revalidatePath("/dashboard/users");
    return { success: "Password pengguna berhasil di-reset." };
  } catch (e: any) {
    console.error("Gagal mereset password:", e);
    return { error: e.message || "Gagal mereset password." };
  }
}
