-- CreateEnum
CREATE TYPE "TipoEventoCalendario" AS ENUM (
  'CITA',
  'REUNION',
  'VENCIMIENTO',
  'TAREA_PROGRAMADA',
  'RECORDATORIO',
  'OTRO'
);

-- CreateEnum
CREATE TYPE "EstadoEventoCalendario" AS ENUM (
  'PROGRAMADO',
  'COMPLETADO',
  'CANCELADO'
);

-- CreateTable
CREATE TABLE "EventoCalendario" (
  "id" TEXT NOT NULL,
  "titulo" TEXT NOT NULL,
  "descripcion" TEXT,
  "tipo" "TipoEventoCalendario" NOT NULL DEFAULT 'OTRO',
  "fechaInicio" TIMESTAMP(3) NOT NULL,
  "fechaFin" TIMESTAMP(3) NOT NULL,
  "todoElDia" BOOLEAN NOT NULL DEFAULT false,
  "ubicacion" TEXT,
  "estado" "EstadoEventoCalendario" NOT NULL DEFAULT 'PROGRAMADO',
  "empresaId" TEXT NOT NULL,
  "oficinaId" TEXT,
  "clienteId" TEXT,
  "creadoPorUsuarioId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EventoCalendario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventoCalendario_empresaId_idx"
ON "EventoCalendario"("empresaId");

-- CreateIndex
CREATE INDEX "EventoCalendario_oficinaId_idx"
ON "EventoCalendario"("oficinaId");

-- CreateIndex
CREATE INDEX "EventoCalendario_clienteId_idx"
ON "EventoCalendario"("clienteId");

-- CreateIndex
CREATE INDEX "EventoCalendario_creadoPorUsuarioId_idx"
ON "EventoCalendario"("creadoPorUsuarioId");

-- CreateIndex
CREATE INDEX "EventoCalendario_fechaInicio_idx"
ON "EventoCalendario"("fechaInicio");

-- CreateIndex
CREATE INDEX "EventoCalendario_estado_idx"
ON "EventoCalendario"("estado");

-- AddForeignKey
ALTER TABLE "EventoCalendario"
ADD CONSTRAINT "EventoCalendario_empresaId_fkey"
FOREIGN KEY ("empresaId")
REFERENCES "Empresa"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoCalendario"
ADD CONSTRAINT "EventoCalendario_oficinaId_fkey"
FOREIGN KEY ("oficinaId")
REFERENCES "Oficina"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoCalendario"
ADD CONSTRAINT "EventoCalendario_clienteId_fkey"
FOREIGN KEY ("clienteId")
REFERENCES "Cliente"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoCalendario"
ADD CONSTRAINT "EventoCalendario_creadoPorUsuarioId_fkey"
FOREIGN KEY ("creadoPorUsuarioId")
REFERENCES "Usuario"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
