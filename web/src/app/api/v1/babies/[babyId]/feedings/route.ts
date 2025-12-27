import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, feedings, babies, babyShares } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";

async function checkBabyAccess(babyId: string, userId: string) {
  const baby = await db.query.babies.findFirst({
    where: eq(babies.id, babyId),
  });

  if (!baby) return null;

  if (baby.ownerId === userId) {
    return { baby, role: "owner" };
  }

  const share = await db.query.babyShares.findFirst({
    where: and(eq(babyShares.babyId, babyId), eq(babyShares.userId, userId)),
  });

  if (share) {
    return { baby, role: share.role };
  }

  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ babyId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { babyId } = await params;
    const access = await checkBabyAccess(babyId, userId);
    if (!access) {
      return NextResponse.json({ error: "Baby not found" }, { status: 404 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    const feedingsData = await db.query.feedings.findMany({
      where: eq(feedings.babyId, babyId),
      orderBy: [desc(feedings.startTime)],
      limit,
      offset,
    });

    return NextResponse.json(feedingsData);
  } catch (error) {
    console.error("GET /api/v1/babies/[babyId]/feedings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ babyId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { babyId } = await params;
    const access = await checkBabyAccess(babyId, userId);
    if (!access) {
      return NextResponse.json({ error: "Baby not found" }, { status: 404 });
    }

    if (access.role === "viewer") {
      return NextResponse.json({ error: "View-only access" }, { status: 403 });
    }

    const body = await request.json();
    const { type, startTime, endTime, side, leftDuration, rightDuration, bottleContent, amount, amountUnit, notes } = body;

    if (!type || !startTime) {
      return NextResponse.json({ error: "type and startTime are required" }, { status: 400 });
    }

    const [newFeeding] = await db
      .insert(feedings)
      .values({
        babyId,
        type,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : undefined,
        side,
        leftDuration,
        rightDuration,
        bottleContent,
        amount,
        amountUnit,
        notes,
      })
      .returning();

    return NextResponse.json(newFeeding, { status: 201 });
  } catch (error) {
    console.error("POST /api/v1/babies/[babyId]/feedings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

