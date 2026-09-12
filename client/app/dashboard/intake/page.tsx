'use client';

import { useState } from 'react';
import VitalStatistics from './_components/vitalstatistics';
import PhysicalDescription from './_components/physicaldescription';
import ServiceArrangement from './_components/servicearrangement';
import DocumentChecklist from './_components/documentchecklist';
import RepresentativeInformation from './_components/representativeinfo';
import Actionbar from './_components/actionbar';
import { useDraft } from './_hooks/useDraft';
import { useSubmitIntake } from './_hooks/useSubmitIntake';
import { validateIntakeForm, getFirstErrorField } from './_lib/validateIntake';

export default function IntakePage() {
  const { formData, isDraftLoaded, handleFormChange, clearDraft } = useDraft(
    'intake_draft',
    { planType: '', locationOfDeath: 'Hospital' },
  );
  const { handleSubmit } = useSubmitIntake(formData, clearDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isDraftLoaded) return null;

  const onFieldChange = (field: string, value: unknown) => {
    handleFormChange(field, value);
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleValidatedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateIntakeForm(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstErrorField = getFirstErrorField(validationErrors);
      if (firstErrorField) {
        const el = document.getElementById(firstErrorField);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el?.focus();
      }
      return;
    }

    setErrors({});
    handleSubmit(e);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24 relative">
      <form onSubmit={handleValidatedSubmit} className="contents">
        <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 space-y-6">
          <div>
            <span className="inline-block bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-0.5 rounded mb-2">
              NEW CASE ENTRY
            </span>
            <h1 className="text-3xl font-serif font-bold text-gray-900">
              Deceased Profile
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Create a record for the deceased. Ensure all identifiers and legal
              requirements are complete.
            </p>
          </div>

          <VitalStatistics
            data={formData}
            onChange={onFieldChange}
            errors={errors}
          />
          <PhysicalDescription data={formData} onChange={onFieldChange} />
          <ServiceArrangement
            data={formData}
            onChange={onFieldChange}
            errors={errors}
          />
          <DocumentChecklist />
          <RepresentativeInformation
            data={formData}
            onChange={onFieldChange}
            errors={errors}
          />
        </main>

        <Actionbar clearDraft={clearDraft} />
      </form>
    </div>
  );
}
