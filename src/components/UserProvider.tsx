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

export function canEdit(role: string) {
  return role === "ADMIN" || role === "STAFF";
}

export function canArchive(role: string) {
  return role === "ADMIN";
}
