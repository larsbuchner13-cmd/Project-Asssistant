"use client";

import { useTranslations } from "next-intl";
import { LayoutDashboard, Lock, Trash2 } from "lucide-react";
import type { Framework } from "@prisma/client";

import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { getProjectNavGroups } from "@/lib/nav-config";
import { deleteProject } from "@/app/[locale]/actions/projects";

export function ProjectSidebar({
  projectId,
  projectName,
  framework,
}: {
  projectId: string;
  projectName: string;
  framework: Framework;
}) {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const tDashboard = useTranslations("dashboard");
  const pathname = usePathname();
  const router = useRouter();
  const projectNavGroups = getProjectNavGroups(framework);

  async function handleDelete() {
    if (!window.confirm(tDashboard("deleteProjectConfirm"))) return;
    await deleteProject(projectId);
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="no-print flex h-full w-64 shrink-0 flex-col border-r border-border bg-card/50 p-4">
      <Link
        href="/"
        className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <LayoutDashboard className="h-4 w-4" />
        {t("backToDashboard")}
      </Link>
      <div className="mb-1 flex items-start justify-between gap-2">
        <div className="truncate text-sm font-semibold" title={projectName}>
          {projectName}
        </div>
        <button
          type="button"
          onClick={handleDelete}
          title={tCommon("delete")}
          className="shrink-0 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mb-4" />
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto">
        {projectNavGroups.map((group) => (
          <div key={group.key}>
            <div className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t(group.key)}
            </div>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const href = item.href(projectId);
                const active = pathname === href;
                if (!item.available) {
                  return (
                    <span
                      key={item.key}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground/50"
                    >
                      <Lock className="h-3 w-3" />
                      {t(item.key)}
                    </span>
                  );
                }
                return (
                  <Link
                    key={item.key}
                    href={href}
                    className={cn(
                      "rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                      active && "bg-accent font-medium text-accent-foreground"
                    )}
                  >
                    {t(item.key)}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}
