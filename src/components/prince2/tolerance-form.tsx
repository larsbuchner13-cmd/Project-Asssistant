"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import type { Prince2Tolerance } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toleranceFormSchema, type ToleranceFormValues } from "@/lib/validations/tolerance";
import { upsertTolerance } from "@/app/[locale]/actions/tolerances";

const FIELDS = ["time", "cost", "scope", "risk", "quality", "benefits"] as const;

export function ToleranceForm({
  projectId,
  initialData,
}: {
  projectId: string;
  initialData: Prince2Tolerance | null;
}) {
  const t = useTranslations();

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, isSubmitSuccessful },
  } = useForm<ToleranceFormValues>({
    resolver: zodResolver(toleranceFormSchema),
    defaultValues: {
      time: initialData?.time ?? "",
      cost: initialData?.cost ?? "",
      scope: initialData?.scope ?? "",
      risk: initialData?.risk ?? "",
      quality: initialData?.quality ?? "",
      benefits: initialData?.benefits ?? "",
    },
  });

  async function onSubmit(values: ToleranceFormValues) {
    await upsertTolerance(projectId, values);
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FIELDS.map((field) => (
            <div key={field} className="flex flex-col gap-1.5">
              <Label htmlFor={field}>{t(`tolerances.${field}`)}</Label>
              <Textarea id={field} rows={2} {...register(field)} />
            </div>
          ))}
          <div className="flex items-center gap-3 sm:col-span-2">
            <Button type="submit" disabled={isSubmitting}>
              {t("common.save")}
            </Button>
            {isSubmitSuccessful && <span className="text-sm text-muted-foreground">{t("common.saved")}</span>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
