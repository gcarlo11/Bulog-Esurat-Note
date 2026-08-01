"use server";

import { prisma } from "@/lib/prisma";
import {
  setSession,
  clearSession,
  getSession,
  verifyPassword,
  hashPassword,
} from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email dan password harus diisi." };
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user || !user.isActive) {
    return { error: "Email atau password salah." };
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    return { error: "Email atau password salah." };
  }

  // Set session cookie
  await setSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  await prisma.auditLog.create({
    data: {
      action: "LOGIN",
      entityType: "SESSION",
      userId: user.id,
      details: JSON.stringify({ email: user.email }),
    },
  });

  redirect("/dashboard");
}

export async function logoutAction() {
  const session = await getSession();

  if (session) {
    await prisma.auditLog.create({
      data: {
        action: "LOGOUT",
        entityType: "SESSION",
        userId: session.userId,
        details: JSON.stringify({ email: session.email }),
      },
    });
  }

  await clearSession();
  redirect("/login");
}

export async function seedAdminAction() {
  const existingAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (existingAdmin) {
    return { error: "Admin sudah ada." };
  }

  const hashedPassword = await hashPassword("admin123");

  await prisma.user.create({
    data: {
      name: "Administrator",
      email: "admin@esurat.local",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  const staffPassword = await hashPassword("staff123");
  await prisma.user.create({
    data: {
      name: "Staf Tata Usaha",
      email: "staff@esurat.local",
      password: staffPassword,
      role: "STAFF",
    },
  });

  const viewerPassword = await hashPassword("viewer123");
  await prisma.user.create({
    data: {
      name: "Pimpinan (Viewer)",
      email: "viewer@esurat.local",
      password: viewerPassword,
      role: "VIEWER",
    },
  });

  return { success: "Akun admin, staff, dan viewer berhasil dibuat!" };
}
