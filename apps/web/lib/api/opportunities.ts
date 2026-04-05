/**
 * Opportunities API Client
 * Handles all backend API calls for opportunities
 */

import type {
  OpportunitiesFilters,
  OpportunitiesFeedResponse,
  OpportunityDetail,
} from '@/types/opportunities';

// ============================================================================
// CONFIG
// ============================================================================

// Use environment variable or fallback to localhost
const API_BASE_URL =
  process.env.NEXT_PUBLIC_OPPORTUNITIES_API_URL ||
  'http://localhost:8001';

// ============================================================================
// HELPER: Build Query String
// ============================================================================

function buildQueryString(filters: OpportunitiesFilters): string {
  const params = new URLSearchParams();

  if (filters.location) {
    params.append('location', filters.location);
  }
  if (filters.category) {
    params.append('category', filters.category);
  }
  if (filters.employment_type) {
    params.append('employment_type', filters.employment_type);
  }
  if (filters.work_type) {
    params.append('work_type', filters.work_type);
  }
  if (filters.preferences) {
    params.append('preferences', filters.preferences);
  }
  if (filters.user_skills) {
    params.append('user_skills', filters.user_skills);
  }
  if (filters.sort_by) {
    params.append('sort_by', filters.sort_by);
  }

  return params.toString();
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export class OpportunitiesAPIError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'OpportunitiesAPIError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      errorData.message ||
      errorData.error ||
      `API Error (${response.status})`;

    throw new OpportunitiesAPIError(response.status, errorMessage);
  }

  return response.json();
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * Fetch opportunities feed with filters
 * GET /opportunities
 */
export async function fetchOpportunities(
  filters: OpportunitiesFilters = {}
): Promise<OpportunitiesFeedResponse> {
  const queryString = buildQueryString(filters);
  const url = `${API_BASE_URL}/opportunities${
    queryString ? `?${queryString}` : ''
  }`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return handleResponse<OpportunitiesFeedResponse>(response);
}

/**
 * Fetch single opportunity detail
 * GET /opportunities/{id}
 */
export async function fetchOpportunityDetail(
  id: string
): Promise<OpportunityDetail> {
  const url = `${API_BASE_URL}/opportunities/${id}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return handleResponse<OpportunityDetail>(response);
}

/**
 * Health check endpoint
 * GET /health
 */
export async function checkHealth(): Promise<{
  status: string;
  message?: string;
}> {
  const url = `${API_BASE_URL}/health`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return handleResponse<{ status: string; message?: string }>(response);
}
