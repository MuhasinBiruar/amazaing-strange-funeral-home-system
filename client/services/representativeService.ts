import { getRepresentativeResponseSchema } from 'shared';
import { API } from './api';

/**
 * Fetches a representative by id.
 *
 * @remarks
 * There is no `PATCH /representatives/:id` endpoint yet, so representative
 * info is read-only from the API's point of view — editing it in the UI is
 * currently local-only, not persisted.
 */
export async function getRepresentative(representativeid: number) {
  const response = await API.get(`/representatives/${representativeid}`);

  return getRepresentativeResponseSchema.parse(response.data).data;
}
