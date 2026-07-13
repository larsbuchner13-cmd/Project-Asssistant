"use client";

import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";

export function ProcessSubnav() {
  const t = useTranslations("processes.tabs");
  const pathname = usePathname();

  const tabs = [
    { key: "templates", href: "/processes" },
    { key: "runs", href: "/processes/runs" },
    { key: "dashboard", href: "/processes/dashboard" },
  ] as const;

  return (
    <nav className="flex gap-1 border-b border-border">
      {tabs.map((tab) => {
        const active = tab.href === "/processes" ? pathname === "/processes" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(tab.key)}
          </Link>
        );
      })}
    </nav>
  );
}
