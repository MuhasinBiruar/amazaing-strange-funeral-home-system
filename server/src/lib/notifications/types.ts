import type { AccessPage, NotificationType } from 'shared';

export interface Candidate {
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
  /**
   * Overrides how a resolvable rule's notifications are resolved. By default
   * any active notification whose key isn't among this sweep's candidates is.
   */
  resolve?: (keys: string[]) => Promise<void>;
  /**
   * Keeps an active notification's title, message and link in step with its
   * candidate (e.g. a low-stock count that keeps dropping) instead of leaving
   * what it was first raised with. It stays read if it was read.
   */
  refresh?: boolean;
  collect: () => Promise<Candidate[]>;
}
