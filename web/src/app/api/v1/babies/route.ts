import { NextRequest } from "next/server";

export async function GET() {
  return new Response("Gone", { status: 410 });
}

export async function POST(request: NextRequest) {
  return new Response("Gone", { status: 410 });
}
