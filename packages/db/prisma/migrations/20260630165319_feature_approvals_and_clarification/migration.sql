-- CreateEnum
CREATE TYPE "ApprovalType" AS ENUM ('PLAN', 'RELEASE');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('SYSTEM', 'USER', 'ASSISTANT');

-- CreateTable
CREATE TABLE "feature_approval" (
    "id" TEXT NOT NULL,
    "feature_request_id" TEXT NOT NULL,
    "type" "ApprovalType" NOT NULL,
    "approved_by_id" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clarification_message" (
    "id" TEXT NOT NULL,
    "feature_request_id" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clarification_message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feature_approval_feature_request_id_idx" ON "feature_approval"("feature_request_id");

-- CreateIndex
CREATE INDEX "clarification_message_feature_request_id_idx" ON "clarification_message"("feature_request_id");

-- AddForeignKey
ALTER TABLE "feature_approval" ADD CONSTRAINT "feature_approval_feature_request_id_fkey" FOREIGN KEY ("feature_request_id") REFERENCES "feature_request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_approval" ADD CONSTRAINT "feature_approval_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clarification_message" ADD CONSTRAINT "clarification_message_feature_request_id_fkey" FOREIGN KEY ("feature_request_id") REFERENCES "feature_request"("id") ON DELETE CASCADE ON UPDATE CASCADE;
