import type { ReactNode } from "react";
import { AdminShell } from "@/app/(admin)/components/admin-shell";
import { requireAuthSession } from "@/lib/auth";
import { getDatabaseHealth } from "@/lib/database-health";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const [dbHealth, session] = await Promise.all([getDatabaseHealth(), requireAuthSession()]);

  return (
    <AdminShell
      dbError={!dbHealth.ok ? dbHealth.message : undefined}
      currentSeller={session.seller}
    >
      {children}
    </AdminShell>
  );
}
