-- CreateEnum
CREATE TYPE "EstadoDocumento" AS ENUM ('PENDIENTE', 'RECIBIDO', 'EN_REVISION', 'CORRECTO', 'FALTA_INFORMACION');

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "estado" "EstadoDocumento" NOT NULL DEFAULT 'PENDIENTE',
    "rutaArchivo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clienteId" TEXT NOT NULL,
    "subidoPorUsuarioId" TEXT NOT NULL,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Documento_clienteId_idx" ON "Documento"("clienteId");

-- CreateIndex
CREATE INDEX "Documento_subidoPorUsuarioId_idx" ON "Documento"("subidoPorUsuarioId");

-- CreateIndex
CREATE INDEX "Documento_estado_idx" ON "Documento"("estado");

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_subidoPorUsuarioId_fkey" FOREIGN KEY ("subidoPorUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
