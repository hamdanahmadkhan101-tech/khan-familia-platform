'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'khan_familia_active_hold';

export interface HoldSession {
  holdToken: string;
  expiresAt: string;
  roomName: string;
}

export function useHoldSession() {
  const [activeHold, setActiveHold] = useState<HoldSession | null>(null);

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as HoldSession;
        if (new Date(parsed.expiresAt) > new Date()) {
          setActiveHold(parsed);
        } else {
          // Expired locally, clean it up
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (err) {
      console.error('Failed to parse hold session', err);
    }
  }, []);

  // Set up auto-expiration polling
  useEffect(() => {
    if (!activeHold) return;

    const interval = setInterval(() => {
      if (new Date(activeHold.expiresAt) <= new Date()) {
        setActiveHold(null);
        localStorage.removeItem(STORAGE_KEY);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeHold]);

  const saveHold = useCallback((holdToken: string, expiresAt: string, roomName: string) => {
    const session: HoldSession = { holdToken, expiresAt, roomName };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setActiveHold(session);
    // Dispatch a custom event so other tabs/components can sync immediately
    window.dispatchEvent(new Event('holdSessionUpdated'));
  }, []);

  const clearHold = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setActiveHold(null);
    window.dispatchEvent(new Event('holdSessionUpdated'));
  }, []);

  // Sync across tabs/components
  useEffect(() => {
    const handleStorage = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as HoldSession;
          if (new Date(parsed.expiresAt) > new Date()) {
            setActiveHold(parsed);
          } else {
            setActiveHold(null);
          }
        } else {
          setActiveHold(null);
        }
      } catch (err) {
        console.error(err);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('holdSessionUpdated', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('holdSessionUpdated', handleStorage);
    };
  }, []);

  return {
    activeHold,
    saveHold,
    clearHold,
  };
}
