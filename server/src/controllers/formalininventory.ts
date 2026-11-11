import { withTransaction } from '@/util/with-transaction';
import type { NextFunction, Request, Response } from 'express';

export const getFormalinInventory = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const inventory = await withTransaction(async (client) => {
      await client.query(
        `SELECT pg_advisory_xact_lock(hashtext('formalininventory'))`,
      );

      const result = await client.query(
        `
        SELECT formalinid, currentstock, minimumthreshold, date
        FROM formalininventory
        ORDER BY date DESC, formalinid DESC
        LIMIT 1
        `,
      );

      if (result.rows.length > 0) return result.rows[0];

      const initialized = await client.query(
        `
        INSERT INTO formalininventory (currentstock, minimumthreshold)
        VALUES (0, 0)
        RETURNING formalinid, currentstock, minimumthreshold, date
        `,
      );

      return initialized.rows[0];
    });

    res.json({ data: inventory });
  } catch (error) {
    next(error);
  }
};
