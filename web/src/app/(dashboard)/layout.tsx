import * as React from "react";
import { redirect } from "next/navigation";
import { ensureUserExists } from "@/lib/actions/users";
import { getBabies } from "@/lib/actions/babies";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getUser } from "@/lib/supabase/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authUser = await getUser();
  if (!authUser) {
    redirect("/sign-in");
  }

  // Ensure user exists in our database
  const user = await ensureUserExists();
  const babies = await getBabies();

  return (
    <DashboardShell user={user!} babies={babies}>
      {children}
    </DashboardShell>
  );
}
