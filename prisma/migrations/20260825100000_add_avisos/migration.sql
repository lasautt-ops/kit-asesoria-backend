-- CreateEnum
CREATE TYPE "TipoAviso" AS ENUM ('GENERAL', 'DOCUMENTACION', 'IMPORTANTE', 'PLAZO', 'INFORMACION');

-- CreateEnum
CREATE TYPE "PrioridadAviso" AS ENUM ('NORMAL', 'ALTA', 'URGENTE');

-- CreateEnum
CREATE TYPE "EstadoAviso" AS ENUM ('BORRADOR', 'PUBLICADO', 'ARCHIVADO');

-- CreateEnum
CREATE TYPE "TipoDestinatario" AS ENUM ('TODOS', 'CLIENTES');

-- CreateTable
CREATE TABLE "Aviso" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "tipo" "TipoAviso" NOT NULL DEFAULT 'GENERAL',
    "prioridad" "PrioridadAviso" NOT NULL DEFAULT 'NORMAL',
    "estado" "EstadoAviso" NOT NULL DEFAULT 'BORRADOR',
    "tipoDestinatario" "TipoDestinatario" NOT NULL DEFAULT 'CLIENTES',
    "fechaPublicacion" TIMESTAMP(3),
    "fechaCaducidad" TIMESTAMP(3),
    "empresaId" TEXT NOT NULL,
    "creadoPorUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Aviso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvisoCliente" (
    "id" TEXT NOT NULL,
    "avisoId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "fechaLectura" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvisoCliente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Aviso_empresaId_idx" ON "Aviso"("empresaId");

-- CreateIndex
CREATE INDEX "Aviso_creadoPorUsuarioId_idx" ON "Aviso"("creadoPorUsuarioId");

-- CreateIndex
CREATE INDEX "Aviso_estado_idx" ON "Aviso"("estado");

-- CreateIndex
CREATE INDEX "Aviso_fechaPublicacion_idx" ON "Aviso"("fechaPublicacion");

-- CreateIndex
CREATE INDEX "Aviso_fechaCaducidad_idx" ON "Aviso"("fechaCaducidad");

-- CreateIndex
CREATE INDEX "AvisoCliente_avisoId_idx" ON "AvisoCliente"("avisoId");

-- CreateIndex
CREATE INDEX "AvisoCliente_clienteId_idx" ON "AvisoCliente"("clienteId");

-- CreateIndex
CREATE INDEX "AvisoCliente_clienteId_leido_idx" ON "AvisoCliente"("clienteId", "leido");

-- CreateIndex
CREATE UNIQUE INDEX "AvisoCliente_avisoId_clienteId_key" ON "AvisoCliente"("avisoId", "clienteId");

-- AddForeignKey
ALTER TABLE "Aviso" ADD CONSTRAINT "Aviso_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aviso" ADD CONSTRAINT "Aviso_creadoPorUsuarioId_fkey" FOREIGN KEY ("creadoPorUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvisoCliente" ADD CONSTRAINT "AvisoCliente_avisoId_fkey" FOREIGN KEY ("avisoId") REFERENCES "Aviso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvisoCliente" ADD CONSTRAINT "AvisoCliente_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
