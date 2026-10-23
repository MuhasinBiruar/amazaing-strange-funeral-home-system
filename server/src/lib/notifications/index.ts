import pool from '@/db';
import { rules } from './rules';
import type { Rule } from './types';

const SWEEP_INTERVAL_MS = 2 * 60 * 1000;

async function applyRule(rule: Rule) {
  const candidates = await rule.collect();
  const keys = candidates.map((c) => c.dedupekey);

  if (candidates.length > 0) {
    // Only one unresolved notification is allowed per dedupe key.
    // If the condition was already notified, skip the duplicate.
    // Once resolved, the same condition can be notified again.
    await pool.query(
      `INSERT INTO notification (type, audience, title, message, caseid, link, dedupekey)
       SELECT $1, $2::text[], c.title, c.message, c.caseid, c.link, c.dedupekey
       FROM unnest($3::text[], $4::text[], $5::int[], $6::text[], $7::text[])
         AS c(title, message, caseid, link, dedupekey)
       ON CONFLICT (dedupekey) WHERE resolvedat IS NULL DO NOTHING`,
      [
        rule.type,
        rule.audience,
        candidates.map((c) => c.title),
        candidates.map((c) => c.message),
        candidates.map((c) => c.caseid),
        candidates.map((c) => c.link),
        keys,
      ],
    );
  }

  if (rule.resolvable) {
    if (rule.type === 'full_payment') {
      await pool.query(
        `UPDATE notification n
         SET resolvedat = now()
         FROM deceasedrecord dr
         WHERE n.caseid = dr.caseid
           AND n.type = $1
           AND n.resolvedat IS NULL
           AND dr.servicestatus = 'completed'`,
        [rule.type],
      );
    } else {
      await pool.query(
        `UPDATE notification SET resolvedat = now()
         WHERE type = $1 AND resolvedat IS NULL AND NOT (dedupekey = ANY($2::text[]))`,
        [rule.type, keys],
      );
    }
  }
}

/**
 * Re-evaluates every notification rule against the current database state,
 * creating notifications for newly-true conditions and resolving ones whose
 * condition has cleared.
 *
 * @remarks
 * Condition-based rather than event-based, so it doesn't matter which code
 * path changed the data (an API route, a seed script, or a manual edit in
 * Supabase) - the next sweep catches it.
 */
export async function runNotificationSweep() {
  for (const rule of rules) {
    try {
      await applyRule(rule);
    } catch (error) {
      console.error(`Notification rule "${rule.type}" failed:`, error);
    }
  }
}

let sweeping = false;
let sweepQueued = false;

/**
 * Fire-and-forget sweep, safe to call after any write. Overlapping calls are
 * coalesced into at most one follow-up run so a change made mid-sweep is never
 * missed.
 */
export function triggerNotificationSweep() {
  if (sweeping) {
    sweepQueued = true;
    return;
  }

  sweeping = true;
  void runNotificationSweep().finally(() => {
    sweeping = false;
    if (sweepQueued) {
      sweepQueued = false;
      triggerNotificationSweep();
    }
  });
}

/**
 * Runs a sweep now and then on a fixed interval, which is what drives the
 * time-based rules (payment reminders, the full-payment lookback window).
 */
export function startNotificationScheduler() {
  triggerNotificationSweep();
  setInterval(triggerNotificationSweep, SWEEP_INTERVAL_MS).unref();
}
