import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, sleepLogs, babies, babyShares } from "@/lib/db";
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

    const sleepData = await db.query.sleepLogs.findMany({
      where: eq(sleepLogs.babyId, babyId),
      orderBy: [desc(sleepLogs.startTime)],
      limit,
      offset,
    });

    return NextResponse.json(sleepData);
  } catch (error) {
    console.error("GET /api/v1/babies/[babyId]/sleep error:", error);
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
    const { startTime, endTime, startMood, endMood, fallAsleepTime, sleepMethod, wokeUpChild, notes } = body;

    if (!startTime) {
      return NextResponse.json({ error: "startTime is required" }, { status: 400 });
    }

    const [newSleep] = await db
      .insert(sleepLogs)
      .values({
        babyId,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : undefined,
        startMood,
        endMood,
        fallAsleepTime,
        sleepMethod,
        wokeUpChild,
        notes,
      })
      .returning();

    return NextResponse.json(newSleep, { status: 201 });
  } catch (error) {
    console.error("POST /api/v1/babies/[babyId]/sleep error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

