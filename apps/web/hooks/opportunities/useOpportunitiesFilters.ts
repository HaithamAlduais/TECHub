/**
 * useOpportunitiesFilters Hook
 * Manages filters and gate preferences state
 */

'use client';

import { useState, useCallback } from 'react';
import type {
  OpportunitiesFilters,
  GatePreferences,
} from '@/types/opportunities';

export function useOpportunitiesFilters() {
  const [gatePreferences, setGatePreferences] = useState<GatePreferences | null>(
    null
  );
  const [filters, setFilters] = useState<OpportunitiesFilters>({});
  const [isGateOpen, setIsGateOpen] = useState(true);

  const setGate = useCallback((preferences: GatePreferences) => {
    setGatePreferences(preferences);

    // Build preferences string from gate
    const preferencesArray: string[] = [];
    if (
      preferences.employment_type &&
      preferences.employment_type.length > 0
    ) {
      preferencesArray.push(...preferences.employment_type);
    }
    if (preferences.work_type && preferences.work_type.length > 0) {
      preferencesArray.push(...preferences.work_type);
    }

    setFilters((prev) => ({
      ...prev,
      location: preferences.location,
      preferences: preferencesArray.join(','),
    }));

    setIsGateOpen(false);
  }, []);

  const updateFilter = useCallback((key: keyof OpportunitiesFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const updateFilters = useCallback(
    (newFilters: Partial<OpportunitiesFilters>) => {
      setFilters((prev) => ({
        ...prev,
        ...newFilters,
      }));
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilters({});
    setGatePreferences(null);
    setIsGateOpen(true);
  }, []);

  return {
    gatePreferences,
    filters,
    isGateOpen,
    setGate,
    updateFilter,
    updateFilters,
    resetFilters,
    closeGate: () => setIsGateOpen(false),
    openGate: () => setIsGateOpen(true),
  };
}
