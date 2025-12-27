import { redirect } from "next/navigation";
import { getBabies } from "@/lib/actions/babies";

export default async function DiaperPage() {
  const babies = await getBabies();

  if (babies.length === 0) {
    redirect("/");
  }

  redirect(`/baby/${babies[0].id}/diaper`);
}
