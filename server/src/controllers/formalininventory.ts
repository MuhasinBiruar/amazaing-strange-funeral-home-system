import pool from '@/db';
import { NotFoundError } from '@/errors';
import type { NextFunction, Request, Response } from 'express';

export const getFormalinInventory = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await pool.query(
      `
      SELECT formalinid, currentstock, minimumthreshold, date
      FROM formalininventory
      ORDER BY date DESC, formalinid DESC
      LIMIT 1
    `,
    );

    if (result.rows.length === 0)
      throw new NotFoundError('Formalin inventory has not been initialized.');

    res.json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};
