-- DropForeignKey
ALTER TABLE "public"."DriverPrediction" DROP CONSTRAINT "DriverPrediction_seasonPredictionId_fkey";

-- AddForeignKey
ALTER TABLE "DriverPrediction" ADD CONSTRAINT "DriverPrediction_seasonPredictionId_fkey" FOREIGN KEY ("seasonPredictionId") REFERENCES "SeasonPrediction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
