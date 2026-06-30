-- CreateEnum
CREATE TYPE "CheckoutType" AS ENUM ('SUBSCRIPTION', 'CREDITS');

-- CreateEnum
CREATE TYPE "CheckoutStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "checkout_order" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "razorpay_id" TEXT NOT NULL,
    "type" "CheckoutType" NOT NULL,
    "status" "CheckoutStatus" NOT NULL DEFAULT 'PENDING',
    "amount_inr" INTEGER NOT NULL,
    "credits" INTEGER,
    "plan_tier" "PlanTier",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checkout_order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "checkout_order_razorpay_id_key" ON "checkout_order"("razorpay_id");

-- CreateIndex
CREATE INDEX "checkout_order_workspace_id_idx" ON "checkout_order"("workspace_id");

-- AddForeignKey
ALTER TABLE "checkout_order" ADD CONSTRAINT "checkout_order_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
