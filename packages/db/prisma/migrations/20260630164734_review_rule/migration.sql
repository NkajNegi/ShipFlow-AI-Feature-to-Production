-- CreateTable
CREATE TABLE "review_rule" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "hit_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_rule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "review_rule_workspace_id_idx" ON "review_rule"("workspace_id");

-- AddForeignKey
ALTER TABLE "review_rule" ADD CONSTRAINT "review_rule_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
