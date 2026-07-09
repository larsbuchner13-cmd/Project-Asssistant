"use client";

import { useTranslations } from "next-intl";
import type { Sprint } from "@prisma/client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter, usePathname } from "@/i18n/navigation";

export function SprintSelector({ sprints, selectedId }: { sprints: Sprint[]; selectedId: string }) {
  const t = useTranslations("sprintPlanning");
  const router = useRouter();
  const pathname = usePathname();

  if (sprints.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noSprints")}</p>;
  }

  return (
    <Select value={selectedId} onValueChange={(v) => router.push(`${pathname}?sprintId=${v}`)}>
      <SelectTrigger className="w-64">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {sprints.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
