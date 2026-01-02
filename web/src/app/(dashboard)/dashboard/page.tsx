import { redirect } from "next/navigation";
import { getBabies } from "@/lib/actions/babies";

export default async function DashboardLandingPage() {
  const babies = await getBabies();
  
  // If user has babies, redirect to the first baby's track page
  if (babies.length > 0) {
    redirect(`/baby/${babies[0].id}`);
  }
  
  // If no babies, redirect to babies page to add one
  redirect("/babies");
}

