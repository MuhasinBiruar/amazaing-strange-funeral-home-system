import { FormEvent } from 'react';
import { API } from '@/services/api';

export function useSubmitIntake(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formData: Record<string, any>,
  clearDraft: () => void,
) {
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    let generatedRepId = null;

    try {
      // ==========================================
      // STEP 1: CREATE THE REPRESENTATIVE FIRST
      // ==========================================
      const repPayload = {
        firstname: formData.rep_firstname,
        middlename: formData.rep_middlename,
        lastname: formData.rep_lastname,
        relationship: formData.rep_relationship,
        contactnumber: formData.rep_contactnumber,
        address: formData.rep_address,
        datecreated: new Date().toISOString().split('T')[0],
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
      const recordPayload = {
        ...formData,
        servicestatus: 'intake',
        hasmaturedlifeplan: false,
        plantype: formData.planType === 'Life Plan' ? 'Life' : 'Direct',
        datecreated: new Date().toISOString().split('T')[0],
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
      if (generatedRepId) {
        console.warn('Rolling back: Deleting orphaned representative...');
        await API.delete(`/representatives/${generatedRepId}`).catch(
          (deleteErr) => {
            console.error(
              'Failed to clean up orphaned representative:',
              deleteErr,
            );
          },
        );
      }

      console.error('Submission failed:', error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.error('Backend error details:', (error as any).response?.data);
      alert('Failed to save the record. Check the console.');
    }
  };

  return { handleSubmit };
}
