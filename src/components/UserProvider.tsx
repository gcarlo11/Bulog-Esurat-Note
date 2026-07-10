"use client";

import { createContext, useContext, type ReactNode } from "react";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
}

const UserContext = createContext<UserData | null>(null);

export function UserProvider({
  user,
  children,
}: {
  user: UserData;
  children: ReactNode;
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}

/** Helper: apakah user boleh mengedit/membuat surat */
export function canEdit(role: string) {
  return role === "ADMIN" || role === "STAFF";
}

/** Helper: apakah user boleh mengarsipkan surat */
export function canArchive(role: string) {
  return role === "ADMIN";
}
