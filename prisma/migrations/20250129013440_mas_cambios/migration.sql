/*
  Warnings:

  - You are about to drop the column `fecha_actualizacion` on the `ParametrosJornada` table. All the data in the column will be lost.
  - You are about to drop the column `horas_laborales` on the `ParametrosJornada` table. All the data in the column will be lost.
  - You are about to drop the column `tiempo_minimo_almuerzo` on the `ParametrosJornada` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ParametrosJornada" DROP COLUMN "fecha_actualizacion",
DROP COLUMN "horas_laborales",
DROP COLUMN "tiempo_minimo_almuerzo",
ALTER COLUMN "hora_entrada_esperada" DROP DEFAULT,
ALTER COLUMN "hora_salida_esperada" DROP DEFAULT,
ALTER COLUMN "tolerancia_minutos" DROP DEFAULT;

-- CreateTable
CREATE TABLE "estadisticas" (
    "id_empleado" INTEGER NOT NULL,
    "fecha" TEXT NOT NULL,
    "llegadas_tarde" INTEGER NOT NULL DEFAULT 0,
    "minutos_tarde" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "salidas_temprano" INTEGER NOT NULL DEFAULT 0,
    "minutos_temprano" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "horas_trabajadas" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "estadisticas_pkey" PRIMARY KEY ("id_empleado","fecha")
);
