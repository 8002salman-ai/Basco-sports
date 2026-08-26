"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

export type ConsentCategory = 'necessary' | 'analytics' | 'advertising';

export interface ConsentState {
  necessary: boolean; // always true
  analytics: boolean;
  advertising: boolean;
  hasConsented: boolean; // whether user has made a choice
  updatedAt: string | null;
}

const defaultState: ConsentState = {
  necessary: true,
  analytics: false,
  advertising: false,
  hasConsented: false,
  updatedAt: null,
};

const STORAGE_KEY = 'basco-consent-v1';

interface ConsentContextType {
  consent: ConsentState;
  setConsent: (partial: Partial<Pick<ConsentState, 'analytics' | 'advertising'>>) => void;
  acceptAll: () => void;
  rejectAll: () => void;
  resetConsent: () => void;
  openPreferences: boolean;
  setOpenPreferences: (open: boolean) => void;
}

const ConsentContext = createContext<ConsentContextType | null>(null);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsentState] = useState<ConsentState>(defaultState);
  const [openPreferences, setOpenPreferences] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ConsentState;
        // Ensure necessary is always true
        setConsentState({ ...parsed, necessary: true });
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    } catch {}
  }, [consent, hydrated]);

  const setConsent = (partial: Partial<Pick<ConsentState, 'analytics' | 'advertising'>>) => {
    setConsentState(prev => ({
      ...prev,
      ...partial,
      necessary: true,
      hasConsented: true,
      updatedAt: new Date().toISOString(),
    }));
  };

  const acceptAll = () => {
    setConsentState({
      necessary: true,
      analytics: true,
      advertising: true,
      hasConsented: true,
      updatedAt: new Date().toISOString(),
    });
  };

  const rejectAll = () => {
    setConsentState({
      necessary: true,
      analytics: false,
      advertising: false,
      hasConsented: true,
      updatedAt: new Date().toISOString(),
    });
  };

  const resetConsent = () => {
    setConsentState({ ...defaultState });
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  return (
    <ConsentContext.Provider value={{ consent, setConsent, acceptAll, rejectAll, resetConsent, openPreferences, setOpenPreferences }}>
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsent must be used within ConsentProvider');
  return ctx;
}
