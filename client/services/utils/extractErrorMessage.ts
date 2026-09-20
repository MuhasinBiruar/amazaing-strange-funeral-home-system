import type { AppErrorResponse } from 'shared';

export function extractErrorMessage(data: AppErrorResponse): string {
  const details = data.error.details;

  // Format array of field-specific errors if available
  if (Array.isArray(details) && details.length > 0) {
    const map = new Map<string, string[]>();

    for (const { field = '', message } of details) {
      const existing = map.get(field);
      if (existing) {
        existing.push(message);
      } else {
        map.set(field, [message]);
      }
    }

    return Array.from(map.entries())
      .map(([field, messages]) =>
        field ? `${field}: ${messages.join(', ')}` : messages.join(', '),
      )
      .join('; ');
  }

  return data.error.message;
}
