-- CreateTable
CREATE TABLE "Creator" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "tags" TEXT[],
    "audience_age" INTEGER[],
    "audience_location" TEXT[],
    "avg_views" INTEGER NOT NULL,
    "ctr" DOUBLE PRECISION NOT NULL,
    "cvr" DOUBLE PRECISION NOT NULL,
    "price_min" INTEGER NOT NULL,
    "price_max" INTEGER NOT NULL,
    "reliability_score" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Creator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" UUID NOT NULL,
    "brand" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "tags_required" TEXT[],
    "audience_target" TEXT[],
    "budget_cents" INTEGER NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PastDeal" (
    "id" UUID NOT NULL,
    "creator_id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "delivered_on_time" BOOLEAN NOT NULL,
    "performance_score" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PastDeal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PastDeal_creator_id_idx" ON "PastDeal"("creator_id");

-- CreateIndex
CREATE INDEX "PastDeal_campaign_id_idx" ON "PastDeal"("campaign_id");

-- AddForeignKey
ALTER TABLE "PastDeal" ADD CONSTRAINT "PastDeal_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PastDeal" ADD CONSTRAINT "PastDeal_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
