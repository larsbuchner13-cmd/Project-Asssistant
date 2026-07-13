import { useTranslations } from "next-intl";
import { ListChecks } from "lucide-react";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export type TemplateCardData = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  isActive: boolean;
  createdBy: { name: string };
  steps: { id: string }[];
  _count: { runs: number };
};

export function TemplateCard({ template }: { template: TemplateCardData }) {
  const t = useTranslations();

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle>{template.name}</CardTitle>
          <Badge variant={template.isActive ? "green" : "outline"}>
            {template.isActive ? t("processes.active") : t("processes.inactive")}
          </Badge>
        </div>
        {template.category && (
          <div className="pt-1">
            <Badge variant="secondary">{template.category}</Badge>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2 text-sm">
        {template.description && <p className="line-clamp-2 text-muted-foreground">{template.description}</p>}
        <div className="mt-2 flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{t("processes.steps")}:</span>
          <span className="font-medium">{template.steps.length}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {t("processes.createdBy")}: {template.createdBy.name} · {template._count.runs} {t("processes.kpi.runsCount")}
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full" variant="outline">
          <Link href={`/processes/${template.id}`}>{t("common.edit")}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
