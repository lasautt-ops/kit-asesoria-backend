-- CreateEnum
CREATE TYPE "EstadoTarea" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "PrioridadTarea" AS ENUM ('BAJA', 'MEDIA', 'ALTA');

-- CreateTable
CREATE TABLE "Tarea" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" "EstadoTarea" NOT NULL DEFAULT 'PENDIENTE',
    "prioridad" "PrioridadTarea" NOT NULL DEFAULT 'MEDIA',
    "fechaLimite" TIMESTAMP(3),
    "empresaId" TEXT NOT NULL,
    "oficinaId" TEXT,
    "clienteId" TEXT,
    "asignadoAUsuarioId" TEXT,
    "creadoPorUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tarea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Tarea_empresaId_idx" ON "Tarea"("empresaId");

-- CreateIndex
CREATE INDEX "Tarea_oficinaId_idx" ON "Tarea"("oficinaId");

-- CreateIndex
CREATE INDEX "Tarea_clienteId_idx" ON "Tarea"("clienteId");

-- CreateIndex
CREATE INDEX "Tarea_asignadoAUsuarioId_idx" ON "Tarea"("asignadoAUsuarioId");

-- CreateIndex
CREATE INDEX "Tarea_creadoPorUsuarioId_idx" ON "Tarea"("creadoPorUsuarioId");

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_asignadoAUsuarioId_fkey" FOREIGN KEY ("asignadoAUsuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_creadoPorUsuarioId_fkey" FOREIGN KEY ("creadoPorUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
