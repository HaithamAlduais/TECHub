/**
 * API Testing & Debug Utilities
 *
 * Use these functions to test API integration during development
 * Remove or disable in production
 */

import {
  checkHealth,
  fetchOpportunities,
  fetchOpportunityDetail,
} from '@/lib/api/opportunities';
import type {
  OpportunitiesFilters,
  OpportunitiesFeedResponse,
  OpportunityDetail,
} from '@/types/opportunities';

/**
 * Check if backend is running
 */
export async function testBackendHealth(): Promise<{
  isHealthy: boolean;
  message: string;
  timestamp: string;
}> {
  try {
    const result = await checkHealth();
    return {
      isHealthy: true,
      message: result.message || 'Backend is running',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      isHealthy: false,
      message: `Backend error: ${error instanceof Error ? error.message : 'Unknown'}`,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Test fetching opportunities with various filters
 */
export async function testFetchOpportunities(
  filters?: OpportunitiesFilters
): Promise<{
  success: boolean;
  data?: OpportunitiesFeedResponse;
  error?: string;
  count?: number;
  timestamp: string;
}> {
  try {
    const result = await fetchOpportunities(filters);
    return {
      success: true,
      data: result,
      count: result.opportunities.length,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Test fetching specific opportunity detail
 */
export async function testFetchOpportunityDetail(
  id: string
): Promise<{
  success: boolean;
  data?: OpportunityDetail;
  error?: string;
  timestamp: string;
}> {
  try {
    const result = await fetchOpportunityDetail(id);
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Run all API tests in sequence
 */
export async function runAllAPITests() {
  console.log('🧪 Starting API Integration Tests...\n');

  // Test 1: Health Check
  console.log('1️⃣  Testing Backend Health...');
  const healthResult = await testBackendHealth();
  console.log('✅ Health Check:', healthResult);

  if (!healthResult.isHealthy) {
    console.error('❌ Backend is not reachable. Stop testing.');
    return;
  }

  // Test 2: Fetch Opportunities (Riyadh)
  console.log('\n2️⃣  Testing Fetch Opportunities (Location: Riyadh)...');
  const oppResult = await testFetchOpportunities({
    location: 'Riyadh',
  });
  console.log('✅ Opportunities Result:', oppResult);

  if (!oppResult.success || !oppResult.data?.opportunities[0]) {
    console.warn('⚠️  No opportunities found. Testing with mock ID may fail.');
  } else {
    // Test 3: Fetch Opportunity Detail
    const firstOpportunityId = oppResult.data.opportunities[0].id;
    console.log(`\n3️⃣  Testing Fetch Opportunity Detail (ID: ${firstOpportunityId})...`);
    const detailResult = await testFetchOpportunityDetail(firstOpportunityId);
    console.log('✅ Detail Result:', detailResult);
  }

  console.log('\n🎉 API Integration Tests Complete!\n');
}

/**
 * Log API response structure
 */
export function logResponseStructure(data: any) {
  console.log('📊 Response Structure:');
  console.log(JSON.stringify(data, null, 2));
}

/**
 * Validate opportunity data structure
 */
export function validateOpportunityStructure(opportunity: any): string[] {
  const errors: string[] = [];
  const requiredFields = [
    'id',
    'company_name',
    'job_title',
    'salary',
    'compliance_percentage',
    'category',
    'work_type',
    'employment_type',
    'location',
    'posted_at',
    'application_deadline',
    'is_open',
  ];

  requiredFields.forEach((field) => {
    if (!(field in opportunity)) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  return errors;
}

/**
 * Validate detail opportunity data structure
 */
export function validateDetailOpportunityStructure(
  opportunity: any
): string[] {
  const basicErrors = validateOpportunityStructure(opportunity);
  const detailFields = [
    'company_description',
    'job_description',
    'requirements',
    'working_time',
    'why_this_percent',
    'matched_skills',
    'missing_skills',
    'learning_suggestions',
    'apply_url',
  ];

  const detailErrors: string[] = [];
  detailFields.forEach((field) => {
    if (!(field in opportunity)) {
      detailErrors.push(`Missing detail field: ${field}`);
    }
  });

  return [...basicErrors, ...detailErrors];
}
