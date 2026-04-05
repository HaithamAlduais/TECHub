/**
 * Opportunities Constants
 * Valid values for filters and categories
 */

// ============================================================================
// VALID FILTER VALUES
// ============================================================================

export const EMPLOYMENT_TYPES = ['Full-Time', 'Part-Time'] as const;
export const WORK_TYPES = ['Remote', 'Hybrid', 'In-Person'] as const;
export const CATEGORIES = ['Jobs', 'Coop', 'GDP'] as const;
export const SORT_OPTIONS = ['match', 'salary', 'relevance'] as const;

// ============================================================================
// LABEL MAPPINGS
// ============================================================================

export const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  'Full-Time': 'Full Time',
  'Part-Time': 'Part Time',
};

export const WORK_TYPE_LABELS: Record<string, string> = {
  Remote: 'Remote',
  Hybrid: 'Hybrid',
  'In-Person': 'In Person',
};

export const CATEGORY_LABELS: Record<string, string> = {
  Jobs: 'Jobs',
  Coop: 'Co-op',
  GDP: 'GDP',
};

// ============================================================================
// COMPLIANCE PERCENTAGE COLOR SCHEME
// ============================================================================

export function getComplianceColor(
  percentage: number
): 'text-red-500' | 'text-yellow-500' | 'text-green-500' {
  if (percentage >= 75) return 'text-green-500';
  if (percentage >= 50) return 'text-yellow-500';
  return 'text-red-500';
}

export function getComplianceBgColor(
  percentage: number
): 'bg-red-100' | 'bg-yellow-100' | 'bg-green-100' {
  if (percentage >= 75) return 'bg-green-100';
  if (percentage >= 50) return 'bg-yellow-100';
  return 'bg-red-100';
}

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ERROR_MESSAGES = {
  LOCATION_REQUIRED: 'Location is required to search for opportunities',
  INVALID_FILTERS: 'Invalid filter values provided',
  FETCH_ERROR: 'Failed to fetch opportunities',
  DETAIL_ERROR: 'Failed to fetch opportunity details',
  NETWORK_ERROR: 'Network error - please check your connection',
  NOT_FOUND: 'Opportunity not found',
};
