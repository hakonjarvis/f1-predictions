/*
  Warnings:

  - A unique constraint covering the columns `[sessionKey,driverId]` on the table `RaceResult` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "headshotUrl" TEXT,
ADD COLUMN     "number" INTEGER;

-- AlterTable
ALTER TABLE "RaceResult" ADD COLUMN     "sessionKey" INTEGER,
ADD COLUMN     "year" INTEGER NOT NULL DEFAULT 2025;

-- CreateIndex
CREATE UNIQUE INDEX "RaceResult_sessionKey_driverId_key" ON "RaceResult"("sessionKey", "driverId");
