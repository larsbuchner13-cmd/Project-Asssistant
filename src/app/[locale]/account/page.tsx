import { getTranslations } from "next-intl/server";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangePasswordForm } from "@/components/auth/change-password-form";

export default async function AccountPage() {
  const t = await getTranslations();

  return (
    <main className="mx-auto flex max-w-sm flex-col justify-center px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle>{t("auth.changePassword")}</CardTitle>
          <CardDescription>{t("auth.changePasswordSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </main>
  );
}
