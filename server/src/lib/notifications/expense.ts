import pool from '@/db';
import type { ExpenseLog } from 'shared';
import { financialsLink, formatPeso } from './rules/helpers';

/**
 * Raises an `expense_recorded` notification for a new expense log entry
 * (an expense, or a casket/formalin delivery that cost something).
 *
 * @remarks
 * Event-based, unlike the swept rules: a new entry has no lasting condition to
 * re-check. It's resolved as soon as anyone who can see it reads it (see the
 * notifications routes), or by the sweep if the entry is deleted.
 * Never throws; a failed notification shouldn't fail the recording.
 */
export async function notifyExpenseRecorded(entry: {
  source: ExpenseLog['source'];
  id: number;
  description: string;
  amount: number;
  recordedby_name: string;
}) {
  if (!(entry.amount > 0)) return;

  try {
    await pool.query(
      `INSERT INTO notification (type, audience, title, message, link, dedupekey)
       VALUES ('expense_recorded', ARRAY['financial_page'], $1, $2, $3, $4)
       ON CONFLICT (dedupekey) WHERE resolvedat IS NULL DO NOTHING`,
      [
        'New expense recorded',
        `${entry.recordedby_name} recorded an expense of ${formatPeso(entry.amount)}: ${entry.description}.`,
        financialsLink('expenses', entry.description),
        `expense_recorded:${entry.source}:${entry.id}`,
      ],
    );
  } catch (error) {
    console.error('Failed to raise expense notification:', error);
  }
}
