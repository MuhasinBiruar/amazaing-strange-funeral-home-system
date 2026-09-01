import { FormEvent } from 'react';
import { API } from '@/services/api';

export function useSubmitIntake(formData: any, clearDraft: () => void) {
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

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
      const generatedRepId = repResponse.data.data.representativeid;

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
      console.error('Submission failed:', error);
      alert('Failed to save the record. Check the console.');
    }
  };

  return { handleSubmit };
}
