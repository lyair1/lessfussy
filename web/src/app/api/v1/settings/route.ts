import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return new NextResponse("Gone", { status: 410 });
}

export async function PUT(request: NextRequest) {
  return new NextResponse("Gone", { status: 410 });
}
