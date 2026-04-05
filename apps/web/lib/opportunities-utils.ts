/**
 * Opportunities Utility Functions
 * Helper functions for formatting and validation
 */

import { formatDistanceToNow, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';

/**
 * Format relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: ar,
    });
  } catch (error) {
    return dateString;
  }
}

/**
 * Format salary with comma separators
 */
export function formatSalary(salary: string | null): string {
  if (!salary) return 'غير محدد';
  
  // Remove any existing formatting
  const cleaned = salary.replace(/[^\d]/g, '');
  if (!cleaned) return salary;

  return `${parseInt(cleaned).toLocaleString('ar-SA')} ر.س`;
}

/**
 * Calculate days until deadline
 */
export function daysUntilDeadline(dateString: string): number {
  try {
    const deadline = parseISO(dateString);
    const today = new Date();
    const diff = deadline.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  } catch (error) {
    return 0;
  }
}

/**
 * Check if opportunity is closing soon
 */
export function isClosingSoon(dateString: string): boolean {
  const days = daysUntilDeadline(dateString);
  return days > 0 && days <= 7;
}

/**
 * Validate filter values before sending to API
 */
export function validateFilters(filters: Record<string, any>): boolean {
  const validCategories = ['Jobs', 'Coop', 'GDP'];
  const validEmploymentTypes = ['Full-Time', 'Part-Time'];
  const validWorkTypes = ['Remote', 'Hybrid', 'In-Person'];
  const validSortOptions = ['match', 'salary', 'relevance'];

  if (
    filters.category &&
    !validCategories.includes(filters.category)
  ) {
    return false;
  }

  if (
    filters.employment_type &&
    !validEmploymentTypes.includes(filters.employment_type)
  ) {
    return false;
  }

  if (filters.work_type && !validWorkTypes.includes(filters.work_type)) {
    return false;
  }

  if (filters.sort_by && !validSortOptions.includes(filters.sort_by)) {
    return false;
  }

  return true;
}

/**
 * Parse requirements text and return as array
 */
export function parseRequirements(requirementsText: string | string[]): string[] {
  if (Array.isArray(requirementsText)) {
    return requirementsText;
  }

  return requirementsText
    .split('\n')
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    .filter((line) => line.length > 0);
}

/**
 * Highlight matching skills
 */
export function highlightMatchedSkills(
  allSkills: string[],
  matchedSkills: string[]
): { skill: string; isMatched: boolean }[] {
  return allSkills.map((skill) => ({
    skill,
    isMatched: matchedSkills.some(
      (matched) => matched.toLowerCase() === skill.toLowerCase()
    ),
  }));
}
