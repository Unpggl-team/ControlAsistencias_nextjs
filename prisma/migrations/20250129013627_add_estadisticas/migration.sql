/*
  Warnings:

  - The primary key for the `estadisticas` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[id_empleado,fecha]` on the table `estadisticas` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `estadisticas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "estadisticas" DROP CONSTRAINT "estadisticas_pkey",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id" SERIAL NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "estadisticas_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "estadisticas_id_empleado_fecha_key" ON "estadisticas"("id_empleado", "fecha");
