import { TrackingGrid } from "@/components/tracking/tracking-grid";
import { getBaby } from "@/lib/actions/babies";
import { notFound } from "next/navigation";

interface BabyDashboardPageProps {
  params: Promise<{ babyId: string }>;
}

export default async function BabyDashboardPage({ params }: BabyDashboardPageProps) {
  const { babyId } = await params;
  const baby = await getBaby(babyId);

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

      <TrackingGrid babyId={babyId} />
    </div>
  );
}

