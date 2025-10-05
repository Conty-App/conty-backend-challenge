-- CreateTable
CREATE TABLE "Creator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "audienceCountry" TEXT NOT NULL,
    "audienceAgeMin" INTEGER NOT NULL,
    "audienceAgeMax" INTEGER NOT NULL,
    "avgViews" INTEGER NOT NULL,
    "ctr" REAL NOT NULL,
    "cvr" REAL NOT NULL,
    "priceMinCents" INTEGER NOT NULL,
    "priceMaxCents" INTEGER NOT NULL,
    "reliabilityScore" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brand" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "tagsRequired" TEXT NOT NULL,
    "audienceTargetCountry" TEXT NOT NULL,
    "audienceTargetAgeMin" INTEGER NOT NULL,
    "audienceTargetAgeMax" INTEGER NOT NULL,
    "budgetCents" INTEGER NOT NULL,
    "deadline" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PastDeal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creatorId" TEXT NOT NULL,
    "campaignId" TEXT,
    "deliveredOnTime" BOOLEAN NOT NULL,
    "performanceScore" REAL NOT NULL,
    "deliveredAt" DATETIME NOT NULL,
    CONSTRAINT "PastDeal_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PastDeal_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PastDeal_creatorId_idx" ON "PastDeal"("creatorId");

-- CreateIndex
CREATE INDEX "PastDeal_campaignId_idx" ON "PastDeal"("campaignId");
