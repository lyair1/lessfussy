import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      unitSystem: user.unitSystem,
      tempUnit: user.tempUnit,
      timeFormat: user.timeFormat,
    });
  } catch (error) {
    console.error("GET /api/v1/settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { unitSystem, tempUnit, timeFormat } = body;

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (unitSystem) updateData.unitSystem = unitSystem;
    if (tempUnit) updateData.tempUnit = tempUnit;
    if (timeFormat) updateData.timeFormat = timeFormat;

    await db.update(users).set(updateData).where(eq(users.id, userId));

    const updatedUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    return NextResponse.json({
      unitSystem: updatedUser?.unitSystem,
      tempUnit: updatedUser?.tempUnit,
      timeFormat: updatedUser?.timeFormat,
    });
  } catch (error) {
    console.error("PUT /api/v1/settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

