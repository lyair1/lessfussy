import { redirect } from "next/navigation";

interface PottyPageProps {
  params: Promise<{ babyId: string }>;
}

export default async function PottyPage({ params }: PottyPageProps) {
  const { babyId } = await params;
  redirect(`/baby/${babyId}/diaper?tab=potty`);
}

