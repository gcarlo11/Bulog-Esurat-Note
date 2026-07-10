import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { UserProvider } from "@/components/UserProvider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <UserProvider user={user}>
      <div className="app-layout">
        <Sidebar user={user} />
        <main className="main-content">{children}</main>
      </div>
    </UserProvider>
  );
}
