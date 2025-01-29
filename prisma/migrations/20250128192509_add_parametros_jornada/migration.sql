-- CreateTable
CREATE TABLE "entradas" (
    "id" SERIAL NOT NULL,
    "id_empleado" INTEGER NOT NULL,
    "hora_entrada" TIMESTAMP(3) NOT NULL,
    "fecha_entrada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entradas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salidas" (
    "id" SERIAL NOT NULL,
    "id_empleado" INTEGER NOT NULL,
    "hora_salida" TIMESTAMP(3) NOT NULL,
    "fecha_salida" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salidas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParametrosJornada" (
    "id" SERIAL NOT NULL,
    "hora_entrada_esperada" TEXT NOT NULL DEFAULT '08:00:00',
    "hora_salida_esperada" TEXT NOT NULL DEFAULT '17:00:00',
    "tolerancia_minutos" INTEGER NOT NULL DEFAULT 10,
    "horas_laborales" DOUBLE PRECISION NOT NULL DEFAULT 8,
    "tiempo_minimo_almuerzo" INTEGER NOT NULL DEFAULT 30,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParametrosJornada_pkey" PRIMARY KEY ("id")
);
