-- CreateTable
CREATE TABLE "empleado_jornada" (
    "id" SERIAL NOT NULL,
    "id_empleado" INTEGER NOT NULL,
    "parametrosJornadaId" INTEGER NOT NULL,
    "fecha_asignacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "empleado_jornada_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "empleado_jornada_id_empleado_activo_key" ON "empleado_jornada"("id_empleado", "activo");

-- AddForeignKey
ALTER TABLE "empleado_jornada" ADD CONSTRAINT "empleado_jornada_parametrosJornadaId_fkey" FOREIGN KEY ("parametrosJornadaId") REFERENCES "ParametrosJornada"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
