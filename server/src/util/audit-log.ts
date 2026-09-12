import pool from '@/db';

/**
 * Inserts one audit log entry. `auditlogid` and `actiondate` are filled in by
 * the database (serial PK, `CURRENT_TIMESTAMP` default).
 */
export async function writeAuditLog(
  staffid: string,
  action: string,
): Promise<void> {
  await pool.query('INSERT INTO auditlog (staffid, action) VALUES ($1, $2)', [
    staffid,
    action,
  ]);
}

/**
 * Looks up a deceased record's full name by case id, for audit descriptions.
 *
 * @remarks
 * Never throws — a lookup failure falls back to identifying the case by
 * number rather than jeopardizing the response for the request that
 * triggered it. Audit description text is best-effort by design.
 */
export async function getDeceasedName(caseid: number): Promise<string> {
  try {
    const result = await pool.query(
      `SELECT CONCAT_WS(' ', NULLIF(firstname, ''), NULLIF(middlename, ''), NULLIF(lastname, '')) AS name
       FROM deceasedrecord WHERE caseid = $1`,
      [caseid],
    );
    return result.rows[0]?.name || `case #${caseid}`;
  } catch (error) {
    console.error('Failed to look up deceased name for audit log:', error);
    return `case #${caseid}`;
  }
}

/**
 * Looks up a representative's full name by id, for audit descriptions. Same
 * never-throws contract as {@link getDeceasedName}.
 */
export async function getRepresentativeName(
  representativeid: number,
): Promise<string> {
  try {
    const result = await pool.query(
      `SELECT CONCAT_WS(' ', NULLIF(firstname, ''), NULLIF(middlename, ''), NULLIF(lastname, '')) AS name
       FROM representative WHERE representativeid = $1`,
      [representativeid],
    );
    return result.rows[0]?.name || `representative #${representativeid}`;
  } catch (error) {
    console.error(
      'Failed to look up representative name for audit log:',
      error,
    );
    return `representative #${representativeid}`;
  }
}

/** Joins name parts, skipping empty/nullish ones. */
export function joinName(
  ...parts: (string | null | undefined)[]
): string {
  return parts.filter((part) => part && part.trim() !== '').join(' ');
}
