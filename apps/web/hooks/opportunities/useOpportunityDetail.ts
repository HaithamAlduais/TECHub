/**
 * useOpportunityDetail Hook
 * Handles fetching a single opportunity detail
 */

'use client';

import { useState, useCallback } from 'react';
import type { OpportunityDetail } from '@/types/opportunities';
import {
  fetchOpportunityDetail,
  OpportunitiesAPIError,
} from '@/lib/api/opportunities';

export function useOpportunityDetail() {
  const [data, setData] = useState<OpportunityDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchOpportunityDetail(id);
      setData(result);
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof OpportunitiesAPIError
          ? err.message
          : 'Failed to fetch opportunity details';
      setError(errorMessage);
      console.error('Error fetching opportunity detail:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    data,
    isLoading,
    error,
    fetch,
    reset,
  };
}
