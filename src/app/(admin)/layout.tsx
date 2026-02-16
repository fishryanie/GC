import { AdminLayoutShell } from 'layout';
import { requireAuthSession } from 'lib/auth';
import { getDatabaseHealth } from 'lib/database-health';
import type { ReactNode } from 'react';

export default async function AdminLayoutContainer({ children }: { children: ReactNode }) {
  const [dbHealth, session] = await Promise.all([getDatabaseHealth(), requireAuthSession()]);

  return (
    <AdminLayoutShell dbError={!dbHealth.ok ? dbHealth.message : undefined} currentSeller={session.seller}>
      {children}
    </AdminLayoutShell>
  );
}
