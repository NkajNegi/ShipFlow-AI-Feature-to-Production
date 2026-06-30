import { NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ healthy: true, database: "ok" });
  } catch (error) {
    return NextResponse.json(
      { healthy: false, database: "error", error: String(error) },
      { status: 503 },
    );
  }
}
