/**
 * GateModal Component
 *
 * First step when visiting opportunities page:
 * - Location input (required)
 * - Preferences checkboxes (Full-Time, Part-Time, Remote, In-Person)
 * - Continue button (disabled until location is provided)
 *
 * This is mandatory before seeing the opportunities feed.
 */

'use client';

import { useState } from 'react';
import {
  RetroModal,
  RetroModalContent,
  RetroModalHeader,
  RetroModalTitle,
  RetroModalFooter,
  RetroButton,
  RetroInput,
  RetroCheckbox,
  RetroLabel,
} from '@/components/retro';
import type { GatePreferences } from '@/types/opportunities';

interface GateModalProps {
  isOpen: boolean;
  onSubmit: (preferences: GatePreferences) => void;
}

export function GateModal({ isOpen, onSubmit }: GateModalProps) {
  // Form state
  const [location, setLocation] = useState('');
  const [employmentTypes, setEmploymentTypes] = useState<string[]>([]);
  const [workTypes, setWorkTypes] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation
  const isValid = location.trim().length > 0;

  // Handle checkbox changes
  const toggleEmploymentType = (type: string) => {
    setEmploymentTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const toggleWorkType = (type: string) => {
    setWorkTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  // Submit handler
  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};

    if (!location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      location: location.trim(),
      employment_type: employmentTypes,
      work_type: workTypes,
    });
  };

  return (
    <RetroModal open={isOpen}>
      <RetroModalContent className="max-w-md">
        <RetroModalHeader>
          <RetroModalTitle>🚀 ابدأ البحث عن الفرص</RetroModalTitle>
          <p className="font-mono text-sm text-gray-700">
            أخبرنا عن تفضيلاتك لإيجاد الفرص المناسبة
          </p>
        </RetroModalHeader>

        {/* Location Input */}
        <div className="space-y-6 py-4">
          <div>
            <RetroInput
              label="📍 الموقع"
              placeholder="مثال: الرياض"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                if (e.target.value.trim()) {
                  setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.location;
                    return newErrors;
                  });
                }
              }}
              error={errors.location || ''}
            />
            <p className="font-mono text-xs text-gray-600 mt-1">
              مطلوب للمتابعة
            </p>
          </div>

          {/* Employment Type Preferences */}
          <div>
            <RetroLabel size="md">💼 نوع العمل المفضل</RetroLabel>
            <div className="space-y-3 mt-3">
              <RetroCheckbox
                label="وظيفة بدوام كامل"
                checked={employmentTypes.includes('Full-Time')}
                onCheckedChange={() => toggleEmploymentType('Full-Time')}
              />
              <RetroCheckbox
                label="وظيفة بدوام جزئي"
                checked={employmentTypes.includes('Part-Time')}
                onCheckedChange={() => toggleEmploymentType('Part-Time')}
              />
            </div>
          </div>

          {/* Work Type Preferences */}
          <div>
            <RetroLabel size="md">🌍 طريقة العمل المفضلة</RetroLabel>
            <div className="space-y-3 mt-3">
              <RetroCheckbox
                label="عمل بعيد (Remote)"
                checked={workTypes.includes('Remote')}
                onCheckedChange={() => toggleWorkType('Remote')}
              />
              <RetroCheckbox
                label="عمل هجين (Hybrid)"
                checked={workTypes.includes('Hybrid')}
                onCheckedChange={() => toggleWorkType('Hybrid')}
              />
              <RetroCheckbox
                label="عمل في المقر"
                checked={workTypes.includes('In-Person')}
                onCheckedChange={() => toggleWorkType('In-Person')}
              />
            </div>
          </div>
        </div>

        {/* Footer with Action Button */}
        <RetroModalFooter>
          <RetroButton
            variant="primary"
            size="lg"
            onClick={handleSubmit}
            disabled={!isValid}
            className="w-full"
          >
            🔍 ابدأ البحث
          </RetroButton>
        </RetroModalFooter>

        {/* Helper Text */}
        <p className="font-mono text-xs text-gray-600 text-center mt-4">
          يمكنك تغيير تفضيلاتك في أي وقت
        </p>
      </RetroModalContent>
    </RetroModal>
  );
}
