/*
  Warnings:

  - You are about to drop the column `costoUnitario` on the `VentaItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "direccion" TEXT,
ADD COLUMN     "latitud" DOUBLE PRECISION,
ADD COLUMN     "longitud" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "VentaItem" DROP COLUMN "costoUnitario";
