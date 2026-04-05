/**
 * FilterBar Component
 *
 * Sticky filter bar at the top of the opportunities feed
 * showing:
 * - Category filter buttons (Jobs, Coop, GDP)
 * - Optional filters for work type and employment type
 * - Clear filters button
 */

'use client';

import { useState } from 'react';
import { RetroButton, RetroSelect } from '@/components/retro';
import type { OpportunitiesFilters } from '@/types/opportunities';
import {
  CATEGORIES,
  EMPLOYMENT_TYPES,
  WORK_TYPES,
  CATEGORY_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  WORK_TYPE_LABELS,
} from '@/lib/opportunities-constants';

interface FilterBarProps {
  filters: OpportunitiesFilters;
  onFiltersChange: (filters: OpportunitiesFilters) => void;
}

export function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Handle category toggle
  const toggleCategory = (category: typeof CATEGORIES[number]) => {
    onFiltersChange({
      ...filters,
      category: filters.category === category ? undefined : category,
    });
  };

  // Handle employment type change
  const handleEmploymentTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      employment_type:
        value === '' ? undefined : (value as 'Full-Time' | 'Part-Time'),
    });
  };

  // Handle work type change
  const handleWorkTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      work_type: value === '' ? undefined : (value as 'Remote' | 'Hybrid' | 'In-Person'),
    });
  };

  // Clear all filters
  const handleClearFilters = () => {
    onFiltersChange({});
  };

  const hasFilters =
    filters.category ||
    filters.employment_type ||
    filters.work_type;

  return (
    <div className="sticky top-0 z-40 space-y-4 bg-white border-b-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      {/* Main Filters */}
      <div className="space-y-3">
        {/* Category Buttons */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <RetroButton
              key={category}
              variant={
                filters.category === category ? 'primary' : 'secondary'
              }
              size="sm"
              onClick={() => toggleCategory(category)}
            >
              {CATEGORY_LABELS[category]}
            </RetroButton>
          ))}
        </div>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="font-mono text-sm underline text-blue-600 hover:text-blue-800"
        >
          {showAdvanced ? '▼ إخفاء فلاتر إضافية' : '► عرض فلاتر إضافية'}
        </button>
      </div>

      {/* Advanced Filters (expandable) */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t-2 border-black">
          {/* Employment Type Filter */}
          <RetroSelect
            label="نوع العمل"
            options={[
              { value: '', label: 'الكل' },
              ...EMPLOYMENT_TYPES.map((type) => ({
                value: type,
                label: EMPLOYMENT_TYPE_LABELS[type],
              })),
            ]}
            value={filters.employment_type || ''}
            onChange={(e) => handleEmploymentTypeChange(e.target.value)}
          />

          {/* Work Type Filter */}
          <RetroSelect
            label="طريقة العمل"
            options={[
              { value: '', label: 'الكل' },
              ...WORK_TYPES.map((type) => ({
                value: type,
                label: WORK_TYPE_LABELS[type],
              })),
            ]}
            value={filters.work_type || ''}
            onChange={(e) => handleWorkTypeChange(e.target.value)}
          />
        </div>
      )}

      {/* Clear Filters Button */}
      {hasFilters && (
        <div className="pt-2 border-t border-gray-300">
          <RetroButton
            variant="outline"
            size="sm"
            onClick={handleClearFilters}
            className="text-xs"
          >
            ✕ مسح جميع الفلاتر
          </RetroButton>
        </div>
      )}
    </div>
  );
}
