import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Create a dummy user
  const user = await prisma.user.upsert({
    where: { email: "demo@shipflow.ai" },
    update: {},
    create: {
      id: "usr_demo123",
      name: "Demo User",
      email: "demo@shipflow.ai",
      emailVerified: true,
      image: "https://api.dicebear.com/9.x/avataaars/svg?seed=Felix",
    },
  });

  // 2. Create a Workspace
  const workspace = await prisma.workspace.upsert({
    where: { id: "ws_demo123" },
    update: {},
    create: {
      id: "ws_demo123",
      name: "Acme Corp",
      planTier: "PRO",
      aiReviewCredits: 100,
      members: {
        create: {
          userId: user.id,
          role: "ADMIN",
        },
      },
    },
  });

  // 3. Create a Project
  const project = await prisma.project.upsert({
    where: { id: "proj_demo123" },
    update: {},
    create: {
      id: "proj_demo123",
      name: "Core Platform",
      workspaceId: workspace.id,
    },
  });

  // 4. Create a Repository
  const repository = await prisma.repository.upsert({
    where: { id: "repo_demo123" },
    update: {},
    create: {
      id: "repo_demo123",
      name: "core-api",
      fullName: "acme-corp/core-api",
      url: "https://github.com/acme-corp/core-api",
      projectId: project.id,
    },
  });

  // 5. Seed Features across various statuses
  const statuses = [
    {
      title: "SSO Integration (SAML)",
      status: "DISCOVERY",
      context: "Enterprise customers are requesting SAML SSO support.",
    },
    {
      title: "Dark Mode UI",
      status: "GENERATING_PRD",
      context: "Users want a dark mode theme for late night work.",
    },
    {
      title: "Export to CSV",
      status: "PLANNING",
      context: "Add ability to export analytics data to CSV.",
    },
    {
      title: "Rate Limiting Middleware",
      status: "PLAN_APPROVED",
      context: "Prevent API abuse by implementing rate limiting per workspace.",
    },
    {
      title: "Webhooks for Issue Transitions",
      status: "IN_PROGRESS",
      context: "Fire webhooks when an issue changes status.",
    },
    {
      title: "Two-Factor Authentication",
      status: "IN_REVIEW",
      context: "Implement TOTP based 2FA for enhanced security.",
    },
    {
      title: "Billing Portal Self-Serve",
      status: "FIX_NEEDED",
      context: "Allow users to upgrade their plan without contacting support.",
    },
    {
      title: "Slack Integration",
      status: "APPROVED",
      context: "Post notifications to a specified Slack channel.",
    },
    {
      title: "User Avatars",
      status: "SHIPPED",
      context: "Allow users to upload custom profile pictures.",
    },
    {
      title: "Crypto Payments",
      status: "REJECTED",
      context: "Accept Bitcoin for subscriptions.",
    },
  ] as const;

  for (const s of statuses) {
    await prisma.featureRequest.create({
      data: {
        title: s.title,
        context: s.context,
        status: s.status,
        projectId: project.id,
        source: "UI",
      },
    });
  }

  // 6. Add rich PRD & Tasks to the PLANNED feature
  const plannedFeature = await prisma.featureRequest.findFirst({
    where: { title: "Rate Limiting Middleware", projectId: project.id },
  });
  if (plannedFeature) {
    const prd = await prisma.pRD.create({
      data: {
        featureRequestId: plannedFeature.id,
        contentJson: {
          problem: "API is vulnerable to abuse.",
          solution: "Implement Redis-based rate limiting middleware.",
          metrics: ["API response time", "Number of 429 errors"],
          assumptions: ["Redis is available in production."],
          technicalRequirements: [
            "Use ioredis for caching.",
            "Fallback to in-memory if Redis is down.",
          ],
          securityRequirements: ["Do not log sensitive headers."],
          testingStrategy: [
            "Unit tests for token bucket algorithm.",
            "Load testing.",
          ],
          rollbackPlan: "Disable middleware via environment variable.",
        },
      },
    });

    await prisma.task.createMany({
      data: [
        {
          title: "Setup Redis connection",
          description: "Initialize ioredis client.",
          status: "TODO",
          prdId: prd.id,
          projectId: project.id,
        },
        {
          title: "Implement Token Bucket",
          description: "Write the rate limiting logic.",
          status: "TODO",
          prdId: prd.id,
          projectId: project.id,
        },
        {
          title: "Add Express Middleware",
          description: "Hook it up to the API routes.",
          status: "TODO",
          prdId: prd.id,
          projectId: project.id,
        },
      ],
    });
  }

  // 7. Add PR & Review to the IN_REVIEW feature
  const inReviewFeature = await prisma.featureRequest.findFirst({
    where: { title: "Two-Factor Authentication", projectId: project.id },
  });
  if (inReviewFeature) {
    const prd = await prisma.pRD.create({
      data: {
        featureRequestId: inReviewFeature.id,
        contentJson: { problem: "Need 2FA.", solution: "Use speakeasy." },
      },
    });

    await prisma.task.create({
      data: {
        title: "Implement TOTP",
        description: "Add speakeasy logic.",
        status: "REVIEW",
        prdId: prd.id,
        projectId: project.id,
      },
    });

    const pullRequest = await prisma.pullRequest.create({
      data: {
        number: 42,
        title: "feat: Two-Factor Authentication",
        url: "https://github.com/acme-corp/core-api/pull/42",
        headSha: "abcdef123456",
        state: "OPEN",
        featureRequestId: inReviewFeature.id,
        repositoryId: repository.id,
      },
    });

    await prisma.review.create({
      data: {
        pullRequestId: pullRequest.id,
        status: "CHANGES_REQUESTED",
        summary:
          "The implementation looks mostly good, but there is a severe security vulnerability with how the recovery codes are hashed.",
        blockingCount: 1,
        iteration: 1,
        issuesJson: [
          {
            severity: "BLOCKING",
            category: "Security",
            title: "Recovery codes are stored in plaintext",
            detail:
              "The recovery codes are generated and stored in the database without any hashing.",
            file: "apps/api/src/auth/2fa.ts",
            suggestion:
              "Use bcrypt to hash the recovery codes before storing them.",
            resolutionStatus: "UNRESOLVED",
          },
          {
            severity: "NON_BLOCKING",
            category: "CodeQuality",
            title: "Missing return type on verifyTotp",
            detail: "The verifyTotp function relies on implicit any/inference.",
            file: "apps/api/src/auth/totp.ts",
            suggestion: "Add `boolean` return type.",
            resolutionStatus: "UNRESOLVED",
          },
        ],
        dimensionsJson: [
          { name: "PRD", pass: true },
          { name: "Security", pass: false },
          { name: "Performance", pass: true },
          { name: "ErrorHandling", pass: true },
          { name: "TypeSafety", pass: false },
          { name: "Tests", pass: true },
          { name: "EdgeCases", pass: true },
          { name: "Compatibility", pass: true },
          { name: "CodeQuality", pass: false },
        ],
      },
    });
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
