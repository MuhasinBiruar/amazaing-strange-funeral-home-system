import axios from 'axios';
import {
  createDocumentRequirement,
  uploadDocument,
} from '@/services/documentService';
import { createLifeplan } from '@/services/lifeplansService';
import type { CreateDeceasedRecordQuery } from 'shared';
import type { SubmitEvent } from 'react';
import type { StagedDocument } from '../_components/documentchecklist';
import type { InfoModalOptions } from '@/components/infoModal/types';
import {
  createRepresentative,
  deleteRepresentative,
} from '@/services/representativeService';
import {
  createDeceasedRecord,
  deleteDeceasedRecord,
} from '@/services/deceasedRecordService';
import { createLguCase } from '@/services/financialService';

function getPlantype(
  rawPlantype: string,
): CreateDeceasedRecordQuery['plantype'] {
  if (rawPlantype === 'Life') return 'Life';
  else if (rawPlantype === 'LGU') return 'LGU';

  return 'Direct';
}

export function useSubmitIntake(
  formData: Record<string, unknown>,
  stagedDocuments: StagedDocument[],
  clearDraft: () => void,
  setStatus: (status: string) => void,
  setInfoModal: (props: InfoModalOptions) => void,
  onRecordCreated: (caseid: number) => void,
) {
  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();

    const generatedRepId: number | null = null;
    const generatedCaseId: number | null = null;

    try {
      // STEP 1: REPRESENTATIVE
      setStatus('Saving representative…');
      const { representativeid: generatedRepId } = await createRepresentative({
        firstname: formData.rep_firstname as string,
        middlename: formData.rep_middlename as string,
        lastname: formData.rep_lastname as string,
        relationship: formData.rep_relationship as string,
        contactnumber: formData.rep_contactnumber as string,
        address: formData.rep_address as string,
        datecreated: new Date(),
      });

      // STEP 2: DECEASED RECORD
      setStatus('Saving deceased record…');
      const { caseid: generatedCaseId } = await createDeceasedRecord({
        firstname: formData.firstname as string,
        middlename: formData.middlename as string | null,
        lastname: formData.lastname as string,
        causeofdeath: formData.causeofdeath as string | null,
        typeofdeath:
          formData.typeofdeath === 'Other'
            ? (formData.otherTypeOfDeath as string | null)
            : (formData.typeofdeath as string | null),
        physicaldescription: formData.physicaldescription as string | null,
        servicestatus: 'intake',
        hasmaturedlifeplan: false,
        plantype: getPlantype(formData.plantype as string),
        datecreated: new Date(),
        dateofdeath: formData.dateofdeath
          ? new Date(formData.dateofdeath as string)
          : null,
        managedby: null,
        representedby: generatedRepId,
        hasadvanceddecomposition: formData.hasadvanceddecomposition === true,
      });

      if (formData.plantype === 'Life') {
        setStatus('Saving life plan…');
        await createLifeplan({
          plannumber: formData.lifeplan_plannumber as string,
          planholdername:
            (formData.lifeplan_planholdername as string) ||
            [formData.firstname, formData.middlename, formData.lastname]
              .filter(Boolean)
              .join(' '),
          totalamount: Number(formData.lifeplan_totalamount),
          use_benefits: formData.lifeplan_use_benefits !== 'false',
          caseid: generatedCaseId,
          companyid: Number(formData.lifeplancompanyid),
        });
      } else if (formData.plantype === 'LGU') {
        setStatus('Saving LGU case…');
        // STEP 3: LGU CASE
        await createLguCase({
          reimbursementstatus: 'pending',
          reimbursementamount: Number(formData.lgu_reimbursementamount),
          caseid: generatedCaseId,
        });
      }

      // STEP 5: SAVE REQUIRED DOCUMENTS AND UPLOAD ANY STAGED FILES
      if (stagedDocuments.length > 0)
        setStatus('Saving document requirements…');
      for (const doc of stagedDocuments) {
        await createDocumentRequirement(generatedCaseId!, doc.documenttype);
      }

      if (stagedDocuments.some((d) => d.file))
        setStatus('Uploading documents…');
      const failedUploads: string[] = [];
      for (const doc of stagedDocuments) {
        if (!doc.file) continue;
        try {
          await uploadDocument(generatedCaseId!, doc.documenttype, doc.file);
        } catch (uploadError) {
          failedUploads.push(doc.documenttype);
          console.error(`Failed to upload ${doc.documenttype}:`, uploadError);
        }
      }

      setStatus('');
      clearDraft();
      onRecordCreated(generatedCaseId!);

      if (failedUploads.length > 0) {
        setInfoModal({
          title: 'Record Saved with Warnings',
          message:
            'Your record was saved successfully, but some documents failed to \
            upload. You can retry uploading them later from the Case \
            Management page. Would you like to assign a package to this case \
            now?',
          items: failedUploads,
          severity: 'warning',
        });
      } else {
        setInfoModal({
          title: 'Success',
          message:
            'Record saved successfully! Would you like to assign a package \
            to this case now?',
          severity: 'success',
        });
      }
    } catch (error) {
      setStatus('Cleaning up…');
      const rollbackFailures: string[] = [];

      if (generatedCaseId) {
        try {
          await deleteDeceasedRecord(generatedCaseId);
        } catch (err) {
          rollbackFailures.push(`deceased record (case #${generatedCaseId})`);
          console.error('Failed to clean up orphaned deceased record:', err);
        }
      }

      if (generatedRepId) {
        try {
          await deleteRepresentative(generatedRepId);
        } catch (err) {
          rollbackFailures.push(`representative (ID ${generatedRepId})`);
          console.error('Failed to clean up orphaned representative:', err);
        }
      }

      if (axios.isAxiosError(error)) {
        console.error('Server error details:', error.response?.data);
      } else {
        console.error('Submission failed:', error);
      }

      setStatus('');
      if (rollbackFailures.length > 0) {
        setInfoModal({
          title: 'Critical Save Error',
          message: `The system failed to save your changes and could not \
          automatically undo the partial updates for: ${rollbackFailures.join(
            ', ',
          )}. Please report this to an administrator immediately to prevent \
          data inconsistencies.`,
          severity: 'error',
        });
      } else {
        setInfoModal({
          title: 'Changes Not Saved',
          message:
            'The system encountered an error and could not save your record. \
            Your existing data was safely restored. Please try saving again or \
            contact an admin if the issue persists.',
          severity: 'error',
        });
      }
    }
  };

  return { handleSubmit };
}
