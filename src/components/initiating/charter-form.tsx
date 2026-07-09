"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations, useLocale } from "next-intl";
import { Printer } from "lucide-react";
import type { z } from "zod";
import type { ProjectCharter } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { charterFormSchema, type CharterFormValues } from "@/lib/validations/charter";
import { upsertCharter } from "@/app/[locale]/actions/charter";
import { formatCurrency } from "@/lib/pm";

export function CharterForm({
  projectId,
  projectName,
  initialData,
}: {
  projectId: string;
  projectName: string;
  initialData: ProjectCharter | null;
}) {
  const t = useTranslations();
  const locale = useLocale();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<z.input<typeof charterFormSchema>, unknown, CharterFormValues>({
    resolver: zodResolver(charterFormSchema),
    defaultValues: {
      businessCase: initialData?.businessCase ?? "",
      objectives: initialData?.objectives ?? "",
      successCriteria: initialData?.successCriteria ?? "",
      highLevelScope: initialData?.highLevelScope ?? "",
      budgetEstimate: initialData?.budgetEstimate ?? 0,
      sponsor: initialData?.sponsor ?? "",
    },
  });

  const values = watch();

  async function onSubmit(data: CharterFormValues) {
    await upsertCharter(projectId, data);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="no-print">
        <CardHeader>
          <CardTitle>{t("charter.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Field
              id="businessCase"
              label={t("charter.businessCase")}
              help={t("charter.businessCaseHelp")}
              error={errors.businessCase && t(errors.businessCase.message as never)}
            >
              <Textarea id="businessCase" rows={3} {...register("businessCase")} />
            </Field>
            <Field
              id="objectives"
              label={t("charter.objectives")}
              help={t("charter.objectivesHelp")}
              error={errors.objectives && t(errors.objectives.message as never)}
            >
              <Textarea id="objectives" rows={3} {...register("objectives")} />
            </Field>
            <Field
              id="successCriteria"
              label={t("charter.successCriteria")}
              help={t("charter.successCriteriaHelp")}
              error={errors.successCriteria && t(errors.successCriteria.message as never)}
            >
              <Textarea id="successCriteria" rows={2} {...register("successCriteria")} />
            </Field>
            <Field
              id="highLevelScope"
              label={t("charter.highLevelScope")}
              error={errors.highLevelScope && t(errors.highLevelScope.message as never)}
            >
              <Textarea id="highLevelScope" rows={2} {...register("highLevelScope")} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field
                id="budgetEstimate"
                label={t("charter.budgetEstimate")}
                error={errors.budgetEstimate && t(errors.budgetEstimate.message as never)}
              >
                <Input id="budgetEstimate" type="number" step="1000" {...register("budgetEstimate")} />
              </Field>
              <Field
                id="sponsor"
                label={t("charter.sponsor")}
                error={errors.sponsor && t(errors.sponsor.message as never)}
              >
                <Input id="sponsor" {...register("sponsor")} />
              </Field>
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {t("charter.generate")}
              </Button>
              {isSubmitSuccessful && (
                <span className="text-sm text-muted-foreground">{t("common.saved")}</span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card id="charter-doc">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>{t("charter.documentTitle")}</CardTitle>
          <Button
            variant="outline"
            size="sm"
            type="button"
            className="no-print"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            {t("charter.print")}
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <div>
            <h3 className="mb-1 font-semibold">{projectName}</h3>
            <p className="text-xs text-muted-foreground">{t("charter.sponsor")}: {values.sponsor || "—"}</p>
          </div>
          <DocSection title={t("charter.businessCase")} text={values.businessCase} />
          <DocSection title={t("charter.objectives")} text={values.objectives} />
          <DocSection title={t("charter.successCriteria")} text={values.successCriteria} />
          <DocSection title={t("charter.highLevelScope")} text={values.highLevelScope} />
          <DocSection
            title={t("charter.budgetEstimate")}
            text={formatCurrency(Number(values.budgetEstimate) || 0, locale)}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  id,
  label,
  help,
  error,
  children,
}: {
  id: string;
  label: string;
  help?: string;
  error?: string | false | React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function DocSection({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>
      <p className="whitespace-pre-wrap">{text || "—"}</p>
    </div>
  );
}
