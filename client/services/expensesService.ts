import {
  getExpensesResponseSchema,
  type CreateExpenseQuery,
  type GetExpensesQuery,
} from 'shared';
import { API } from './api';

export async function getExpenses({
  page,
  limit,
  sortBy,
  sortOrder,
  search,
  signal,
}: GetExpensesQuery & {
  signal?: AbortSignal;
}) {
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  params.append('sortBy', sortBy);
  params.append('sortOrder', sortOrder);
  if (search) params.append('search', search);

  const result = await API.get(`/expenses?${params}`, {
    withCredentials: true,
    signal,
  });

  return getExpensesResponseSchema.parse(result.data);
}

export async function createExpense(data: CreateExpenseQuery) {
  const result = await API.post(`/expenses`, data, {
    withCredentials: true,
  });
  return result.data;
}
