import { cookies } from "next/headers";
import { prisma } from "@repo/db";
import { randomBytes } from "crypto";
import { makeSignature } from "better-auth/crypto";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  if (process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN !== "true") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const user = await prisma.user.findUnique({
    where: { email: "demo@shipflow.ai" },
  });

  if (!user) {
    return new NextResponse(
      "Demo user not found. Did you run the seed script?",
      { status: 400 },
    );
  }

  // Create a secure 32-byte session token
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  // Directly insert into the better-auth session table using Prisma
  await prisma.session.create({
    data: {
      id: token,
      token,
      expiresAt,
      userId: user.id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent") || "Demo Browser",
    },
  });

  // better-auth signs the session cookie: the value is `${token}.${signature}`.
  // Setting the raw token (unsigned) makes session validation fail, so we sign
  // it with the same secret better-auth uses to verify.
  const secret = process.env.BETTER_AUTH_SECRET ?? "";
  const signature = await makeSignature(token, secret);
  const signedValue = `${token}.${signature}`;

  const cookieStore = await cookies();
  cookieStore.set("better-auth.session_token", signedValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return NextResponse.redirect(new URL("/dashboard", req.url));
}
