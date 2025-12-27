"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useBaby } from "@/components/layout/dashboard-shell";

export default function BabyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const { babies, selectedBaby, setSelectedBaby } = useBaby();
  const babyId = params.babyId as string;

  // Sync the URL baby ID with the context
  useEffect(() => {
    const baby = babies.find((b) => b.id === babyId);
    if (baby && selectedBaby?.id !== babyId) {
      setSelectedBaby(baby);
    } else if (!baby && babies.length > 0) {
      // Baby not found, redirect to first baby
      router.replace(`/baby/${babies[0].id}`);
    }
  }, [babyId, babies, selectedBaby, setSelectedBaby, router]);

  // If baby not found and no babies available, redirect to babies page
  if (babies.length === 0) {
    return null;
  }

  return <>{children}</>;
}

