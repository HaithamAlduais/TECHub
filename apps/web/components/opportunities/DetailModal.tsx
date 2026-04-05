/**
 * DetailModal Component
 *
 * Job opportunity detail view with 6 blocks:
 * 1. Header (job title, company, location, compliance)
 * 2. Company Description (AI-generated)
 * 3. Job Role & Responsibilities
 * 4. Requirements & Qualifications
 * 5. Why This Percent? (highlighted box with matched/missing skills)
 * 6. Learning Suggestions + Apply Button
 *
 * Layout: Full-screen modal with vertical scroll
 */

'use client';

import { useEffect, useCallback } from 'react';
import {
  RetroModal,
  RetroModalContent,
  RetroModalHeader,
  RetroModalTitle,
  RetroModalFooter,
  RetroButton,
  RetroBadge,
  RetroProgressBar,
  RetroCard,
  RetroAlert,
} from '@/components/retro';
import type { OpportunityDetail } from '@/types/opportunities';
import { WORK_TYPE_LABELS, EMPLOYMENT_TYPE_LABELS } from '@/lib/opportunities-constants';
import { formatSalary } from '@/lib/opportunities-utils';

interface DetailModalProps {
  isOpen: boolean;
  opportunity: OpportunityDetail | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
}

export function DetailModal({
  isOpen,
  opportunity,
  isLoading,
  error,
  onClose,
}: DetailModalProps) {
  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!opportunity && !isLoading) return null;

  return (
    <RetroModal open={isOpen}>
      <RetroModalContent className="max-w-4xl max-h-[90vh]">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center space-y-4">
              <div className="animate-spin text-4xl">⏳</div>
              <p className="font-mono font-semibold">جاري التحميل...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <RetroAlert
            variant="error"
            title="خطأ في التحميل"
            description={error}
          />
        )}

        {/* Content */}
        {opportunity && !isLoading && !error && (
          <>
            <RetroModalHeader>
              <div className="space-y-3">
                {/* Block 1: Header */}
                <div>
                  <p className="font-mono text-xs font-bold text-blue-600 uppercase">
                    {opportunity.company_name}
                  </p>
                  <h1 className="font-mono text-2xl font-bold text-black mt-1">
                    {opportunity.job_title}
                  </h1>
                </div>

                {/* Quick Info */}
                <div className="flex flex-wrap gap-2 py-3 border-b-2 border-gray-300">
                  <RetroBadge variant="category" size="sm">
                    📍 {opportunity.location}
                  </RetroBadge>
                  <RetroBadge variant="success" size="sm">
                    {WORK_TYPE_LABELS[opportunity.work_type]}
                  </RetroBadge>
                  <RetroBadge variant="warning" size="sm">
                    {EMPLOYMENT_TYPE_LABELS[opportunity.employment_type]}
                  </RetroBadge>
                  {opportunity.salary && (
                    <RetroBadge variant="category" size="sm">
                      💰 {formatSalary(opportunity.salary)}
                    </RetroBadge>
                  )}
                </div>

                {/* Compliance Percentage */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-mono font-bold">نسبة التطابق:</p>
                    <p className="font-mono text-2xl font-bold text-blue-600">
                      {opportunity.compliance_percentage}%
                    </p>
                  </div>
                  <RetroProgressBar
                    value={opportunity.compliance_percentage}
                    size="lg"
                    showPercentage={false}
                  />
                </div>
              </div>
            </RetroModalHeader>

            {/* Modal Body */}
            <div className="space-y-6 py-6 overflow-y-auto max-h-[calc(90vh-300px)]">
              {/* Block 2: Company Description */}
              <div className="space-y-2">
                <h2 className="font-mono font-bold text-lg text-black">
                  🏢 عن الشركة
                </h2>
                <RetroCard>
                  <p className="font-mono text-sm text-gray-800 whitespace-pre-wrap">
                    {opportunity.company_description}
                  </p>
                </RetroCard>
              </div>

              {/* Block 3: Job Role & Responsibilities */}
              <div className="space-y-2">
                <h2 className="font-mono font-bold text-lg text-black">
                  💼 وصف الوظيفة
                </h2>
                <RetroCard>
                  <p className="font-mono text-sm text-gray-800 whitespace-pre-wrap">
                    {opportunity.job_description}
                  </p>
                </RetroCard>
              </div>

              {/* Block 4: Requirements & Qualifications */}
              <div className="space-y-2">
                <h2 className="font-mono font-bold text-lg text-black">
                  ✅ المتطلبات والمؤهلات
                </h2>
                <RetroCard>
                  <ul className="space-y-2">
                    {opportunity.requirements.map((req, idx) => (
                      <li
                        key={idx}
                        className="font-mono text-sm text-gray-800 flex items-start gap-2"
                      >
                        <span className="flex-shrink-0">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </RetroCard>
              </div>

              {/* Block 5: Why This Percent? (HIGHLIGHTED) */}
              <div className="space-y-2">
                <h2 className="font-mono font-bold text-lg text-black">
                  🎯 لماذا هذه النسبة؟
                </h2>
                <RetroCard highlighted className="space-y-4">
                  {/* Explanation */}
                  <div>
                    <p className="font-mono text-sm font-semibold text-black mb-2">
                      ✨ الشرح:
                    </p>
                    <p className="font-mono text-sm text-gray-800">
                      {opportunity.why_this_percent}
                    </p>
                  </div>

                  {/* Matched Skills */}
                  {opportunity.matched_skills.length > 0 && (
                    <div>
                      <p className="font-mono text-sm font-semibold text-green-700 mb-2">
                        ✓ المهارات المطابقة ({opportunity.matched_skills.length}):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {opportunity.matched_skills.map((skill) => (
                          <RetroBadge
                            key={skill}
                            variant="verified"
                            size="sm"
                          >
                            ✓ {skill}
                          </RetroBadge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing Skills */}
                  {opportunity.missing_skills.length > 0 && (
                    <div>
                      <p className="font-mono text-sm font-semibold text-red-700 mb-2">
                        ✗ المهارات الناقصة ({opportunity.missing_skills.length}):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {opportunity.missing_skills.map((skill) => (
                          <RetroBadge
                            key={skill}
                            variant="danger"
                            size="sm"
                          >
                            ✗ {skill}
                          </RetroBadge>
                        ))}
                      </div>
                    </div>
                  )}
                </RetroCard>
              </div>

              {/* Block 6: Learning Suggestions + Apply */}
              <div className="space-y-3">
                <h2 className="font-mono font-bold text-lg text-black">
                  🎓 مقترحات التعلم
                </h2>
                <RetroCard>
                  <p className="font-mono text-sm text-gray-800">
                    {opportunity.learning_suggestions}
                  </p>
                </RetroCard>

                {opportunity.working_time && (
                  <div>
                    <p className="font-mono text-xs text-gray-600 mb-1">
                      ⏰ أوقات العمل:
                    </p>
                    <RetroCard>
                      <p className="font-mono font-semibold text-sm">
                        {opportunity.working_time}
                      </p>
                    </RetroCard>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <RetroModalFooter>
              <RetroButton
                variant="secondary"
                size="md"
                onClick={onClose}
              >
                إغلاق
              </RetroButton>
              <RetroButton
                variant="primary"
                size="lg"
                onClick={() => {
                  if (opportunity.apply_url) {
                    window.open(opportunity.apply_url, '_blank');
                  }
                }}
                disabled={!opportunity.is_open}
              >
                {opportunity.is_open
                  ? '✉️ اتقدم الآن'
                  : '🚫 التقديم مغلق'}
              </RetroButton>
            </RetroModalFooter>
          </>
        )}
      </RetroModalContent>
    </RetroModal>
  );
}
