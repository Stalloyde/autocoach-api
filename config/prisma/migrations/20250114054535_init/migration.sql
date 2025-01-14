/*
  Warnings:

  - A unique constraint covering the columns `[workoutName,userId]` on the table `Workout` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Workout" DROP CONSTRAINT "Workout_userId_fkey";

-- DropIndex
DROP INDEX "Workout_workoutName_key";

-- CreateIndex
CREATE UNIQUE INDEX "Workout_workoutName_userId_key" ON "Workout"("workoutName", "userId");

-- AddForeignKey
ALTER TABLE "Workout" ADD CONSTRAINT "Workout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
