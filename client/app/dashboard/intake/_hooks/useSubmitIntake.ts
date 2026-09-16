import axios from 'axios';
import { API } from '@/services/api';
import { uploadDocument } from '@/services/documentService';
import type {
  CreateDeceasedRecordQuery,
  CreateLifeplanCompanyQuery,
  CreateLifeplanQuery,
  CreateRepresentativeQuery,
} from 'shared';
import type { SubmitEvent } from 'react';
import type { StagedDocument } from '../_components/documentchecklist';

function getPlantype(
  rawPlantype: string,
): CreateDeceasedRecordQuery['plantype'] {
  if (rawPlantype === 'Life') return 'Life';
  else if (rawPlantype === 'LGU') return 'LGU';

  return 'Direct';
}

// TODO: Replace alerts with modal
export function useSubmitIntake(
  formData: Record<string, unknown>,
  stagedDocuments: StagedDocument[],
  clearDraft: () => void,
  setStatus: (status: string) => void,
) {
  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();

    let generatedRepId: number | null = null;
    let generatedCaseId: number | null = null;
    let generatedCompanyId: number | null = null;

    try {
      // STEP 1: REPRESENTATIVE
      setStatus('Saving representative…');
      const repPayload: CreateRepresentativeQuery = {
        firstname: formData.rep_firstname as string,
        middlename: formData.rep_middlename as string,
        lastname: formData.rep_lastname as string,
        relationship: formData.rep_relationship as string,
        contactnumber: formData.rep_contactnumber as string,
        address: formData.rep_address as string,
        datecreated: new Date(),
      };
      const repResponse = await API.post('/representatives', repPayload);
      generatedRepId = repResponse.data.data.representativeid as number;

      // STEP 2: DECEASED RECORD
      setStatus('Saving deceased record…');
      const recordPayload: CreateDeceasedRecordQuery = {
        firstname: formData.firstname as string,
        middlename: formData.middlename as string | null,
        lastname: formData.lastname as string,
        causeofdeath: formData.causeofdeath as string | null,
        typeofdeath: formData.typeofdeath as string | null,
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
      };
      const recordResponse = await API.post('/deceasedrecords', recordPayload);
      generatedCaseId = recordResponse.data.data.caseid as number;

      if (formData.plantype === 'Life') {
        setStatus('Saving life plan…');
        // STEP 3: LIFEPLAN COMPANY
        const companyPayload: CreateLifeplanCompanyQuery = {
          companyname: formData.lifeplancompany as string,
          contactinfo: null,
        };
        const companyResponse = await API.post(
          '/financial/lifeplans/companies',
          companyPayload,
        );
        generatedCompanyId = companyResponse.data.data.companyid as number;

        // STEP 4: LIFEPLAN
        const lifeplanPayload: CreateLifeplanQuery = {
          plannumber: null,
          planholdername: null,
          minimumthreshold: null,
          totalamount: null,
          caseid: generatedCaseId,
          companyid: generatedCompanyId,
        };
        await API.post('/financial/lifeplans', lifeplanPayload);
      } else if (formData.plantype === 'LGU') {
        setStatus('Saving life plan…');
        // TODO: Create lgucase
      }

      // STEP 5: UPLOAD ANY STAGED DOCUMENTS
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

      if (failedUploads.length > 0) {
        alert(
          `Record saved, but these documents failed to upload: ${failedUploads.join(', ')}. ` +
            `You can upload them again later from the case's detail panel.`,
        );
      } else {
        alert('Record saved successfully!');
      }
    } catch (error) {
      setStatus('Cleaning up…');
      const rollbackFailures: string[] = [];

      if (generatedCompanyId) {
        try {
          await API.delete(
            `/financial/lifeplans/companies/${generatedCompanyId}`,
          );
        } catch (err) {
          rollbackFailures.push(`life plan company (ID ${generatedCompanyId})`);
          console.error('Failed to clean up orphaned lifeplan company:', err);
        }
      }

      if (generatedCaseId) {
        try {
          await API.delete(`/deceasedrecords/${generatedCaseId}`);
        } catch (err) {
          rollbackFailures.push(`deceased record (case #${generatedCaseId})`);
          console.error('Failed to clean up orphaned deceased record:', err);
        }
      }

      if (generatedRepId) {
        try {
          await API.delete(`/representatives/${generatedRepId}`);
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
        alert(
          `Failed to save the record, and automatic cleanup also failed for: ` +
            `${rollbackFailures.join(', ')}. Please report this to an admin.`,
        );
      } else {
        alert('Failed to save the record. Check the console.');
      }
    }
  };

  return { handleSubmit };
}
