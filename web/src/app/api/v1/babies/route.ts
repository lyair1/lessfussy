import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, babies, babyShares } from "@/lib/db";
import { eq, or } from "drizzle-orm";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get babies owned by user
    const ownedBabies = await db.query.babies.findMany({
      where: eq(babies.ownerId, userId),
      orderBy: (babies, { desc }) => [desc(babies.createdAt)],
    });

    // Get babies shared with user
    const sharedBabyIds = await db.query.babyShares.findMany({
      where: eq(babyShares.userId, userId),
    });

    const sharedBabies = await Promise.all(
      sharedBabyIds.map(async (share) => {
        const baby = await db.query.babies.findFirst({
          where: eq(babies.id, share.babyId),
        });
        return baby ? { ...baby, isShared: true, role: share.role } : null;
      })
    );

    const allBabies = [
      ...ownedBabies.map((b) => ({ ...b, isShared: false, role: "owner" })),
      ...sharedBabies.filter(Boolean),
    ];

    return NextResponse.json(allBabies);
  } catch (error) {
    console.error("GET /api/v1/babies error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, birthDate } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const [newBaby] = await db
      .insert(babies)
      .values({
        name,
        birthDate: birthDate || null,
        ownerId: userId,
      })
      .returning();

    return NextResponse.json(newBaby, { status: 201 });
  } catch (error) {
    console.error("POST /api/v1/babies error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


