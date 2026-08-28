'use client';

import Header from '../../components/header';
import Footer from '../../components/footer';
import PageGuard from '../../components/pageGuard';
import { useState, useEffect } from 'react';
import VitalStatistics from './_components/vitalstatistics';
import PhysicalDescription from './_components/physicaldescription';
import ServiceArrangement from './_components/servicearrangement';
import DocumentChecklist from './_components/documentchecklist';
import RepresentativeInformation from './_components/representativeinfo';
import Actionbar from './_components/actionbar';
import DeleteModal from './_components/deletemodal';

export default function IntakePage() {
  const [formData, setFormData] = useState<any>({
    planType: '',
    locationOfDeath: 'Hospital',
  });

  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [filesToDelete] = useState(['Release Paper.pdf']);
  const documentProgress = 25;

  useEffect(() => {
    const savedDraft = localStorage.getItem('intake_draft');
    if (savedDraft) {
      setFormData(JSON.parse(savedDraft));
    }
    setIsDraftLoaded(true);
  }, []);

  useEffect(() => {
    if (isDraftLoaded) {
      localStorage.setItem('intake_draft', JSON.stringify(formData));
    }
  }, [formData, isDraftLoaded]);

  const handleFormChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting MASTER STATE to the database:', formData);
  };

  if (!isDraftLoaded) return null;

  return (
    // <PageGuard>
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
              Create a record for the deceased. Ensure all identifiers and legal
              requirements are complete.
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
        <Actionbar />
      </form>

      {isDeleteModalOpen && (
        <DeleteModal
          filesToDelete={filesToDelete}
          setIsDeleteModalOpen={setIsDeleteModalOpen}
        />
      )}
      <Footer />
    </div>
    // </PageGuard>
  );
}
