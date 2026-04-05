/**
 * Opportunities API Types
 * Based on Backend Handoff Specification
 */

// ============================================================================
// FILTER & REQUEST TYPES
// ============================================================================

export interface OpportunitiesFilters {
  location?: string;
  category?: 'Jobs' | 'Coop' | 'GDP';
  employment_type?: 'Full-Time' | 'Part-Time';
  work_type?: 'Remote' | 'Hybrid' | 'In-Person';
  preferences?: string; // comma-separated
  user_skills?: string; // comma-separated
  sort_by?: 'match' | 'salary' | 'relevance';
}

export interface GatePreferences {
  location: string;
  employment_type: string[];
  work_type: string[];
}

// ============================================================================
// FEED RESPONSE TYPES
// ============================================================================

export interface Opportunity {
  id: string;
  company_name: string;
  job_title: string;
  salary: string | null;
  compliance_percentage: number;
  category: 'Jobs' | 'Coop' | 'GDP';
  work_type: 'Remote' | 'Hybrid' | 'In-Person';
  employment_type: 'Full-Time' | 'Part-Time';
  location: string;
  posted_at: string;
  application_deadline: string;
  is_open: boolean;
}

export interface OpportunitiesFeedResponse {
  opportunities: Opportunity[];
  total_count: number;
}

// ============================================================================
// DETAIL RESPONSE TYPES
// ============================================================================

export interface OpportunityDetail extends Opportunity {
  company_description: string;
  job_description: string;
  requirements: string[]; // formatted bullets
  working_time: string;
  why_this_percent: string;
  matched_skills: string[];
  missing_skills: string[];
  learning_suggestions: string;
  apply_url: string;
  application_email?: string;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface UIState {
  isGateModalOpen: boolean;
  isDetailModalOpen: boolean;
  selectedOpportunityId: string | null;
  isLoadingFeed: boolean;
  isLoadingDetail: boolean;
  feedError: string | null;
  detailError: string | null;
}

export interface OpportunitiesStoreState {
  // Filters
  filters: OpportunitiesFilters;
  preferences: GatePreferences | null;

  // Data
  opportunities: Opportunity[];
  totalCount: number;
  selectedDetail: OpportunityDetail | null;

  // UI State
  ui: UIState;
}
