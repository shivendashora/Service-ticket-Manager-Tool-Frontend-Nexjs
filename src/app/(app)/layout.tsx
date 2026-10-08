import type { ReactNode } from 'react';
import AppShell from '@/components/AppShell';
import RequireAuth from '@/components/RequireAuth';

// (app) is a route group: it adds no URL segment, it just wraps every signed-in
// page in the auth guard and the sidebar layout
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  );
}
