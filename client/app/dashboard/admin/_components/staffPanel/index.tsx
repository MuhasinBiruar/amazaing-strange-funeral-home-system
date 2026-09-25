'use client';

import { useEffect, useState, type SubmitEvent } from 'react';
import { Loader2 } from 'lucide-react';
import {
  createStaff,
  getStaffDetail,
  updateStaff,
} from '@/services/staffService';
import emptyToNull from '@/utils/emptyToNull';
import NameFields from './fields/nameFields';
import ContactFields from './fields/contactFields';
import CredentialsFields from './fields/credentialsFields';
import RoleFields from './fields/roleFields';
import AccessFields from './fields/accessFields';
import CreatedCredentials from './createdCredentials';
import {
  emptyForm,
  type ValidationErrors,
  type FormState,
  type PanelMode,
  type UpdateField,
} from './types';
import { toForm } from './toForm';
import { validateFields } from './validateFields';
import { isObjectEmpty } from 'shared/utils';
import type { useInfoModal } from '@/components/infoModal/useInfoModal';
import LoadingButton from '@/components/loadingButton';
import SidePanel from '@/components/sidePanel';
import { useSidePanel } from '@/components/sidePanel/useSidePanel';

export default function StaffPanel({
  mode,
  staffId,
  onClose,
  onSave,
  showInfo,
}: {
  mode: PanelMode;
  staffId: string | null;
  onClose: () => void;
  onSave: () => void;
  showInfo: ReturnType<typeof useInfoModal>['showInfo'];
}) {
  const { isShown, requestClose } = useSidePanel(onClose);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [createdCreds, setCreatedCreds] = useState<{
    username: string;
    password: string;
  } | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setErrors({});
    setCreatedCreds(null);

    if (mode === 'create') {
      setForm(emptyForm());
      setIsLoading(false);
      return;
    }

    if (!staffId) return;
    const controller = new AbortController();
    setIsLoading(true);

    const loadStaffDetail = async () => {
      try {
        const detail = await getStaffDetail(staffId);
        if (controller.signal.aborted) return;
        setForm(toForm(detail));
      } catch (err) {
        if (controller.signal.aborted) return;

        console.error('Failed to load staff details:', err);
        await showInfo({
          title: 'Load Error',
          message: 'Could not load this staff member.',
          severity: 'error',
        });
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    loadStaffDetail();

    return () => controller.abort();
  }, [mode, staffId, showInfo]);

  const updateField: UpdateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();

    const errors = await validateFields(form, mode);
    setErrors(errors);
    if (!isObjectEmpty(errors)) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'create') {
        const res = await createStaff({
          firstName: form.firstName,
          middleName: emptyToNull(form.middleName),
          lastName: form.lastName,
          contactNumber: emptyToNull(form.contactNumber),
          jobRole: emptyToNull(form.jobRole),
          role: form.role,
          password: form.password,
          isActive: form.isActive,
          access: form.access,
        });
        setCreatedCreds({
          username: res.data.user.username,
          password: form.password,
        });
      } else if (mode === 'edit' && staffId) {
        await updateStaff(staffId, {
          firstName: form.firstName,
          middleName: emptyToNull(form.middleName),
          lastName: form.lastName,
          contactNumber: emptyToNull(form.contactNumber),
          username: form.username,
          jobRole: emptyToNull(form.jobRole) ?? 'staff',
          role: form.role,
          isActive: form.isActive,
          password: form.password || undefined,
          access: form.access,
        });
        onSave();
        onClose();
      }
    } catch (err) {
      console.error('Failed to submit form:', err);
      await showInfo({
        title: 'Submission Failed',
        message: 'Something went wrong. Please try again.',
        severity: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SidePanel
      shown={isShown}
      onRequestClose={requestClose}
      ariaLabel={
        mode === 'create' ? 'Create staff account' : 'Edit staff account'
      }
      title={mode === 'create' ? 'Create Staff Account' : 'Edit Staff Account'}
    >
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-10">
            <Loader2 size={16} className="animate-spin" />
            Loading...
          </div>
        ) : createdCreds ? (
          <CreatedCredentials
            username={createdCreds.username}
            password={createdCreds.password}
            onDone={() => {
              onSave();
              onClose();
            }}
          />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <NameFields form={form} onChange={updateField} errors={errors} />
            <ContactFields
              contactNumber={form.contactNumber}
              onChange={updateField}
              errors={errors}
            />
            <CredentialsFields
              mode={mode}
              username={form.username}
              password={form.password}
              onChange={updateField}
              errors={errors}
            />
            <RoleFields
              jobRole={form.jobRole}
              role={form.role}
              isActive={form.isActive}
              onChange={updateField}
              errors={errors}
            />
            <AccessFields
              access={form.access}
              onToggle={(key) => {
                setForm((prev) => ({
                  ...prev,
                  access: { ...prev.access, [key]: !prev.access[key] },
                }));
              }}
            />

            <LoadingButton
              type="submit"
              isLoading={isSubmitting}
              label={mode === 'create' ? 'Create Account' : 'Save Changes'}
              loadingLabel="Saving..."
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 cursor-pointer"
            />
          </form>
        )}
      </div>
    </SidePanel>
  );
}
