import type { ReactNode } from 'react';
import RequireAuth from '@/components/RequireAuth';

// Pages in (admin) are only for admins; agents are sent back to the dashboard
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <RequireAuth adminOnly>{children}</RequireAuth>;
}
