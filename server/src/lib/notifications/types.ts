import type { AccessPage, NotificationType } from 'shared';

interface Candidate {
  dedupekey: string;
  title: string;
  message: string;
  caseid: number | null;
  link: string | null;
}

export interface Rule {
  type: NotificationType;
  /** Access pages whose holders see this notification. Admins see all. */
  audience: AccessPage[];
  /**
   * Resolvable rules mark their active notifications resolved once the
   * condition no longer holds (e.g. a casket is restocked), which also re-arms
   * them to fire again if the condition comes back.
   */
  resolvable: boolean;
  collect: () => Promise<Candidate[]>;
}
