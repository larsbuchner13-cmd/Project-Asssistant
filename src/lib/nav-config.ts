import type { Framework } from "@prisma/client";

export type NavItem = {
  key: string;
  href: (projectId: string) => string;
  available: boolean;
};

export type NavGroup = {
  key: string;
  items: NavItem[];
};

function link(path: string): NavItem["href"] {
  return (id: string) => `/projects/${id}/${path}`;
}

export function getProjectNavGroups(framework: Framework): NavGroup[] {
  const initiatingItems: NavItem[] = [
    { key: "charter", href: link("initiating/charter"), available: true },
    { key: "stakeholders", href: link("initiating/stakeholders"), available: true },
  ];
  if (framework === "PRINCE2") {
    initiatingItems.push({ key: "businessCase", href: link("initiating/business-case"), available: true });
  }

  let planningItems: NavItem[];
  let executingItems: NavItem[];

  if (framework === "SCRUM") {
    planningItems = [
      { key: "backlog", href: link("planning/backlog"), available: true },
      { key: "sprintPlanning", href: link("planning/sprint-planning"), available: true },
    ];
    executingItems = [
      { key: "sprintBoard", href: link("executing/sprint-board"), available: true },
      { key: "burndown", href: link("executing/burndown"), available: true },
    ];
  } else {
    planningItems = [
      { key: "wbs", href: link("planning/wbs"), available: true },
      { key: "schedule", href: link("planning/schedule"), available: true },
      { key: "risks", href: link("planning/risks"), available: true },
      { key: "budget", href: link("planning/budget"), available: true },
    ];
    if (framework === "PRINCE2") {
      planningItems.push(
        { key: "stageGates", href: link("planning/stage-gates"), available: true },
        { key: "tolerances", href: link("planning/tolerances"), available: true }
      );
    }
    executingItems = [
      { key: "taskboard", href: link("executing/taskboard"), available: true },
      { key: "decisions", href: link("executing/decisions"), available: true },
    ];
  }

  return [
    { key: "initiating", items: initiatingItems },
    { key: "planning", items: planningItems },
    { key: "executing", items: executingItems },
    {
      key: "monitoring",
      items: [
        { key: "statusReport", href: link("monitoring/status-report"), available: true },
        { key: "raid", href: link("monitoring/raid"), available: true },
        { key: "changeRequests", href: link("monitoring/change-requests"), available: true },
      ],
    },
    {
      key: "closing",
      items: [
        { key: "lessonsLearned", href: link("closing/lessons-learned"), available: true },
        { key: "closureChecklist", href: link("closing/checklist"), available: true },
      ],
    },
  ];
}
