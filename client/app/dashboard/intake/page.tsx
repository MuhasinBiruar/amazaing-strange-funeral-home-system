'use client';

import { useState, type SubmitEvent } from 'react';
import VitalStatistics from './_components/vitalstatistics';
import PhysicalDescription from './_components/physicaldescription';
import ServiceArrangement from './_components/servicearrangement';
import DocumentChecklist, {
  initialStagedDocuments,
  type StagedDocument,
} from './_components/documentchecklist';
import RepresentativeInformation from './_components/representativeinfo';
import ActionBar from './_components/actionbar';
import { useDraft } from './_hooks/useDraft';
import { useSubmitIntake } from './_hooks/useSubmitIntake';
import { validateIntakeForm, getFirstErrorField } from './_lib/validateIntake';
import isObjectEmpty from '@/utils/isObjectEmpty';

export default function IntakePage() {
  const { formData, handleFormChange, clearDraft } = useDraft('intake_draft', {
    plantype: '',
    locationOfDeath: 'Hospital',
  });
  // Keep uploaded files separate from the rest of the form data.
  // `useDraft` saves `formData` to localStorage as JSON whenever it changes,
  // but browser `File` objects cannot be stored correctly in JSON.
  const [stagedDocuments, setStagedDocuments] = useState<StagedDocument[]>(
    initialStagedDocuments,
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');
  const { handleSubmit } = useSubmitIntake(
    formData,
    stagedDocuments,
    clearDraft,
    setSubmitStatus,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const handleValidatingSubmit = async (ev: SubmitEvent) => {
    ev.preventDefault();
    setIsSubmitting(true);
    const onBeforeUnload = (ev: BeforeUnloadEvent) => {
      ev.preventDefault();
      ev.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);

    const validationErrors = validateIntakeForm(formData);
    if (!isObjectEmpty(validationErrors)) {
      setErrors(validationErrors);
      const firstErrorField = getFirstErrorField(validationErrors);
      if (firstErrorField) {
        const el = document.getElementById(firstErrorField);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el?.focus();
      }

      setIsSubmitting(false);
      window.removeEventListener('beforeunload', onBeforeUnload);
      return;
    }
    setErrors({});

    await handleSubmit(ev);

    setIsSubmitting(false);
    window.removeEventListener('beforeunload', onBeforeUnload);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24 relative">
      <form onSubmit={handleValidatingSubmit} className="contents">
        <fieldset disabled={isSubmitting} className="contents">
          <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 space-y-6">
            <div>
              <span className="inline-block bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-0.5 rounded mb-2">
                NEW CASE ENTRY
              </span>
              <h1 className="text-3xl font-serif font-bold text-gray-900">
                Deceased Profile
              </h1>
              <p className="text-sm text-gray-500 mt-2">
                Create a record for the deceased. Ensure all identifiers and
                legal requirements are complete.
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
            <DocumentChecklist
              documents={stagedDocuments}
              onChange={setStagedDocuments}
            />
            <RepresentativeInformation
              data={formData}
              onChange={onFieldChange}
              errors={errors}
            />
          </main>

          <ActionBar
            clearDraft={clearDraft}
            isSubmitting={isSubmitting}
            submitStatus={submitStatus}
          />
        </fieldset>
      </form>
    </div>
  );
}
