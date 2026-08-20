-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "trabajadorId" TEXT;

-- CreateIndex
CREATE INDEX "Cliente_trabajadorId_idx" ON "Cliente"("trabajadorId");

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "Trabajador"("id") ON DELETE SET NULL ON UPDATE CASCADE;
