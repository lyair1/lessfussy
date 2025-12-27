import { redirect } from "next/navigation";
import { NoBabyPrompt } from "@/components/layout/no-baby-prompt";
import { getBabies } from "@/lib/actions/babies";

export default async function DashboardPage() {
  const babies = await getBabies();

  if (babies.length === 0) {
    return <NoBabyPrompt />;
  }

  // Redirect to the first baby's dashboard
  redirect(`/baby/${babies[0].id}`);
}
