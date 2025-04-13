/*
  Warnings:

  - A unique constraint covering the columns `[method,endpoint]` on the table `Permission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Role` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Permission_method_endpoint_key" ON "Permission"("method", "endpoint");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");
