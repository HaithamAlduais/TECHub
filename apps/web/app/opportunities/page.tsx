/**
 * Opportunities Page
 *
 * Full opportunities/jobs feed page with:
 * 1. Gate Modal (location + preferences) - shown on first visit
 * 2. Filter Bar (category, employment type, work type)
 * 3. Opportunities Feed (grid of job cards)
 * 4. Detail Modal (6-block job details view)
 *
 * Flow:
 * User → Gate Modal → Filter Bar + Feed → Click Card → Detail Modal → Apply
 */

'use client';

import { useState } from 'react';
import {
  GateModal,
  FilterBar,
  OpportunitiesFeed,
  DetailModal,
} from '@/components/opportunities';
import {
  useOpportunities,
  useOpportunityDetail,
  useOpportunitiesFilters,
} from '@/hooks/opportunities';
import type { GatePreferences, OpportunitiesFilters } from '@/types/opportunities';

export default function OpportunitiesPage() {
  // Gate modal state
  const [isGateOpen, setIsGateOpen] = useState(true);
  const [hasSubmittedGate, setHasSubmittedGate] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Filters state
  const {
    gatePreferences,
    filters,
    setGate,
    updateFilters,
  } = useOpportunitiesFilters();

  // Opportunities feed - only fetch after gate is closed
  const {
    opportunities,
    totalCount,
    isLoading: isFeedLoading,
    error: feedError,
    updateFilters: updateOpportunitiesFilters,
  } = useOpportunities({
    initialFilters: filters,
    autoFetch: hasSubmittedGate, // Fetch after gate submission
  });

  // Opportunity detail
  const {
    data: selectedOpportunity,
    isLoading: isDetailLoading,
    error: detailError,
    fetch: fetchOpportunityDetail,
    reset: resetDetail,
  } = useOpportunityDetail();

  // Handle gate submission
  const handleGateSubmit = (preferences: GatePreferences) => {
    // Set preferences in filters
    setGate(preferences);
    setHasSubmittedGate(true);

    // Build initial filters with gate preferences
    const initialFilters: OpportunitiesFilters = {
      location: preferences.location,
    };

    // if user selected specific preferences, add them
    if (preferences.employment_type && preferences.employment_type.length > 0) {
      // Store preferences as comma-separated string
      const prefs = [...preferences.employment_type, ...preferences.work_type];
      initialFilters.preferences = prefs.join(',');
    }

    // Update opportunities with initial filters
    updateOpportunitiesFilters(initialFilters);

    // Close gate modal
    setIsGateOpen(false);

    console.log('✅ Gate submitted with preferences:', preferences);
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters: OpportunitiesFilters) => {
    updateFilters(newFilters);
    updateOpportunitiesFilters(newFilters);
    console.log('📋 Filters updated:', newFilters);
  };

  // Handle opportunity selection
  const handleSelectOpportunity = (id: string) => {
    console.log('👁️  Viewing opportunity detail:', id);
    fetchOpportunityDetail(id).then(() => {
      setIsDetailModalOpen(true);
    });
  };

  // Handle detail modal close
  const handleCloseDetail = () => {
    console.log('❌ Closed detail modal');
    setIsDetailModalOpen(false);
    resetDetail();
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Gate Modal (shown first) */}
      <GateModal
        isOpen={isGateOpen}
        onSubmit={handleGateSubmit}
      />

      {/* Content (shown after gate) */}
      {!isGateOpen && (
        <div className="space-y-0">
          {/* Filter Bar */}
          <FilterBar
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />

          {/* Opportunities Feed */}
          <OpportunitiesFeed
            opportunities={opportunities}
            isLoading={isFeedLoading}
            error={feedError}
            onSelectOpportunity={handleSelectOpportunity}
            totalCount={totalCount}
          />
        </div>
      )}

      {/* Detail Modal */}
      <DetailModal
        isOpen={isDetailModalOpen}
        opportunity={selectedOpportunity}
        isLoading={isDetailLoading}
        error={detailError}
        onClose={handleCloseDetail}
      />
    </main>
  );
}
