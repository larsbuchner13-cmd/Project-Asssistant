import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserTable } from "@/components/admin/user-table";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.status !== "ACTIVE" || session.user.role !== "ADMIN") {
    notFound();
  }

  const t = await getTranslations();

  const users = await prisma.user.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      _count: { select: { projects: true } },
    },
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{t("admin.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.subtitle")}</p>
      </div>
      <UserTable users={users} currentUserId={session.user.id} />
    </main>
  );
}
