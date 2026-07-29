'use client';

import { useEffect } from 'react';
import { useHoldSession } from '@/hooks/useHoldSession';

export function ClearHoldSession() {
  const { clearHold } = useHoldSession();

  useEffect(() => {
    clearHold();
  }, [clearHold]);

  return null;
}
