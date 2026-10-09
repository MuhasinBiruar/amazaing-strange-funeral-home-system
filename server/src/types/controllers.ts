import type { auth } from '@/lib/auth';

export type Locals = {
  session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
  auditAction?: string;
};
