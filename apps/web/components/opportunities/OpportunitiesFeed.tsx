/**
 * OpportunitiesFeed Component
 *
 * Displays the list of opportunities with:
 * - Job cards in a responsive grid
 * - Loading state with skeleton
 * - Empty state when no results
 * - Error handling
 * - Infinite scroll or pagination (future)
 */

'use client';

import { useState } from 'react';
import { JobCard } from './JobCard';
import { RetroAlert } from '@/components/retro';
import type { Opportunity } from '@/types/opportunities';

interface OpportunitiesFeedProps {
  opportunities: Opportunity[];
  isLoading: boolean;
  error: string | null;
  onSelectOpportunity: (id: string) => void;
  totalCount?: number;
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="h-80 bg-gray-200 border-2 border-black animate-pulse"
        />
      ))}
    </div>
  );
}

export function OpportunitiesFeed({
  opportunities,
  isLoading,
  error,
  onSelectOpportunity,
  totalCount,
}: OpportunitiesFeedProps) {
  const isEmpty = !isLoading && opportunities.length === 0 && !error;

  return (
    <div className="space-y-6">
      {/* Header with count */}
      {!isLoading && !isEmpty && (
        <div className="flex items-center justify-between px-4 pt-4">
          <h2 className="font-mono font-bold text-xl text-black">
            الفرص المتاحة
          </h2>
          <p className="font-mono text-sm text-gray-600">
            {opportunities.length} {totalCount && `من ${totalCount}`}
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="px-4">
          <RetroAlert
            variant="error"
            title="خطأ في التحميل"
            description={error}
          />
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="px-4">
          <LoadingSkeleton />
        </div>
      )}

      {/* Empty State */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <p className="font-mono text-3xl mb-4">🔍</p>
          <h3 className="font-mono font-bold text-lg text-black mb-2">
            لم يتم العثور على فرص
          </h3>
          <p className="font-mono text-sm text-gray-600 text-center max-w-sm">
            لا توجد فرص وظيفية تطابق معايير البحث الخاصة بك.
            جرب تعديل الفلاتر أو انتظر فرص جديدة.
          </p>
        </div>
      )}

      {/* Opportunities Grid */}
      {!isLoading && !isEmpty && (
        <div className="grid gap-4 px-4 md:grid-cols-2 lg:grid-cols-3">
          {opportunities.map((opportunity) => (
            <JobCard
              key={opportunity.id}
              opportunity={opportunity}
              onViewDetails={onSelectOpportunity}
            />
          ))}
        </div>
      )}

      {/* Footer Info */}
      {!isLoading && !isEmpty && (
        <div className="px-4 py-6 text-center border-t-2 border-black">
          <p className="font-mono text-xs text-gray-600">
            عدد النتائج: {opportunities.length}
            {totalCount ? ` من ${totalCount} إجمالي الفرص` : ''}
          </p>
        </div>
      )}
    </div>
  );
}
