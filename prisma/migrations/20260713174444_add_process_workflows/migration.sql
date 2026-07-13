-- CreateEnum
CREATE TYPE "ProcessRunStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProcessStepStatus" AS ENUM ('LOCKED', 'READY', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "process_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "process_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "process_step_templates" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "responsibleRole" TEXT,
    "assigneeId" TEXT,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "approverId" TEXT,
    "targetDays" DOUBLE PRECISION,

    CONSTRAINT "process_step_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "process_checklist_template_items" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "process_checklist_template_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "process_runs" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ProcessRunStatus" NOT NULL DEFAULT 'ACTIVE',
    "projectId" TEXT,
    "startedById" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "process_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "process_run_steps" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "stepTemplateId" TEXT,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "responsibleRole" TEXT,
    "assigneeId" TEXT,
    "status" "ProcessStepStatus" NOT NULL DEFAULT 'LOCKED',
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "approverId" TEXT,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
    "approvalComment" TEXT,
    "approvedAt" TIMESTAMP(3),
    "targetDays" DOUBLE PRECISION,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "process_run_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "process_run_checklist_items" (
    "id" TEXT NOT NULL,
    "runStepId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "doneAt" TIMESTAMP(3),

    CONSTRAINT "process_run_checklist_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "process_templates" ADD CONSTRAINT "process_templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_step_templates" ADD CONSTRAINT "process_step_templates_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "process_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_step_templates" ADD CONSTRAINT "process_step_templates_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_step_templates" ADD CONSTRAINT "process_step_templates_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_checklist_template_items" ADD CONSTRAINT "process_checklist_template_items_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "process_step_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_runs" ADD CONSTRAINT "process_runs_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "process_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_runs" ADD CONSTRAINT "process_runs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_runs" ADD CONSTRAINT "process_runs_startedById_fkey" FOREIGN KEY ("startedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_run_steps" ADD CONSTRAINT "process_run_steps_runId_fkey" FOREIGN KEY ("runId") REFERENCES "process_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_run_steps" ADD CONSTRAINT "process_run_steps_stepTemplateId_fkey" FOREIGN KEY ("stepTemplateId") REFERENCES "process_step_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_run_steps" ADD CONSTRAINT "process_run_steps_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_run_steps" ADD CONSTRAINT "process_run_steps_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_run_checklist_items" ADD CONSTRAINT "process_run_checklist_items_runStepId_fkey" FOREIGN KEY ("runStepId") REFERENCES "process_run_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
