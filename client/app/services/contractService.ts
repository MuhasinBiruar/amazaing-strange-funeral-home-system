import type { GenericAbortSignal } from 'axios';
import { API } from './api';

// TODO: Move the folder out of client/app/ and into client/

export interface ContractSchema {
  contractid: number;
  signeddate: string;
  burialdatedeadline: string;
  totalamount: number;
  embalmingperiod: number;
  inclusions: string | null;
  caseid: number;
  packageid: number;
}

export interface PaginatedContractsResponse {
  data: ContractSchema[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export async function getPaginatedContracts(
  search: string,
  sortBy: string,
  sortDir: string,
  page: number,
  limit: number,
  settings: Partial<{
    signal: GenericAbortSignal;
  }> = {},
) {
  const params = new URLSearchParams({
    search,
    sortBy,
    sortDir,
    page: String(page),
    limit: String(limit),
  });

  const res = await API.get(
    `${process.env.NEXT_PUBLIC_API_URL}/contracts?${params.toString()}`,
    {
      withCredentials: true,
      signal: settings.signal,
    },
  );
  return res.data as PaginatedContractsResponse;
}
