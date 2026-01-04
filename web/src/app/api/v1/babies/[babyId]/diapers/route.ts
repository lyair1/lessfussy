import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ babyId: string }> }
) {
  return new Response("Gone", { status: 410 });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ babyId: string }> }
) {
  return new Response("Gone", { status: 410 });
}
