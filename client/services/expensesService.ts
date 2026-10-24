import {
  getExpenseLogResponseSchema,
  type CreateExpenseQuery,
  type GetExpenseLogQuery,
} from 'shared';
import { API } from './api';

/** General expenses plus the amounts paid for casket and formalin deliveries. */
export async function getExpenses({
  page,
  limit,
  sortBy,
  sortOrder,
  search,
  source,
  signal,
}: GetExpenseLogQuery & {
  signal?: AbortSignal;
}) {
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  params.append('sortBy', sortBy);
  params.append('sortOrder', sortOrder);
  if (search) params.append('search', search);
  if (source) params.append('source', source);

  const result = await API.get(`/expenses?${params}`, {
    withCredentials: true,
    signal,
  });

  return getExpenseLogResponseSchema.parse(result.data);
}

export async function createExpense(data: CreateExpenseQuery) {
  const result = await API.post(`/expenses`, data, {
    withCredentials: true,
  });
  return result.data;
}
