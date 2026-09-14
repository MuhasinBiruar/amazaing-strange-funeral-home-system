import axios from 'axios';
import { API } from '@/services/api';
import type {
  CreateDeceasedRecordQuery,
  CreateRepresentativeQuery,
} from 'shared';
import type { SubmitEvent } from 'react';

export function useSubmitIntake(
  formData: Record<string, unknown>,
  clearDraft: () => void,
) {
  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();

    let generatedRepId: number | null = null;

    try {
      // ==========================================
      // STEP 1: CREATE THE REPRESENTATIVE FIRST
      // ==========================================
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
      generatedRepId = repResponse.data.data.representativeid;

      if (!generatedRepId)
        throw new Error(
          'Representative created but no ID returned — check backend response shape',
        );

      // ==========================================
      // STEP 2: CREATE THE DECEASED RECORD
      // ==========================================
      const recordPayload: CreateDeceasedRecordQuery = {
        firstname: formData.firstname as string,
        middlename: formData.middlename as string | null,
        lastname: formData.lastname as string,
        causeofdeath: formData.causeofdeath as string | null,
        typeofdeath: formData.typeofdeath as string | null,
        physicaldescription: formData.physicaldescription as string | null,
        servicestatus: 'intake',
        hasmaturedlifeplan: false,
        plantype: formData.plantype === 'Life Plan' ? 'Life' : 'Direct',
        datecreated: new Date(),
        dateofdeath: formData.dateofdeath
          ? new Date(formData.dateofdeath as string)
          : null,
        managedby: null,
        representedby: generatedRepId,
      };

      await API.post('/deceasedrecords', recordPayload);

      // TODO: Create lifeplan & lifeplancompany

      console.log('Success! Both records saved.');
      clearDraft();
      alert('Record saved successfully!');
    } catch (error) {
      // ==========================================
      // ROLLBACK: DELETE ORPHANED REP IF STEP 2 FAILS
      // ==========================================
      let rollbackFailed = false;

      if (generatedRepId) {
        console.warn('Rolling back: deleting orphaned representative...');
        try {
          await API.delete(`/representatives/${generatedRepId}`);
        } catch (deleteErr) {
          rollbackFailed = true;
          console.error(
            'Failed to clean up orphaned representative:',
            deleteErr,
          );
        }
      }

      if (axios.isAxiosError(error)) {
        console.error('Backend error details:', error.response?.data);
      } else {
        console.error('Submission failed:', error);
      }

      if (rollbackFailed) {
        alert(
          `Failed to save the record, and automatic cleanup also failed. ` +
            `A representative record (ID ${generatedRepId}) may be orphaned — ` +
            `please report this to an admin.`,
        );
      } else {
        alert('Failed to save the record. Check the console.');
      }
    }
  };

  return { handleSubmit };
}
