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

/**
 * Intake page for creating a new deceased profile and managing associated documents.
 *
 * @todo Implement form submission logic, validation, and backend integration for saving the deceased profile and documents.
 *
 * @remarks
 * the login form itself performs no client-side redirect until
 * the user clicks "Proceed" on the welcome modal.
 */
export default function IntakePage() {
  const [planType, setPlanType] = useState('');
  const [locationOfDeath, setLocationOfDeath] = useState('Hospital');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [filesToDelete] = useState(['Release Paper.pdf']);

  // Mock progress for the progress bar
  const documentProgress = 25;

  return (
    <PageGuard>
      <div className="min-h-screen bg-gray-50 flex flex-col pb-24 relative">
        <Header />

        <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 space-y-6">
          {/* Header Section */}
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

          {/* Vital Statistics */}
          <VitalStatistics
            locationOfDeath={locationOfDeath}
            setLocationOfDeath={setLocationOfDeath}
          />

          {/* Physical Description */}
          <PhysicalDescription />

          {/* Service Arrangement */}
          <ServiceArrangement planType={planType} setPlanType={setPlanType} />

          {/* Document Checklist */}
          <DocumentChecklist
            documentProgress={documentProgress}
            setIsDeleteModalOpen={setIsDeleteModalOpen}
          />

          {/* Representative Information */}
          <RepresentativeInformation />
        </main>

        {/* Sticky Action Bar */}
        <Actionbar />

        {/* Delete Confirmation Modal */}
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
