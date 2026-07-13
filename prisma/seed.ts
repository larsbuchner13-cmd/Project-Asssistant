import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function seedUsers() {
  const password = await bcrypt.hash("changeme123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@pmcopilot.local" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@pmcopilot.local",
      password,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  const member = await prisma.user.upsert({
    where: { email: "member@pmcopilot.local" },
    update: {},
    create: {
      name: "Team Mitglied",
      email: "member@pmcopilot.local",
      password,
      role: "USER",
      status: "ACTIVE",
    },
  });

  return { admin, member };
}

async function seedPmbokProject(ownerId: string) {
  const project = await prisma.project.create({
    data: {
      ownerId,
      name: "Website Relaunch",
      description: "Redesign and rebuild the public marketing website on a new stack.",
      framework: "PMBOK",
      status: "ACTIVE",
      ragStatus: "AMBER",
      startDate: daysFromNow(-30),
      endDate: daysFromNow(60),
      sponsor: "Petra Klein, CMO",
      charter: {
        create: {
          businessCase:
            "Die bestehende Website ist technisch veraltet, mobil kaum nutzbar und verursacht hohe Wartungskosten. Ein Relaunch verbessert Konversion und senkt Betriebskosten.",
          objectives:
            "Neue, responsive Website auf modernem Stack; Ladezeit < 2s; Redesign des gesamten Contents.",
          successCriteria:
            "Conversion-Rate +15%, Lighthouse-Score > 90, Go-Live ohne kritische Incidents.",
          highLevelScope:
            "Neues Frontend, Content-Migration, SEO-Redirects, Anbindung an bestehendes CMS-Backend.",
          budgetEstimate: 180000,
          sponsor: "Petra Klein, CMO",
        },
      },
      stakeholders: {
        create: [
          { name: "Petra Klein", role: "Sponsor / CMO", influence: "HIGH", interest: "HIGH", engagementStrategy: "MANAGE_CLOSELY" },
          { name: "Jonas Weber", role: "Head of Engineering", influence: "HIGH", interest: "MEDIUM", engagementStrategy: "KEEP_SATISFIED" },
          { name: "Sara Nowak", role: "SEO Specialist", influence: "LOW", interest: "HIGH", engagementStrategy: "KEEP_INFORMED" },
          { name: "IT Betrieb", role: "Hosting / Ops", influence: "LOW", interest: "LOW", engagementStrategy: "MONITOR" },
        ],
      },
      milestones: {
        create: [
          { name: "Design Sign-off", dueDate: daysFromNow(10), achieved: false },
          { name: "Go-Live", dueDate: daysFromNow(60), achieved: false },
        ],
      },
      risks: {
        create: [
          {
            description: "Content-Migration dauert länger als geplant wegen unstrukturierter Altdaten.",
            probability: 4,
            impact: 3,
            status: "OPEN",
            mitigationPlan: "Frühzeitiges Content-Audit, dediziertes Migrations-Tooling.",
            contingencyPlan: "Zusätzlicher Freelancer für Content-Aufbereitung.",
            owner: "Sara Nowak",
          },
          {
            description: "SEO-Rankings brechen nach Relaunch kurzfristig ein.",
            probability: 3,
            impact: 4,
            status: "OPEN",
            mitigationPlan: "301-Redirects vollständig testen, Search-Console vor Go-Live prüfen.",
            contingencyPlan: "SEO-Sprint direkt nach Go-Live einplanen.",
            owner: "Sara Nowak",
          },
          {
            description: "Neues CMS-Backend liefert API-Änderungen verspätet.",
            probability: 2,
            impact: 5,
            status: "OPEN",
            mitigationPlan: "Wöchentlicher Sync mit Backend-Team, API-Contract früh einfrieren.",
            contingencyPlan: "Mock-API für Frontend-Entwicklung nutzen.",
            owner: "Jonas Weber",
          },
        ],
      },
    },
  });

  const design = await prisma.workPackage.create({
    data: {
      projectId: project.id,
      name: "Design",
      level: 1,
      order: 0,
      owner: "Sara Nowak",
      status: "IN_PROGRESS",
      startDate: daysFromNow(-30),
      endDate: daysFromNow(10),
      plannedCost: 25000,
      actualCost: 18000,
    },
  });
  const wireframes = await prisma.workPackage.create({
    data: {
      projectId: project.id,
      parentId: design.id,
      name: "Wireframes",
      level: 2,
      order: 0,
      owner: "Sara Nowak",
      effortEstimate: 10,
      status: "DONE",
      startDate: daysFromNow(-30),
      endDate: daysFromNow(-18),
      plannedCost: 8000,
      actualCost: 8200,
    },
  });
  const visualDesign = await prisma.workPackage.create({
    data: {
      projectId: project.id,
      parentId: design.id,
      name: "Visual Design",
      level: 2,
      order: 1,
      owner: "Sara Nowak",
      effortEstimate: 15,
      status: "IN_PROGRESS",
      startDate: daysFromNow(-17),
      endDate: daysFromNow(10),
      plannedCost: 17000,
      actualCost: 9800,
    },
  });

  const development = await prisma.workPackage.create({
    data: {
      projectId: project.id,
      name: "Development",
      level: 1,
      order: 1,
      owner: "Jonas Weber",
      status: "NOT_STARTED",
      startDate: daysFromNow(11),
      endDate: daysFromNow(45),
      plannedCost: 110000,
      actualCost: 0,
    },
  });
  const frontend = await prisma.workPackage.create({
    data: {
      projectId: project.id,
      parentId: development.id,
      name: "Frontend Build",
      level: 2,
      order: 0,
      owner: "Jonas Weber",
      effortEstimate: 25,
      status: "NOT_STARTED",
      startDate: daysFromNow(11),
      endDate: daysFromNow(35),
      plannedCost: 45000,
    },
  });
  const backend = await prisma.workPackage.create({
    data: {
      projectId: project.id,
      parentId: development.id,
      name: "CMS Integration",
      level: 2,
      order: 1,
      owner: "Jonas Weber",
      effortEstimate: 20,
      status: "NOT_STARTED",
      startDate: daysFromNow(11),
      endDate: daysFromNow(38),
      plannedCost: 40000,
    },
  });
  const qa = await prisma.workPackage.create({
    data: {
      projectId: project.id,
      parentId: development.id,
      name: "QA & Content Migration",
      level: 2,
      order: 2,
      owner: "Sara Nowak",
      effortEstimate: 15,
      status: "NOT_STARTED",
      startDate: daysFromNow(36),
      endDate: daysFromNow(45),
      plannedCost: 25000,
    },
  });

  const launch = await prisma.workPackage.create({
    data: {
      projectId: project.id,
      name: "Launch",
      level: 1,
      order: 2,
      owner: "Jonas Weber",
      status: "NOT_STARTED",
      startDate: daysFromNow(46),
      endDate: daysFromNow(60),
      plannedCost: 15000,
    },
  });
  const deployment = await prisma.workPackage.create({
    data: {
      projectId: project.id,
      parentId: launch.id,
      name: "Deployment & Cutover",
      level: 2,
      order: 0,
      owner: "IT Betrieb",
      effortEstimate: 8,
      status: "NOT_STARTED",
      startDate: daysFromNow(55),
      endDate: daysFromNow(60),
      plannedCost: 15000,
    },
  });

  await prisma.workPackageDependency.createMany({
    data: [
      { predecessorId: wireframes.id, successorId: visualDesign.id },
      { predecessorId: visualDesign.id, successorId: frontend.id },
      { predecessorId: visualDesign.id, successorId: backend.id },
      { predecessorId: frontend.id, successorId: qa.id },
      { predecessorId: backend.id, successorId: qa.id },
      { predecessorId: qa.id, successorId: deployment.id },
    ],
  });

  return project;
}

async function seedPrince2Project(ownerId: string) {
  const project = await prisma.project.create({
    data: {
      ownerId,
      name: "ERP Migration",
      description: "Migration from on-premise ERP to a cloud-based platform.",
      framework: "PRINCE2",
      status: "ACTIVE",
      ragStatus: "GREEN",
      startDate: daysFromNow(-60),
      endDate: daysFromNow(120),
      sponsor: "Michael Braun, CFO",
      charter: {
        create: {
          businessCase:
            "Das bestehende On-Premise-ERP erreicht End-of-Life und verursacht steigende Lizenzkosten.",
          objectives: "Migration aller Kernprozesse auf eine Cloud-ERP-Lösung ohne Geschäftsunterbrechung.",
          successCriteria: "Keine Datenverluste, Prozesslaufzeiten stabil, Kostensenkung um 20% p.a.",
          highLevelScope: "Finanzen, Einkauf, Lager – Vertrieb folgt in Phase 2.",
          budgetEstimate: 650000,
          sponsor: "Michael Braun, CFO",
        },
      },
      businessCase: {
        create: {
          reasons: "End-of-Life der aktuellen ERP-Version, steigende Wartungskosten, fehlende Cloud-Fähigkeit.",
          options: "1) Weiterbetrieb mit Sonderwartung, 2) On-Premise-Upgrade, 3) Cloud-Migration (empfohlen).",
          expectedBenefits: "20% geringere Betriebskosten, höhere Skalierbarkeit, moderne Reporting-Funktionen.",
          expectedDisBenefits: "Temporäre Produktivitätseinbußen während der Umstellung.",
          costsSummary: "Lizenzen, Migrationsdienstleister, interne Schulungen: ca. 650.000 EUR.",
          majorRisks: "Datenmigration, Integrationsschnittstellen zu Altsystemen.",
        },
      },
      tolerance: {
        create: {
          time: "± 2 Wochen je Stage",
          cost: "± 5% des Stage-Budgets",
          scope: "Keine Erweiterung ohne Change Request",
          risk: "Kein Einzelrisiko über Score 15 ohne Board-Eskalation",
          quality: "Alle Kernprozesse müssen UAT bestehen",
          benefits: "Kostensenkung muss innerhalb von 6 Monaten nach Go-Live nachweisbar sein",
        },
      },
      stakeholders: {
        create: [
          { name: "Michael Braun", role: "Executive / Sponsor", influence: "HIGH", interest: "HIGH", engagementStrategy: "MANAGE_CLOSELY" },
          { name: "Lena Fischer", role: "Senior User (Finance)", influence: "MEDIUM", interest: "HIGH", engagementStrategy: "KEEP_INFORMED" },
          { name: "Cloud Partner GmbH", role: "Senior Supplier", influence: "HIGH", interest: "MEDIUM", engagementStrategy: "KEEP_SATISFIED" },
        ],
      },
      milestones: {
        create: [
          { name: "Stage Boundary: Design Complete", dueDate: daysFromNow(20), achieved: false },
          { name: "Go-Live Cutover", dueDate: daysFromNow(110), achieved: false },
        ],
      },
      risks: {
        create: [
          {
            description: "Datenmigration führt zu Inkonsistenzen in Stammdaten.",
            probability: 3,
            impact: 5,
            status: "OPEN",
            mitigationPlan: "Mehrere Testmigrationen mit Validierungsskripten.",
            contingencyPlan: "Rollback-Plan auf Altsystem für 30 Tage vorhalten.",
            owner: "Lena Fischer",
          },
        ],
      },
    },
  });

  const stage1 = await prisma.workPackage.create({
    data: {
      projectId: project.id,
      name: "Stage 1: Design & Setup",
      level: 1,
      order: 0,
      owner: "Lena Fischer",
      status: "IN_PROGRESS",
      startDate: daysFromNow(-60),
      endDate: daysFromNow(20),
      plannedCost: 200000,
      actualCost: 140000,
    },
  });
  await prisma.workPackage.create({
    data: {
      projectId: project.id,
      parentId: stage1.id,
      name: "Cloud Tenant Setup",
      level: 2,
      order: 0,
      owner: "Cloud Partner GmbH",
      effortEstimate: 12,
      status: "DONE",
      plannedCost: 50000,
      actualCost: 48000,
    },
  });

  return project;
}

async function seedScrumProject(ownerId: string) {
  const project = await prisma.project.create({
    data: {
      ownerId,
      name: "Mobile App MVP",
      description: "Build and launch the first MVP of the companion mobile app.",
      framework: "SCRUM",
      status: "ACTIVE",
      ragStatus: "RED",
      startDate: daysFromNow(-14),
      endDate: daysFromNow(70),
      sponsor: "Anna Hoffmann, Head of Product",
      charter: {
        create: {
          businessCase: "Kunden fordern eine mobile App, um Kernfunktionen unterwegs zu nutzen.",
          objectives: "MVP mit Login, Dashboard und Push-Benachrichtigungen innerhalb von 12 Wochen.",
          successCriteria: "App Store Approval, 4.0+ Rating in ersten 4 Wochen, < 1% Crash-Rate.",
          highLevelScope: "iOS & Android via React Native, Anbindung an bestehende API.",
          budgetEstimate: 220000,
          sponsor: "Anna Hoffmann, Head of Product",
        },
      },
      stakeholders: {
        create: [
          { name: "Anna Hoffmann", role: "Product Owner", influence: "HIGH", interest: "HIGH", engagementStrategy: "MANAGE_CLOSELY" },
          { name: "Scrum Team Mobile", role: "Development Team", influence: "MEDIUM", interest: "HIGH", engagementStrategy: "KEEP_INFORMED" },
          { name: "App Store Review", role: "External / Compliance", influence: "HIGH", interest: "LOW", engagementStrategy: "KEEP_SATISFIED" },
        ],
      },
      milestones: {
        create: [{ name: "Sprint 3 Review: App Store Submission", dueDate: daysFromNow(35), achieved: false }],
      },
      risks: {
        create: [
          {
            description: "App-Store-Freigabe verzögert sich durch Compliance-Anforderungen.",
            probability: 4,
            impact: 4,
            status: "OPEN",
            mitigationPlan: "Frühzeitiges Pre-Review anhand der Store-Guidelines.",
            contingencyPlan: "Puffer-Sprint vor geplantem Launch einplanen.",
            owner: "Anna Hoffmann",
          },
        ],
      },
      sprints: {
        create: [
          {
            name: "Sprint 1",
            goal: "Login & Onboarding",
            startDate: daysFromNow(-14),
            endDate: daysFromNow(0),
          },
        ],
      },
    },
    include: { sprints: true },
  });

  await prisma.backlogItem.createMany({
    data: [
      { projectId: project.id, sprintId: project.sprints[0].id, title: "User Login", storyPoints: 5, status: "DONE", priority: "HIGH", order: 0, completedAt: daysFromNow(-9) },
      { projectId: project.id, sprintId: project.sprints[0].id, title: "Onboarding Flow", storyPoints: 8, status: "IN_PROGRESS", priority: "HIGH", order: 1 },
      { projectId: project.id, title: "Push Notifications", storyPoints: 5, status: "BACKLOG", priority: "MEDIUM", order: 2 },
      { projectId: project.id, title: "Dashboard Widgets", storyPoints: 13, status: "BACKLOG", priority: "MEDIUM", order: 3 },
    ],
  });

  return project;
}

type StepTemplateWithChecklist = {
  id: string;
  order: number;
  name: string;
  description: string | null;
  responsibleRole: string | null;
  assigneeId: string | null;
  requiresApproval: boolean;
  approverId: string | null;
  targetDays: number | null;
  checklistItems: { label: string; order: number }[];
};

function stepSnapshot(
  step: StepTemplateWithChecklist,
  status: "LOCKED" | "READY" | "IN_PROGRESS" | "DONE",
  opts: {
    startedAt?: Date;
    completedAt?: Date;
    approvalStatus?: "NOT_REQUIRED" | "PENDING" | "APPROVED" | "REJECTED";
    approvedAt?: Date;
    allChecked?: boolean;
  } = {}
) {
  const allChecked = opts.allChecked ?? status === "DONE";
  return {
    stepTemplateId: step.id,
    order: step.order,
    name: step.name,
    description: step.description,
    responsibleRole: step.responsibleRole,
    assigneeId: step.assigneeId,
    requiresApproval: step.requiresApproval,
    approverId: step.approverId,
    targetDays: step.targetDays,
    status,
    approvalStatus:
      opts.approvalStatus ?? (step.requiresApproval && status === "DONE" ? "APPROVED" : "NOT_REQUIRED"),
    approvedAt: opts.approvedAt,
    startedAt: opts.startedAt,
    completedAt: opts.completedAt,
    checklistItems: {
      create: step.checklistItems.map((item) => ({
        label: item.label,
        order: item.order,
        done: allChecked,
        doneAt: allChecked ? opts.completedAt ?? opts.startedAt : null,
      })),
    },
  };
}

async function seedProcesses(admin: { id: string }, member: { id: string }) {
  const customerTemplate = await prisma.processTemplate.create({
    data: {
      name: "Kundenanfrage bearbeiten",
      description:
        "Vom Erstkontakt bis zum abgeschlossenen Auftrag – jede Anfrage durchläuft dieselben geprüften Schritte.",
      category: "Vertrieb",
      createdById: admin.id,
      steps: {
        create: [
          {
            order: 0,
            name: "Anfrage erfassen",
            description: "Erstkontakt dokumentieren und Bedarf klären.",
            responsibleRole: "Vertrieb",
            assigneeId: member.id,
            targetDays: 1,
            checklistItems: {
              create: [
                { order: 0, label: "Kontaktdaten erfasst" },
                { order: 1, label: "Bedarf dokumentiert" },
              ],
            },
          },
          {
            order: 1,
            name: "Angebot erstellen",
            description: "Angebot kalkulieren und zur Freigabe einreichen.",
            responsibleRole: "Vertrieb",
            assigneeId: member.id,
            requiresApproval: true,
            approverId: admin.id,
            targetDays: 2,
            checklistItems: {
              create: [
                { order: 0, label: "Preise geprüft" },
                { order: 1, label: "Angebot verschickt" },
              ],
            },
          },
          {
            order: 2,
            name: "Auftrag abschließen",
            description: "Vertrag unterschreiben lassen und Projekt anlegen.",
            responsibleRole: "Geschäftsführung",
            assigneeId: admin.id,
            targetDays: 1,
            checklistItems: {
              create: [
                { order: 0, label: "Vertrag unterschrieben" },
                { order: 1, label: "Projekt angelegt" },
              ],
            },
          },
        ],
      },
    },
    include: { steps: { orderBy: { order: "asc" }, include: { checklistItems: true } } },
  });

  const onboardingTemplate = await prisma.processTemplate.create({
    data: {
      name: "Mitarbeiter-Onboarding",
      description: "Damit neue Kolleg:innen ab Tag 1 produktiv arbeiten können und nichts vergessen wird.",
      category: "HR",
      createdById: admin.id,
      steps: {
        create: [
          {
            order: 0,
            name: "Vorbereitung vor Start",
            responsibleRole: "Office Management",
            assigneeId: admin.id,
            targetDays: 1,
            checklistItems: {
              create: [
                { order: 0, label: "Arbeitsplatz eingerichtet" },
                { order: 1, label: "Zugänge angelegt" },
                { order: 2, label: "Willkommensmail verschickt" },
              ],
            },
          },
          {
            order: 1,
            name: "Erster Arbeitstag",
            responsibleRole: "Team Lead",
            assigneeId: admin.id,
            targetDays: 1,
            checklistItems: {
              create: [
                { order: 0, label: "Einführungsgespräch geführt" },
                { order: 1, label: "Team vorgestellt" },
              ],
            },
          },
          {
            order: 2,
            name: "30-Tage-Review",
            responsibleRole: "Geschäftsführung",
            assigneeId: admin.id,
            requiresApproval: true,
            approverId: admin.id,
            targetDays: 30,
            checklistItems: {
              create: [
                { order: 0, label: "Feedbackgespräch geführt" },
                { order: 1, label: "Probezeitbeurteilung dokumentiert" },
              ],
            },
          },
        ],
      },
    },
    include: { steps: { orderBy: { order: "asc" }, include: { checklistItems: true } } },
  });

  const [cs1, cs2, cs3] = customerTemplate.steps;

  // Completed run — feeds the KPI dashboard's cycle-time history.
  await prisma.processRun.create({
    data: {
      templateId: customerTemplate.id,
      name: "Kundenanfrage – Musterfirma GmbH",
      status: "COMPLETED",
      startedById: member.id,
      startedAt: daysFromNow(-12),
      completedAt: daysFromNow(-8),
      steps: {
        create: [
          stepSnapshot(cs1, "DONE", { startedAt: daysFromNow(-12), completedAt: daysFromNow(-11) }),
          stepSnapshot(cs2, "DONE", {
            startedAt: daysFromNow(-11),
            completedAt: daysFromNow(-9),
            approvalStatus: "APPROVED",
            approvedAt: daysFromNow(-9),
          }),
          stepSnapshot(cs3, "DONE", { startedAt: daysFromNow(-9), completedAt: daysFromNow(-8) }),
        ],
      },
    },
  });

  // Active run sitting on a pending approval — shows up on the KPI dashboard
  // and demonstrates that step 3 stays locked until it's resolved.
  await prisma.processRun.create({
    data: {
      templateId: customerTemplate.id,
      name: "Kundenanfrage – Nordwind AG",
      status: "ACTIVE",
      startedById: member.id,
      startedAt: daysFromNow(-3),
      steps: {
        create: [
          stepSnapshot(cs1, "DONE", { startedAt: daysFromNow(-3), completedAt: daysFromNow(-2) }),
          stepSnapshot(cs2, "IN_PROGRESS", {
            startedAt: daysFromNow(-2),
            approvalStatus: "PENDING",
            allChecked: true,
          }),
          stepSnapshot(cs3, "LOCKED"),
        ],
      },
    },
  });

  const [os1, os2, os3] = onboardingTemplate.steps;

  // Active run with a step past its target duration — surfaces in "Überfällige Schritte".
  await prisma.processRun.create({
    data: {
      templateId: onboardingTemplate.id,
      name: "Onboarding – Max Mustermann",
      status: "ACTIVE",
      startedById: admin.id,
      startedAt: daysFromNow(-5),
      steps: {
        create: [
          stepSnapshot(os1, "IN_PROGRESS", { startedAt: daysFromNow(-5) }),
          stepSnapshot(os2, "LOCKED"),
          stepSnapshot(os3, "LOCKED"),
        ],
      },
    },
  });
}

async function main() {
  console.log("Seeding database...");
  const { admin, member } = await seedUsers();
  await seedPmbokProject(admin.id);
  await seedPrince2Project(admin.id);
  await seedScrumProject(member.id);
  await seedProcesses(admin, member);
  console.log("Seed complete.");
  console.log("Login as admin@pmcopilot.local / member@pmcopilot.local, password: changeme123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
