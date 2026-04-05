/**
 * JobCard Component
 *
 * Individual opportunity card showing:
 * - Company name & job title
 * - Location, salary, work type
 * - Compliance percentage with color-coded bar
 * - Clickable to open detail modal
 *
 * Card UI:
 * - Thick black borders
 * - Hard drop shadow
 * - 8-bit progress bar
 * - Responsive layout
 */

'use client';

import { formatRelativeTime, formatSalary } from '@/lib/opportunities-utils';
import {
  RetroCard,
  RetroBadge,
  RetroProgressBar,
  RetroButton,
} from '@/components/retro';
import type { Opportunity } from '@/types/opportunities';
import { WORK_TYPE_LABELS, EMPLOYMENT_TYPE_LABELS } from '@/lib/opportunities-constants';

interface JobCardProps {
  opportunity: Opportunity;
  onViewDetails: (id: string) => void;
}

export function JobCard({ opportunity, onViewDetails }: JobCardProps) {
  return (
    <RetroCard
      clickable
      className="space-y-3 group cursor-pointer transition-all"
    >
      {/* Header: Company & Title */}
      <div className="space-y-1">
        <p className="font-mono text-xs font-bold text-blue-600 uppercase">
          {opportunity.company_name}
        </p>
        <h3 className="font-mono text-lg font-bold text-black group-hover:text-blue-600 transition-colors">
          {opportunity.job_title}
        </h3>
      </div>

      {/* Meta Information */}
      <div className="flex flex-wrap gap-2">
        <RetroBadge variant="category" size="sm">
          📍 {opportunity.location}
        </RetroBadge>
        <RetroBadge variant="success" size="sm">
          {WORK_TYPE_LABELS[opportunity.work_type]}
        </RetroBadge>
        <RetroBadge variant="warning" size="sm">
          {EMPLOYMENT_TYPE_LABELS[opportunity.employment_type]}
        </RetroBadge>
      </div>

      {/* Salary & Posted Info */}
      <div className="flex items-center justify-between py-2 border-t-2 border-b-2 border-gray-300">
        <div>
          <p className="font-mono text-xs text-gray-600">الراتب</p>
          <p className="font-mono font-bold text-lg">
            {formatSalary(opportunity.salary)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-xs text-gray-600">منشور</p>
          <p className="font-mono text-xs font-semibold">
            {formatRelativeTime(opportunity.posted_at)}
          </p>
        </div>
      </div>

      {/* Compliance Percentage */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <p className="font-mono text-sm font-bold">نسبة المطابقة</p>
          <p className="font-mono text-lg font-bold text-blue-600">
            {opportunity.compliance_percentage}%
          </p>
        </div>
        <RetroProgressBar
          value={opportunity.compliance_percentage}
          size="md"
          showPercentage={false}
        />
        <p className="font-mono text-xs text-gray-600">
          {opportunity.compliance_percentage >= 75
            ? '✓ موافق تماماً لملفك'
            : opportunity.compliance_percentage >= 50
            ? '~ موافق جزئياً'
            : '✗ قد لا يكون مناسباً'}
        </p>
      </div>

      {/* Action Button */}
      <div className="pt-3 border-t-2 border-gray-300">
        <RetroButton
          variant="primary"
          size="md"
          onClick={() => onViewDetails(opportunity.id)}
          className="w-full"
        >
          👁️ عرض التفاصيل
        </RetroButton>
      </div>

      {/* Status Badge */}
      {!opportunity.is_open && (
        <div className="absolute top-2 right-2 bg-gray-400 text-white px-2 py-1 font-mono text-xs font-bold">
          مغلق
        </div>
      )}
    </RetroCard>
  );
}
