import { cookies } from "next/headers";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

// ============================================
// Session Management (JWT-based, Cryptographically Signed)
// ============================================

interface SessionData {
  userId: string;
  email: string;
  name: string;
  role: string;
  sessionId?: string;
}

const SESSION_COOKIE_NAME = "e-surat-session";
const JWT_EXPIRATION = "24h"; // Token berlaku 24 jam

/**
 * Mendapatkan secret key untuk menandatangani JWT.
 * Secret key HARUS disimpan di .env dan TIDAK boleh diketahui publik.
 * Menggunakan TextEncoder karena library 'jose' membutuhkan Uint8Array.
 */
function getJwtSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET harus diatur di .env dengan minimal 32 karakter!"
    );
  }
  return new TextEncoder().encode(secret);
}

/**
 * Membuat JWT token yang ditandatangani secara kriptografis.
 * 
 * Keamanan JWT:
 * - Token ditandatangani dengan algoritma HS256 (HMAC-SHA256)
 * - Token tidak bisa dipalsukan tanpa mengetahui SECRET KEY
 * - Token memiliki waktu kedaluwarsa (exp)
 * - Token memiliki waktu penerbitan (iat)
 */
async function createToken(data: SessionData): Promise<string> {
  const secret = getJwtSecret();
  
  return new SignJWT({
    userId: data.userId,
    email: data.email,
    name: data.name,
    role: data.role,
    sessionId: data.sessionId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRATION)
    .setIssuer("e-surat")
    .setAudience("e-surat-app")
    .sign(secret);
}

/**
 * Memverifikasi dan decode JWT token.
 * 
 * Jika token:
 * - Dipalsukan → verifikasi gagal → return null
 * - Kedaluwarsa → verifikasi gagal → return null
 * - Valid → return data session
 */
async function verifyToken(token: string): Promise<SessionData | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret, {
      issuer: "e-surat",
      audience: "e-surat-app",
    });

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as string,
      sessionId: payload.sessionId as string | undefined,
    };
  } catch {
    // Token tidak valid, kedaluwarsa, atau dipalsukan
    return null;
  }
}

/**
 * Set session cookie setelah login berhasil.
 * Cookie berisi JWT yang ditandatangani secara kriptografis.
 */
export async function setSession(data: SessionData): Promise<void> {
  const cookieStore = await cookies();
  const token = await createToken(data);
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,        // Tidak bisa diakses via JavaScript browser
    secure: process.env.NODE_ENV === "production", // HTTPS only di produksi
    sameSite: "lax",       // Proteksi CSRF
    path: "/",
    maxAge: 60 * 60 * 24,  // 1 hari (sinkron dengan JWT expiration)
  });
}

/**
 * Get session data dari cookie saat ini.
 * Memverifikasi tanda tangan JWT sebelum mengembalikan data.
 * Returns null jika token tidak ada, tidak valid, atau kedaluwarsa.
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Hapus session cookie (logout).
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Verifikasi bahwa user yang aktif masih valid di database.
 * Double-check: JWT valid + user masih aktif di DB.
 * Returns user data lengkap atau null.
 */
export async function getAuthenticatedUser() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId, isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      activeSessionId: true,
    },
  });

  if (!user) return null;

  // Jika activeSessionId ada di database, verifikasi kesamaan dengan token
  if (user.activeSessionId && session.sessionId !== user.activeSessionId) {
    return null;
  }

  return user;
}

/**
 * Memastikan user terautentikasi dan memiliki peran tertentu.
 * Throw error jika tidak.
 */
export async function requireRole(allowedRoles: string[]) {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  if (!allowedRoles.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

// ============================================
// Password Hashing (bcrypt, 12 rounds)
// ============================================

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
