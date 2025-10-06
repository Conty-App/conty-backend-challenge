-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "pix_key" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_external_id_key" ON "Payment"("external_id");
