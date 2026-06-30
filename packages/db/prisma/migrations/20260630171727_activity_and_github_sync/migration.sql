/*
  Warnings:

  - You are about to drop the column `github_account_login` on the `workspace` table. All the data in the column will be lost.
  - You are about to drop the column `github_installation_id` on the `workspace` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "workspace_github_installation_id_key";

-- AlterTable
ALTER TABLE "workspace" DROP COLUMN "github_account_login",
DROP COLUMN "github_installation_id";

-- CreateTable
CREATE TABLE "activity_event" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "project_id" TEXT,
    "user_id" TEXT,
    "type" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "github_installation" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "installation_id" INTEGER NOT NULL,
    "account_login" TEXT NOT NULL,
    "account_avatar_url" TEXT,
    "installed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "github_installation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_run" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "status" "WorkflowStatus" NOT NULL DEFAULT 'RUNNING',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "error" TEXT,
    "metadata" JSONB,

    CONSTRAINT "sync_run_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_event_workspace_id_idx" ON "activity_event"("workspace_id");

-- CreateIndex
CREATE INDEX "activity_event_project_id_idx" ON "activity_event"("project_id");

-- CreateIndex
CREATE INDEX "activity_event_user_id_idx" ON "activity_event"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "github_installation_installation_id_key" ON "github_installation"("installation_id");

-- CreateIndex
CREATE INDEX "github_installation_workspace_id_idx" ON "github_installation"("workspace_id");

-- CreateIndex
CREATE INDEX "sync_run_workspace_id_idx" ON "sync_run"("workspace_id");

-- AddForeignKey
ALTER TABLE "activity_event" ADD CONSTRAINT "activity_event_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_event" ADD CONSTRAINT "activity_event_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "github_installation" ADD CONSTRAINT "github_installation_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_run" ADD CONSTRAINT "sync_run_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
