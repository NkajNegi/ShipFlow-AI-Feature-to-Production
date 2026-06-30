import { NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ready: true });
  } catch (error) {
    return NextResponse.json(
      { ready: false, error: String(error) },
      { status: 503 },
    );
  }
}
