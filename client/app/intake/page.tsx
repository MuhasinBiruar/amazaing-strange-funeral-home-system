'use client';

import Header from '../../components/header';
import Footer from '../../components/footer';
import PageGuard from '../../components/pageGuard';
import { useState } from 'react';
import VitalStatistics from './_components/vitalstatistics';
import PhysicalDescription from './_components/physicaldescription';
import ServiceArrangement from './_components/servicearrangement';
import DocumentChecklist from './_components/documentchecklist';
import RepresentativeInformation from './_components/representativeinfo';
import Actionbar from './_components/actionbar';
import DeleteModal from './_components/deletemodal';
import { useDraft } from './_hooks/useDraft';
import { useSubmitIntake } from './_hooks/useSubmitIntake';

export default function IntakePage() {
  const { formData, isDraftLoaded, handleFormChange, clearDraft } = useDraft(
    'intake_draft',
    {
      planType: '',
      locationOfDeath: 'Hospital',
    },
  );
  const { handleSubmit } = useSubmitIntake(formData, clearDraft);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [filesToDelete] = useState(['Release Paper.pdf']);
  const documentProgress = 25;

  if (!isDraftLoaded) return null;

  return (
    <PageGuard>
      <div className="min-h-screen bg-gray-50 flex flex-col pb-24 relative">
        <Header />

        <form onSubmit={handleSubmit} className="contents">
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

            <VitalStatistics data={formData} onChange={handleFormChange} />
            <PhysicalDescription data={formData} onChange={handleFormChange} />
            <ServiceArrangement data={formData} onChange={handleFormChange} />

            <DocumentChecklist
              documentProgress={documentProgress}
              setIsDeleteModalOpen={setIsDeleteModalOpen}
            />

            <RepresentativeInformation
              data={formData}
              onChange={handleFormChange}
            />
          </main>

          <Actionbar clearDraft={clearDraft} />
        </form>

        {isDeleteModalOpen && (
          <DeleteModal
            filesToDelete={filesToDelete}
            setIsDeleteModalOpen={setIsDeleteModalOpen}
          />
        )}
        <Footer />
      </div>
    </PageGuard>
  );
}
// TODO: fix modal showing up when I press enter for no reason
// TODO: delete modal has no functionality
// TODO: clicking on upload does not accept any file (where would we even store this)
// TODO: submit button should also clear the local storage draft after successful submission.
// TODO: submit button should also validate the form before submission and show errors if any required fields are missing or invalid.
// TODO: submit button stop user from proceeding if there are missing required fields or invalid data, and highlight those fields with error messages. (perhaps with wizard style navigation to guide the user to the missing fields)
// TODO: add a "draft saved successfully" notification when the draft is saved to local storage
// TODO: add a "reset form" button that clears the form and local storage draft.
// TODO: number field should only accept numbers and not letters or special characters. (e.g., age, height, weight, etc.)
// TODO: phone number field should accept only valid phone number formats and show an error message if the format is invalid. (e.g., +63 912 345 6789 or 0912 345 6789)
