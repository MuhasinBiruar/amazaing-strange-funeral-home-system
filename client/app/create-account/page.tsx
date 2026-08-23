"use client";

import { useState, useRef } from "react";
import Header from "../components/header/header";
import Footer from "../components/footer/footer";
import PageGuard from "../components/pageguard/page";
import { Toast } from "primereact/toast";
import "primereact/resources/themes/lara-light-cyan/theme.css";
import {
  NameInput,
  EmailInput,
  ContactNumberInput,
  PasswordInput,
  RoleInput,
  SystemRoleInput,
  ConfirmCreateModal,
} from "./components";

import { createStaff, type StaffPayload } from "../services/staffService";
import { User } from "lucide-react";

/**
 * Admin-only page for creating a new staff account.
 *
 * Renders a form (name, email, password, contact number, job role, and
 * system role) that, on submit, opens a confirmation modal summarizing
 * the entered data before actually creating the account. On confirm,
 * calls `createStaff` and shows a success toast with the generated
 * username and password, or surfaces a validation/server error message
 * on the form if creation fails.
 *
 * Wrapped in `PageGuard`, so access is restricted to authenticated (and
 * implicitly admin) users; the backend independently enforces
 * `requireAuth`/`requireAdmin` on the `/staff` POST endpoint as well.
 * 
 * @todo Consider adding a "reset form" button to clear the form after successful submission.
 * @todo Implement a way to hide the password in the success toast, e.g., by using a password strength indicator or a "show password" toggle.
 * 
 * @remarks The confirmation modal and success toast currently display
 * the staff member's password in plaintext, we need to review before shipping if
 * this is a concern for shoulder-surfing or screen-sharing.
 */
export default function CreateAccountPage() {
  const [errorMessage, setErrorMessage] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingStaffData, setPendingStaffData] = useState<StaffPayload | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toastCenter = useRef<Toast>(null);

  const emptyToNull = (v: FormDataEntryValue | null) =>
    v ? (v as string) : null;

  /**
   * Handles the form submission event.
   *
   * Prevents the default form submission behavior and collects the form data
   * into a `StaffPayload` object. Sets the pending staff data and shows the
   * confirmation modal.
   */
  function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const staffData = {
      firstName: formData.get("firstName") as string,
      middleName: emptyToNull(formData.get("middleName")),
      lastName: formData.get("lastName") as string,
      email: emptyToNull(formData.get("email")),
      contactNumber: emptyToNull(formData.get("contactNumber")),
      jobRole: emptyToNull(formData.get("jobRole")),
      role: role,
      password: formData.get("password") as string,
    };

    setPendingStaffData(staffData);
    setErrorMessage("");
    setShowConfirm(true); // open modal instead of submitting immediately
  }
  /**
   * Confirms and submits the pending staff creation request.
   *
   * Sends `pendingStaffData` to the backend via `createStaff`. On success,
   * shows a sticky toast with the generated username and the password the
   * admin entered, then closes the confirmation modal. On failure, surfaces
   * the error message on the form and closes the modal so it's visible.
   * No-ops if there is no pending staff data.
   *
   * @todo object destructuring when accessing and using properties.
   * implement const {username} = res.data.user;
   *
   * @remarks Displays the plaintext password in the toast — review before
   * shipping if this is a concern for shoulder-surfing/screen-sharing.
   */

  async function handleConfirmCreate() {
    if (!pendingStaffData) return;
    setIsSubmitting(true);
    try {
      await createStaff(pendingStaffData).then((res) => {
        console.log("Staff account created successfully:", res);
        const username = res.data.user.username;
        const { password } = pendingStaffData;
        toastCenter.current?.show({
          severity: "success",
          summary: "Account Created",
          detail: (
            <div>
              <div>Username: {username}</div>
              <div>Password: {password}</div>
            </div>
          ),
          sticky: true,
        });
      });
      setShowConfirm(false);
    } catch (error) {
      setErrorMessage(
        (error as Error).message ?? "Something went wrong. Please try again.",
      );
      setShowConfirm(false); // close modal so the error is visible on the form
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <PageGuard>
      <Toast ref={toastCenter} position="center" />
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 space-y-6">
          <form
            onSubmit={handleFormSubmit}
            className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4"
          >
            <div className="flex items-center gap-2 mb-4 text-gray-900">
              <User size={20} />
              <h2 className="text-lg font-bold">Create Worker Account</h2>
            </div>

            <div className="space-y-2">
              <NameInput />
              <EmailInput />
              <PasswordInput />
              <ContactNumberInput />
              <SystemRoleInput role={role} onRoleChange={setRole} />
              <RoleInput />
            </div>
            <span className="text-red-700 font-bold text-xs">
              {errorMessage}
            </span>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition hover:cursor-pointer"
            >
              Create Account
            </button>
          </form>
          {showConfirm && pendingStaffData && (
            <ConfirmCreateModal
              staffData={pendingStaffData}
              isSubmitting={isSubmitting}
              onCancel={() => setShowConfirm(false)}
              onConfirm={handleConfirmCreate}
            />
          )}
        </main>
        <Footer />
      </div>
    </PageGuard>
  );
}
