"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import type { Role, UserStatus } from "@prisma/client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setUserRole, setUserStatus, type AdminActionResult } from "@/app/[locale]/actions/users";
import { formatDate } from "@/lib/pm";
import { useRouter } from "@/i18n/navigation";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: Date;
  _count: { projects: number };
};

const STATUS_VARIANT: Record<UserStatus, "green" | "amber" | "red"> = {
  ACTIVE: "green",
  PENDING: "amber",
  DISABLED: "red",
};

export function UserTable({ users, currentUserId }: { users: AdminUser[]; currentUserId: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function run(userId: string, action: () => Promise<AdminActionResult>) {
    setError(null);
    setPendingId(userId);
    try {
      const result = await action();
      if (!result.ok) {
        setError(t(result.error));
        return;
      }
      router.refresh();
    } catch {
      setError(t("admin.actionFailed"));
    } finally {
      setPendingId(null);
    }
  }

  if (users.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("common.noData")}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("common.name")}</TableHead>
            <TableHead>{t("auth.email")}</TableHead>
            <TableHead>{t("admin.role")}</TableHead>
            <TableHead>{t("common.status")}</TableHead>
            <TableHead>{t("admin.projects")}</TableHead>
            <TableHead>{t("admin.registeredAt")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const isSelf = user.id === currentUserId;
            const busy = pendingId === user.id;
            return (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.name}
                  {isSelf && <span className="ml-1 text-xs text-muted-foreground">({t("admin.you")})</span>}
                </TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <Select
                    value={user.role}
                    disabled={isSelf || busy}
                    onValueChange={(value) => run(user.id, () => setUserRole(user.id, value as Role))}
                  >
                    <SelectTrigger className="h-8 w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">{t("admin.roleUser")}</SelectItem>
                      <SelectItem value="ADMIN">{t("admin.roleAdmin")}</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[user.status]}>{t(`admin.userStatus.${user.status}`)}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{user._count.projects}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDate(user.createdAt, locale)}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1.5">
                    {user.status !== "ACTIVE" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isSelf || busy}
                        onClick={() => run(user.id, () => setUserStatus(user.id, "ACTIVE"))}
                      >
                        {t("admin.approve")}
                      </Button>
                    )}
                    {user.status !== "DISABLED" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isSelf || busy}
                        onClick={() => run(user.id, () => setUserStatus(user.id, "DISABLED"))}
                      >
                        {t("admin.disable")}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
