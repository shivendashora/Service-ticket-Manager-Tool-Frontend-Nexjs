'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FullPageSpinner } from './ui';

interface RequireAuthProps {
  children: ReactNode;
  adminOnly?: boolean;
}

// Client-side guard: the auth cookie is httpOnly, so only the backend (via /auth/me) knows who
// is signed in. Shows a spinner until that answer arrives, then redirects if needed.
const RequireAuth = ({ children, adminOnly = false }: RequireAuthProps) => {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const allowed = !!user && (!adminOnly || isAdmin);

  useEffect(() => {
    if (loading || allowed) return;
    if (!user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else router.replace('/');
  }, [loading, allowed, user, router, pathname]);

  if (!allowed) return <FullPageSpinner />;

  return <>{children}</>;
};

export default RequireAuth;
