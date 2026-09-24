'use client';

import { useEffect, useState, type SubmitEvent } from 'react';
import { Sidebar } from 'primereact/sidebar';
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
import type { useInfoModal } from '@/hooks/useInfoModal';
import LoadingButton from '@/components/loadingButton';

export default function StaffPanel({
  mode,
  staffId,
  isVisible,
  onClose,
  onSave,
  showInfo,
}: {
  mode: PanelMode;
  staffId: string | null;
  isVisible: boolean;
  onClose: () => void;
  onSave: () => void;
  showInfo: ReturnType<typeof useInfoModal>['showInfo'];
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isLoading, setIsLoading] = useState(mode === 'edit');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [createdCreds, setCreatedCreds] = useState<{
    username: string;
    password: string;
  } | null>(null);

  useEffect(() => {
    if (!isVisible) return;

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
  }, [isVisible, mode, staffId, showInfo]);

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
    <Sidebar
      visible={isVisible}
      onHide={onClose}
      position="right"
      className="w-full sm:w-md"
      maskClassName="inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300"
      transitionOptions={{
        timeout: 300,
        classNames: {
          enter:
            'transform transition-transform duration-300 ease-out -translate-x-full',
          enterActive: 'transform translate-x-0',
          exit: 'transform transition-transform duration-300 ease-in translate-x-0',
          exitActive: 'transform -translate-x-full',
        },
      }}
    >
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        {mode === 'create' ? 'Create Staff Account' : 'Edit Staff Account'}
      </h2>

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
    </Sidebar>
  );
}
