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
function extractErrorMessage(data: unknown): string {
  if (typeof data !== "object" || data === null) {
    return "Something went wrong. Please try again.";
  }

  const body = data as TreeifiedError & SimpleError;

  if (body.errors?.properties) {
    const messages = Object.entries(body.errors.properties)
      .filter(([, info]) => info.errors?.length > 0)
      .map(([field, info]) => `${formatFieldName(field)}: ${info.errors[0]}`);

    if (messages.length) return messages.join(" | ");
  }

  return (
    body.error ?? body.message ?? "Something went wrong. Please try again."
  );
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
