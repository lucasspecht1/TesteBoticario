'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { MS_PER_SECOND } from '@/lib/units';
import { REFRESH_INTERVAL_SECONDS } from '@/lib/refresh';

/** Recarrega os dados do servidor a cada `REFRESH_INTERVAL_SECONDS`, só com a aba visível. */
export function AutoRefresh(): React.JSX.Element | null {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh();
    }, REFRESH_INTERVAL_SECONDS * MS_PER_SECOND);
    return () => clearInterval(timer);
  }, [router]);
  return null;
}
