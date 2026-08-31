import { FormEvent } from 'react';

export function useSubmitIntake(formData: any, clearDraft: () => void) {
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      // ==========================================
      // STEP 1: CREATE THE REPRESENTATIVE FIRST
      // ==========================================
      const repPayload = {
        firstname: formData.rep_firstname,
        middlename: formData.rep_middlename ?? '',
        lastname: formData.rep_lastname,
        relationship: formData.rep_relationship,
        contactnumber: formData.rep_contactnumber,
        address: formData.rep_address,
        datecreated: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      };

      const repResponse = await fetch('http://localhost:6543/representatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(repPayload),
      });

      if (!repResponse.ok) {
        const errorData = await repResponse.json();
        console.error('Representative creation failed:', errorData);
        throw new Error('Failed to create Representative');
      }

      const newRepresentative = await repResponse.json();
      const generatedRepId = newRepresentative.data.representativeid;

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

      const recordResponse = await fetch(
        'http://localhost:6543/deceasedrecords',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(recordPayload),
        },
      );

      if (!recordResponse.ok) {
        const errorData = await recordResponse.json();
        console.error('Deceased record creation failed:', errorData);
        throw new Error('Failed to create Deceased Record');
      }

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
