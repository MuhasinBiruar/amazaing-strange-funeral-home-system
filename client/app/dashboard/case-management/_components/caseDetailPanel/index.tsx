import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { Loader2 } from 'lucide-react';
import type { DocumentWithUrl } from 'shared';
import {
  getDeceasedRecord,
  updateDeceasedRecord,
} from '@/services/deceasedRecordService';
import {
  getRepresentative,
  updateRepresentative,
} from '@/services/representativeService';
import { getDocumentsByCase } from '@/services/documentService';
import SidePanel from '@/components/sidePanel';
import { useSidePanel } from '@/components/sidePanel/useSidePanel';
import DocumentsSection from './documentsSection';
import DeceasedInfoSection from './deceasedInfoSection';
import RepresentativeInfoSection from './representativeInfoSection';
import {
  toDeceasedForm,
  toRepresentativeForm,
  type DeceasedForm,
  type RepresentativeForm,
} from './types';

export default function CaseDetailPanel({
  caseid,
  representativeid,
  onClose,
  setRefreshKey,
}: {
  caseid: number;
  representativeid: number | null;
  onClose: () => void;
  setRefreshKey: Dispatch<SetStateAction<number>>;
}) {
  const { isShown, requestClose } = useSidePanel(onClose);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [deceasedForm, setDeceasedForm] = useState<DeceasedForm | null>(null);
  const [deceasedSaveError, setDeceasedSaveError] = useState<string | null>(
    null,
  );
  const [isSavingDeceased, setIsSavingDeceased] = useState(false);
  const [isDeceasedSaved, setIsDeceasedSaved] = useState(false);

  const [representativeForm, setRepresentativeForm] =
    useState<RepresentativeForm | null>(null);
  const [representativeSaveError, setRepresentativeSaveError] = useState<
    string | null
  >(null);
  const [isSavingRepresentative, setIsSavingRepresentative] = useState(false);
  const [isRepresentativeSaved, setIsRepresentativeSaved] = useState(false);

  const [documents, setDocuments] = useState<DocumentWithUrl[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const [deceased, representative, docs] = await Promise.all([
          getDeceasedRecord(caseid),
          representativeid ? getRepresentative(representativeid) : null,
          getDocumentsByCase(caseid, controller.signal),
        ]);

        if (controller.signal.aborted) return;

        setDeceasedForm(toDeceasedForm(deceased));
        setRepresentativeForm(
          representative ? toRepresentativeForm(representative) : null,
        );
        setDocuments(docs);
      } catch (error) {
        if (controller.signal.aborted) return;

        console.error('Failed to load case details:', error);
        setLoadError('Could not load this case. Try again.');
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    load();

    return () => controller.abort();
  }, [caseid, representativeid]);

  async function handleSaveDeceased() {
    if (!deceasedForm) return;

    setIsSavingDeceased(true);
    setDeceasedSaveError(null);
    setIsDeceasedSaved(false);

    try {
      await updateDeceasedRecord(caseid, {
        firstname: deceasedForm.firstname,
        middlename: deceasedForm.middlename || null,
        lastname: deceasedForm.lastname,
        causeofdeath: deceasedForm.causeofdeath || null,
        typeofdeath: deceasedForm.typeofdeath || null,
        physicaldescription: deceasedForm.physicaldescription || null,
        servicestatus: deceasedForm.servicestatus,
        plantype: deceasedForm.plantype,
        dateofdeath: deceasedForm.dateofdeath
          ? new Date(deceasedForm.dateofdeath)
          : null,
        hasmaturedlifeplan: deceasedForm.hasmaturedlifeplan,
      });
      setRefreshKey((v) => v + 1);
      setIsDeceasedSaved(true);
    } catch (error) {
      setDeceasedSaveError(
        error instanceof Error
          ? error.message
          : 'Could not save changes. Try again.',
      );
    } finally {
      setIsSavingDeceased(false);
    }
  }

  async function handleSaveRepresentative() {
    if (!representativeForm || !representativeid) return;

    setIsSavingRepresentative(true);
    setRepresentativeSaveError(null);
    setIsRepresentativeSaved(false);

    try {
      await updateRepresentative(representativeid, {
        firstname: representativeForm.firstname,
        middlename: representativeForm.middlename,
        lastname: representativeForm.lastname,
        relationship: representativeForm.relationship || null,
        contactnumber: representativeForm.contactnumber,
        address: representativeForm.address,
      });
      setRefreshKey((v) => v + 1);
      setIsRepresentativeSaved(true);
    } catch (error) {
      setRepresentativeSaveError(
        error instanceof Error
          ? error.message
          : 'Could not save changes. Try again.',
      );
    } finally {
      setIsSavingRepresentative(false);
    }
  }

  return (
    <SidePanel
      shown={isShown}
      onRequestClose={requestClose}
      ariaLabel="Case details"
      badge={`CASE #${caseid}`}
      badgeClassName="bg-orange-100 text-orange-800"
      title={
        deceasedForm
          ? `${deceasedForm.firstname} ${deceasedForm.lastname}`
          : 'Case details'
      }
    >
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" />
            Loading...
          </div>
        )}

        {!isLoading && loadError && (
          <p className="text-sm text-red-500">{loadError}</p>
        )}

        {!isLoading && !loadError && deceasedForm && (
          <>
            <DeceasedInfoSection
              form={deceasedForm}
              setForm={setDeceasedForm}
              onSave={handleSaveDeceased}
              isSaving={isSavingDeceased}
              saveError={deceasedSaveError}
              isSaved={isDeceasedSaved}
            />

            <RepresentativeInfoSection
              form={representativeForm}
              setForm={setRepresentativeForm}
              onSave={handleSaveRepresentative}
              isSaving={isSavingRepresentative}
              saveError={representativeSaveError}
              isSaved={isRepresentativeSaved}
            />

            <DocumentsSection
              caseid={caseid}
              documents={documents}
              onUploaded={(doc) => setDocuments((prev) => [doc, ...prev])}
            />
          </>
        )}
      </div>
    </SidePanel>
  );
}
