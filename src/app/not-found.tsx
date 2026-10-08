'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FullPageSpinner } from '@/components/ui';

// Unknown URLs go back to the dashboard (or the login page, via the auth guard)
export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return <FullPageSpinner />;
}
