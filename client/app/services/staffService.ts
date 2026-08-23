import { API } from "./api";
import axios from "axios";
interface Staff {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  contactNumber?: string | null;
  password: string;
  role?: "admin" | "user";
}

export const getStaff = async (username: string) => {
  try {
    const res = await API.get(`/staff/${username}`);
    return res.data;
  } catch (error) {
    console.error("Error fetching staff:", error);
    throw error;
  }
};

export class StaffValidationError extends Error {
  fieldErrors: Record<string, string>;
  constructor(fieldErrors: Record<string, string>) {
    super("Validation failed");
    this.fieldErrors = fieldErrors;
  }
}

interface TreeifiedError {
  message?: string;
  errors?: {
    properties?: Record<string, { errors: string[] }>;
  };
}

interface SimpleError {
  error?: string;
  message?: string;
}

function formatFieldName(field: string): string {
  return field
    .replace(/([A-Z])/g, " $1") // insert a space before every capital letter
    .trim()
    .toUpperCase(); // then uppercase the whole thing
}
interface BetterAuthError {
  error?: {
    code?: string;
    message?: string;
    details?: { field: string; message: string }[];
  };
}

/**
 * Extracts a human-readable error message from a failed `/staff` API
 * response body.
 *
 * The `/staff` endpoint can reject a request at three different layers,
 * each with its own response shape:
 * 1. better-auth's internal `additionalFields` validation —
 *    `{ error: { code, message, details: [{ field, message }] } }`
 * 2. Zod's `validate` middleware (`treeifyError` output) —
 *    `{ message, errors: { properties: { [field]: { errors: string[] } } } }`
 * 3. Manual route checks (e.g. duplicate name/username) —
 *    `{ error: string }`
 *
 * This function checks each shape in turn and formats field-level errors
 * as `"FIELD NAME: message"`, joining multiple with `" | "`. Falls back
 * to a generic message if none of the known shapes match.
 *
 * @param data - The parsed response body from a failed request. Typed as
 * `unknown` since it comes from an untrusted HTTP response.
 * @returns A single display-ready error string.
 */
function extractErrorMessage(data: unknown): string {
  if (typeof data !== "object" || data === null) {
    return "Something went wrong. Please try again.";
  }

  const body = data as TreeifiedError & { error?: unknown; message?: string };

  // Case 1: better-auth shape — { error: { code, message, details: [{field, message}] } }
  if (
    typeof body.error === "object" &&
    body.error !== null &&
    "details" in body.error &&
    Array.isArray((body.error as BetterAuthError["error"])?.details)
  ) {
    const details = (body.error as BetterAuthError["error"])!.details!;
    const messages = details.map(
      (d) => `${formatFieldName(d.field)}: ${d.message}`,
    );
    if (messages.length) return messages.join(" | ");
  }

  // Case 2: validate.ts — treeifyError shape
  if (body.errors?.properties) {
    const messages = Object.entries(body.errors.properties)
      .filter(([, info]) => info.errors?.length > 0)
      .map(([field, info]) => `${formatFieldName(field)}: ${info.errors[0]}`);
    if (messages.length) return messages.join(" | ");
  }

  // Case 3: manual route checks — { error: string }
  if (typeof body.error === "string") {
    return body.error;
  }

  // Case 4: fallback
  if (typeof body.message === "string") {
    return body.message;
  }

  return "Something went wrong. Please try again.";
}

export interface StaffPayload {
  firstName: string;
  middleName: string | null;
  lastName: string;
  email: string | null;
  contactNumber: string | null;
  jobRole: string | null;
  role: "admin" | "user";
  password: string;
}

export const createStaff = async (staffData: Staff) => {
  try {
    const res = await API.post("/staff", staffData);
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      throw new Error(extractErrorMessage(error.response.data)); // rethrow with the real message
    }
    throw error;
  }
};
