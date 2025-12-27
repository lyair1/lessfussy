import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ensureUserExists } from "@/lib/actions/users";
import { getBabies } from "@/lib/actions/babies";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
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

