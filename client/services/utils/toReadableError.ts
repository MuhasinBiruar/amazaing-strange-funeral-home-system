import axios from 'axios';
import { extractErrorMessage } from './extractErrorMessage';

/**
 * Turns a failed API call into an `Error` carrying the server's (field-level)
 * message, or `fallback` when the server didn't send one.
 */
export function toReadableError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error) && error.response?.data?.error?.message) {
    return new Error(extractErrorMessage(error.response.data));
  }
  return new Error(fallback);
}
