export type NavItem = {
  key: string;
  href: (projectId: string) => string;
  available: boolean;
};

export type NavGroup = {
  key: string;
  items: NavItem[];
};

export const projectNavGroups: NavGroup[] = [
  {
    key: "initiating",
    items: [
      { key: "charter", href: (id) => `/projects/${id}/initiating/charter`, available: true },
      { key: "stakeholders", href: (id) => `/projects/${id}/initiating/stakeholders`, available: true },
    ],
  },
  {
    key: "planning",
    items: [
      { key: "wbs", href: (id) => `/projects/${id}/planning/wbs`, available: true },
      { key: "schedule", href: (id) => `/projects/${id}/planning/schedule`, available: true },
      { key: "risks", href: (id) => `/projects/${id}/planning/risks`, available: true },
      { key: "budget", href: (id) => `/projects/${id}/planning/budget`, available: true },
    ],
  },
  {
    key: "executing",
    items: [
      { key: "taskboard", href: (id) => `/projects/${id}/executing/taskboard`, available: false },
      { key: "decisions", href: (id) => `/projects/${id}/executing/decisions`, available: false },
    ],
  },
  {
    key: "monitoring",
    items: [
      { key: "statusReport", href: (id) => `/projects/${id}/monitoring/status-report`, available: false },
      { key: "raid", href: (id) => `/projects/${id}/monitoring/raid`, available: false },
      { key: "changeRequests", href: (id) => `/projects/${id}/monitoring/change-requests`, available: false },
    ],
  },
  {
    key: "closing",
    items: [
      { key: "lessonsLearned", href: (id) => `/projects/${id}/closing/lessons-learned`, available: false },
      { key: "closureChecklist", href: (id) => `/projects/${id}/closing/checklist`, available: false },
    ],
  },
];
