"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function PottyEntryPage() {
  const router = useRouter();
  const params = useParams();
  const babyId = params.babyId as string;
  const entryId = params.entryId as string;

  useEffect(() => {
    // Redirect potty routes to diaper routes since potty is handled by the diaper page
    router.replace(`/baby/${babyId}/diaper/${entryId}?tab=potty`);
  }, [router, babyId, entryId]);

  return null;
}
