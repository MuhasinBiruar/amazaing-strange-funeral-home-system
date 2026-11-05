import {
  deletionResultResponseSchema,
  getDeletionsResponseSchema,
  type DeletionEntityType,
  type GetDeletionsQuery,
} from 'shared';
import { API } from './api';
import { toReadableError } from './utils/toReadableError';

/** Deleting cascades and adjusts stock, so allow more than the usual 8s. */
const DELETION_TIMEOUT_MS = 120_000;

export async function getDeletions({
  page,
  limit,
  sortBy,
  sortOrder,
  search,
  entitytype,
  startDate,
  endDate,
  signal,
}: Omit<GetDeletionsQuery, 'startDate'> & {
  startDate?: string | undefined;
  signal?: AbortSignal;
}) {
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  params.append('sortBy', sortBy);
  params.append('sortOrder', sortOrder);
  if (search) params.append('search', search);
  if (entitytype) params.append('entitytype', entitytype);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const result = await API.get(`/deletions?${params}`, {
    withCredentials: true,
    signal,
  });
  return getDeletionsResponseSchema.parse(result.data);
}

/** Moves selected rows to Deleted items (admins, at most 100 at once). */
export async function deleteRecords(
  entitytype: DeletionEntityType,
  ids: number[],
) {
  try {
    const result = await API.post(
      '/deletions',
      { entitytype, ids },
      { timeout: DELETION_TIMEOUT_MS },
    );
    return deletionResultResponseSchema.parse(result.data).data;
  } catch (error) {
    throw toReadableError(error, 'Could not delete. Try again.');
  }
}

/** Delete all: moves every listed row to Deleted items (superadmins). */
export async function deleteAllRecords(
  entitytype: DeletionEntityType,
  ids: number[],
  confirmation: string,
) {
  try {
    const result = await API.post(
      '/deletions/all',
      { entitytype, ids, confirmation },
      { timeout: DELETION_TIMEOUT_MS },
    );
    return deletionResultResponseSchema.parse(result.data).data;
  } catch (error) {
    throw toReadableError(error, 'Could not delete. Try again.');
  }
}

export async function restoreDeletions(deletionids: number[]) {
  try {
    const result = await API.post(
      '/deletions/restore',
      { deletionids },
      { timeout: DELETION_TIMEOUT_MS },
    );
    return deletionResultResponseSchema.parse(result.data).data;
  } catch (error) {
    throw toReadableError(error, 'Could not restore. Try again.');
  }
}
