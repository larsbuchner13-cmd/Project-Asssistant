import { getTranslations } from "next-intl/server";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";
import { Link } from "@/i18n/navigation";

export default async function LoginPage() {
  const t = await getTranslations();

  return (
    <main className="mx-auto flex max-w-sm flex-col justify-center px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle>{t("auth.signIn")}</CardTitle>
          <CardDescription>{t("auth.signInSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <LoginForm />
          <p className="text-center text-sm text-muted-foreground">
            {t("auth.noAccount")}{" "}
            <Link href="/register" className="text-primary underline-offset-4 hover:underline">
              {t("auth.createAccount")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
