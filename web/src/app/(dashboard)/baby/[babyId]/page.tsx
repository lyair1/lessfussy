import { TrackingGrid } from "@/components/tracking/tracking-grid";
import { LastFeeding } from "@/components/tracking/last-feeding";
import { getBaby } from "@/lib/actions/babies";
import { getFavoriteActivities } from "@/lib/actions/users";
import { getLastFeeding } from "@/lib/actions/tracking";
import { notFound } from "next/navigation";

interface BabyDashboardPageProps {
  params: Promise<{ babyId: string }>;
}

export default async function BabyDashboardPage({ params }: BabyDashboardPageProps) {
  const { babyId } = await params;
  const [baby, favorites, lastFeeding] = await Promise.all([
    getBaby(babyId),
    getFavoriteActivities(),
    getLastFeeding(babyId),
  ]);

  if (!baby) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Track Activity</h1>
        <p className="text-muted-foreground">
          Tap to log an activity for {baby.name}
        </p>
      </div>

      <LastFeeding feeding={lastFeeding} babyId={babyId} babyName={baby.name} />

      <TrackingGrid babyId={babyId} initialFavorites={favorites} />
    </div>
  );
}

