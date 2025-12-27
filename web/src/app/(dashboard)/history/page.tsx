import { redirect } from "next/navigation";
import { getBabies } from "@/lib/actions/babies";

export default async function HistoryPage() {
  const babies = await getBabies();

  if (babies.length === 0) {
    redirect("/");
  }

  // Redirect to the first baby's history
  redirect(`/baby/${babies[0].id}/history`);
}
