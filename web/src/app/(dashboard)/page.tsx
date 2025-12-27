import { TrackingGrid } from "@/components/tracking/tracking-grid";
import { NoBabyPrompt } from "@/components/layout/no-baby-prompt";
import { getBabies } from "@/lib/actions/babies";

export default async function DashboardPage() {
  const babies = await getBabies();

  if (babies.length === 0) {
    return <NoBabyPrompt />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Track Activity</h1>
        <p className="text-muted-foreground">
          Tap to log an activity for your baby
        </p>
      </div>

      <TrackingGrid />
    </div>
  );
}

