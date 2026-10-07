"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { analyzeProjectHealth } from "@/app/[locale]/actions/project-health";
import type { ProjectHealth } from "@/lib/project-health";
import type { HealthAnalysis } from "@/lib/project-health-ai";

export function ProjectHealthView({ projectId, initialHealth, aiEnabled }: { projectId: string; initialHealth: ProjectHealth; aiEnabled: boolean }) {
  const t = useTranslations("projectHealth");
  const locale = useLocale();
  const [health, setHealth] = useState(initialHealth);
  const [analysis, setAnalysis] = useState<HealthAnalysis | null>(null);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();
  const color = health.status === "healthy" ? "text-emerald-600" : health.status === "attention" ? "text-amber-600" : health.status === "critical" ? "text-red-600" : "text-muted-foreground";

  function analyze() {
    setError(false);
    setAnalysis(null);
    startTransition(async () => {
      try {
        const result = await analyzeProjectHealth(projectId, locale);
        if (result.status === "success") {
          setHealth(result.health);
          setAnalysis(result.analysis);
        } else setError(true);
      } catch { setError(true); }
    });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header><h1 className="flex items-center gap-2 text-2xl font-semibold"><Activity aria-hidden="true" />{t("title")}</h1><p className="mt-2 text-muted-foreground">{t("intro")}</p></header>
      <section className="rounded-xl border bg-card p-6" aria-label={t("title")}>
        <div className="flex flex-wrap items-center gap-6">
          <div className={`text-6xl font-bold tabular-nums ${color}`}>{health.score === null ? "—" : `${health.score}%`}</div>
          <div><p className={`text-lg font-semibold ${color}`}>{t(health.status)}</p><p className="text-sm text-muted-foreground">{t("coverage", { value: health.coverage })}</p></div>
        </div>
        <p className="mt-4 text-sm">{health.coverage < 100 ? t("limited") : t("recordedOnly")}</p>
        <p className="mt-2 text-xs text-muted-foreground">{t("thresholds")}</p>
        <p className="mt-2 text-xs text-muted-foreground">{t("asOf", { date: new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(health.assessedAt)) })}</p>
      </section>
      <div className="grid gap-4 sm:grid-cols-2">
        {health.dimensions.map(d => <section key={d.key} className="rounded-xl border bg-card p-5">
          <div className="flex justify-between gap-3"><h2 className="font-semibold">{t(d.key)}</h2><span className="font-bold">{d.score === null ? t("missing") : `${d.score}%`}</span></div>
          {d.score !== null && <progress className="my-3 h-2 w-full accent-current" max={100} value={d.score} aria-label={t(d.key)} />}
          <p className="mt-2 text-sm text-muted-foreground">{t(`${d.key}Evidence`, health.evidence)}</p>
          <p className="mt-2 text-xs text-muted-foreground">{t("weight", { value: d.weight })}</p>
        </section>)}
      </div>
      <section className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold">{t("aiTitle")}</h2>
        <p className="my-3 text-sm text-muted-foreground">{aiEnabled ? t("aiDisclosure") : t("setup")}</p>
        <Button disabled={!aiEnabled || health.score === null || pending} onClick={analyze}>{pending ? t("loading") : t("analyze")}</Button>
        <div aria-live="polite" aria-busy={pending}>
          {error && <p role="alert" className="mt-3 text-sm text-red-600">{t("error")}</p>}
          {analysis && <div className="mt-5 space-y-4"><p>{analysis.summary}</p><h3 className="font-semibold">{t("nextSteps")}</h3><ol className="list-decimal space-y-2 pl-5">{analysis.recommendations.map((item, i) => <li key={i}>{item}</li>)}</ol></div>}
        </div>
      </section>
      <details className="rounded-xl border p-5"><summary className="cursor-pointer font-medium">{t("methodTitle")}</summary><p className="mt-3 text-sm text-muted-foreground">{t("method")}</p></details>
    </div>
  );
}
