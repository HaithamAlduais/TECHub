/**
 * useOpportunities Hook
 * Handles fetching the opportunities feed with filters
 *
 * Features:
 * - Automatic fetch on filter changes
 * - Error handling with user-friendly messages
 * - Abort controller for cleanup
 * - Refetch capability
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  OpportunitiesFeedResponse,
  OpportunitiesFilters,
} from '@/types/opportunities';
import {
  fetchOpportunities,
  OpportunitiesAPIError,
} from '@/lib/api/opportunities';

interface UseOpportunitiesOptions {
  initialFilters?: OpportunitiesFilters;
  autoFetch?: boolean;
}

export function useOpportunities({
  initialFilters = {},
  autoFetch = true,
}: UseOpportunitiesOptions = {}) {
  const [data, setData] = useState<OpportunitiesFeedResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<OpportunitiesFilters>(initialFilters);

  // Refs for cleanup and preventing memory leaks
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const fetch = useCallback(async (filtersOverride?: OpportunitiesFilters) => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Reset abort controller
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const filtersToUse = filtersOverride || filters;

      // Validate filters
      if (
        filtersToUse.category &&
        !['Jobs', 'Coop', 'GDP'].includes(filtersToUse.category)
      ) {
        throw new Error('Invalid category selected');
      }

      const result = await fetchOpportunities(filtersToUse);

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setData(result);
      }
    } catch (err) {
      // Only update state if component is still mounted and request wasn't aborted
      if (isMountedRef.current && err instanceof Error && err.name !== 'AbortError') {
        const errorMessage =
          err instanceof OpportunitiesAPIError
            ? err.message
            : err.message || 'Failed to fetch opportunities';
        setError(errorMessage);
        console.error('Error fetching opportunities:', err);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [filters]);

  // Auto-fetch on mount or when filters change
  useEffect(() => {
    if (autoFetch) {
      fetch();
    }

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [filters, fetch, autoFetch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const updateFilters = useCallback((newFilters: OpportunitiesFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  return {
    opportunities: data?.opportunities || [],
    totalCount: data?.total_count || 0,
    isLoading,
    error,
    filters,
    updateFilters,
    resetFilters,
    refetch: fetch,
  };
}
