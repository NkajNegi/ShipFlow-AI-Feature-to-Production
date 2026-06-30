import { NextResponse } from "next/server";
import { generateOpenApiDocument } from "trpc-to-openapi";
import { appRouter } from "@repo/api";

export async function GET() {
  const openApiDocument = generateOpenApiDocument(appRouter, {
    title: "MetroFlow API",
    description: "OpenAPI compliant REST endpoints for MetroFlow",
    version: "1.0.0",
    baseUrl: "http://localhost:3000/api/rest",
    docsUrl: "http://localhost:3000/docs",
    tags: ["Features"],
  });

  return NextResponse.json(openApiDocument);
}
