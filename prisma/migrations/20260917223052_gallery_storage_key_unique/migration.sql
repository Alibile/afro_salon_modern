/*
  Warnings:

  - A unique constraint covering the columns `[storageKey]` on the table `GalleryPhoto` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "GalleryPhoto_storageKey_key" ON "GalleryPhoto"("storageKey");
