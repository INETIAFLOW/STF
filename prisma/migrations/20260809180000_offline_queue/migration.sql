-- AlterTable
ALTER TABLE "attendance_records" ADD COLUMN     "conflictNote" TEXT;

-- AlterTable
ALTER TABLE "leave_requests" ADD COLUMN     "clientCapturedAt" TIMESTAMP(3),
ADD COLUMN     "clientRequestId" UUID;

-- AlterTable
ALTER TABLE "task_proofs" ADD COLUMN     "clientCapturedAt" TIMESTAMP(3),
ADD COLUMN     "clientRequestId" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "leave_requests_tenantId_clientRequestId_key" ON "leave_requests"("tenantId", "clientRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "task_proofs_tenantId_clientRequestId_key" ON "task_proofs"("tenantId", "clientRequestId");
