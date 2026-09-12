import { FormEvent } from 'react';
import axios from 'axios';
import { API } from '@/services/api';
import type {
  CreateDeceasedRecordQuery,
  CreateRepresentativeQuery,
} from 'shared';

// Convert empty form strings into proper null values, so Zod's
// .min(1) checks don't reject fields the user simply left blank.
const cleanEmptyStrings = (data: Record<string, unknown>) => {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      typeof value === 'string' && value.trim() === '' ? null : value,
    ]),
  );
};

export function useSubmitIntake(
  formData: Record<string, unknown>,
  clearDraft: () => void,
) {
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const cleanedFormData = cleanEmptyStrings(formData) as Record<
      string,
      unknown
    >;
    let generatedRepId: number | null = null;

    try {
      // ==========================================
      // STEP 1: CREATE THE REPRESENTATIVE FIRST
      // ==========================================
      const repPayload: CreateRepresentativeQuery = {
        firstname: cleanedFormData.rep_firstname as string,
        middlename: cleanedFormData.rep_middlename as string,
        lastname: cleanedFormData.rep_lastname as string,
        relationship: cleanedFormData.rep_relationship as string,
        contactnumber: cleanedFormData.rep_contactnumber as string,
        address: cleanedFormData.rep_address as string,
        datecreated: new Date(),
      };

      const repResponse = await API.post('/representatives', repPayload);
      generatedRepId = repResponse.data.data.representativeid;

      if (!generatedRepId) {
        throw new Error(
          'Representative created but no ID returned — check backend response shape',
        );
      }

      // ==========================================
      // STEP 2: CREATE THE DECEASED RECORD
      // ==========================================
      const recordPayload: CreateDeceasedRecordQuery = {
        firstname: cleanedFormData.firstname as string,
        middlename: cleanedFormData.middlename as string | null,
        lastname: cleanedFormData.lastname as string,
        causeofdeath: cleanedFormData.causeofdeath as string | null,
        typeofdeath: cleanedFormData.typeofdeath as string | null,
        physicaldescription: cleanedFormData.physicaldescription as
          string | null,
        servicestatus: 'intake',
        hasmaturedlifeplan: false,
        plantype: cleanedFormData.planType === 'Life Plan' ? 'Life' : 'Direct',
        datecreated: new Date(),
        dateofdeath: cleanedFormData.dateofdeath
          ? new Date(cleanedFormData.dateofdeath as string)
          : null,
        managedby: null,
        representedby: generatedRepId,
      };

      await API.post('/deceasedrecords', recordPayload);

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
