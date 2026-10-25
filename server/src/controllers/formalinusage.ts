import { BadRequestError, NotFoundError } from '@/errors';
import { withRepeatableRead } from '@/util/with-repeatable-read';
import { withTransaction } from '@/util/with-transaction';
import type { NextFunction, Request, Response } from 'express';
import {
  getFormalinUsageBreakdownQuerySchema,
  getFormalinUsageSummaryQuerySchema,
  type CreateFormalinUsage,
  type CreateFormalinUsageResponse,
} from 'shared';
import { paginationQuerySchema, type PaginatedResponse } from 'shared/utils';

function getWarning(currentstock: number, minimumthreshold: number) {
  if (currentstock <= minimumthreshold)
    return `Formalin stock has reached the minimum threshold (${currentstock} liters remaining).`;

  return null;
}

export const createFormalinUsage = async (
  req: Request<{}, {}, CreateFormalinUsage>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsed = req.body;
    const result = await withTransaction(async (client) => {
      const inventoryResult = await client.query(
        `
          SELECT formalinid, currentstock, minimumthreshold
          FROM formalininventory
          WHERE formalinid = $1
          FOR UPDATE
        `,
        [parsed.formalinid],
      );

      if (inventoryResult.rows.length === 0)
        throw new NotFoundError(
          'Referenced formalin inventory item does not exist.',
        );

      const inventory = inventoryResult.rows[0];
      const currentStock = Number(inventory.currentstock);
      if (parsed.quantityused > currentStock)
        throw new BadRequestError('Please update the stock first.');

      const caseResult = await client.query(
        `SELECT plantype FROM deceasedrecord WHERE caseid = $1`,
        [parsed.caseid],
      );
      if (caseResult.rows.length === 0)
        throw new NotFoundError('Referenced case does not exist.');

      const usageResult = await client.query(
        `
          INSERT INTO formalinusage (
            quantityused,
            casetype,
            caseid,
            formalinid
          ) VALUES ($1, $2, $3, $4)
          RETURNING usageid, quantityused, usagedate, casetype, caseid, formalinid
        `,
        [
          parsed.quantityused,
          caseResult.rows[0].plantype,
          parsed.caseid,
          parsed.formalinid,
        ],
      );

      const updatedStock = currentStock - parsed.quantityused;
      const inventoryInsert = await client.query(
        `
          INSERT INTO formalininventory (currentstock, minimumthreshold)
          VALUES ($1, $2)
          RETURNING currentstock, minimumthreshold
        `,
        [updatedStock, parsed.minimumthreshold],
      );

      return {
        usage: usageResult.rows[0],
        inventory: inventoryInsert.rows[0],
        warning: getWarning(updatedStock, parsed.minimumthreshold),
      };
    });

    res.locals.auditAction = `${res.locals.session.user.name} recorded ${parsed.quantityused} liters of formalin usage for case ${parsed.caseid}`;
    res.status(201).json({
      data: {
        usage: result.usage,
        inventory: result.inventory,
      },
      meta: {
        warning: result.warning,
      },
    } satisfies CreateFormalinUsageResponse);
  } catch (error) {
    next(error);
  }
};

export const getFormalinUsage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { page, limit } = paginationQuerySchema.parse(req.query);
    const [dataResult, countResult] = await withRepeatableRead(async (client) =>
      Promise.all([
        client.query(
          `
            SELECT usageid, quantityused, usagedate, casetype, caseid, formalinid
            FROM formalinusage
            ORDER BY usagedate DESC, usageid DESC
            LIMIT $1 OFFSET $2
          `,
          [limit, (page - 1) * limit],
        ),
        client.query('SELECT COUNT(*)::int AS total FROM formalinusage'),
      ]),
    );

    const { total } = countResult.rows[0];
    res.json({
      data: dataResult.rows,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    } satisfies PaginatedResponse<typeof dataResult.rows>);
  } catch (error) {
    next(error);
  }
};

export const getFormalinUsageSummary = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { page, limit, startDate, endDate, sortBy, sortOrder } =
      getFormalinUsageSummaryQuerySchema.parse(req.query);

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (startDate) {
      conditions.push(`usagedate >= $${paramIndex}::date`);
      params.push(startDate.toISOString().slice(0, 10));
      paramIndex++;
    }
    if (endDate) {
      conditions.push(`usagedate < $${paramIndex}::date + INTERVAL '1 day'`);
      params.push(String(endDate).slice(0, 10));
      paramIndex++;
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const sortColumn =
      sortBy === 'totalquantityused' ? 'totalquantityused' : 'usagedate';
    const direction = sortOrder === 'asc' ? 'ASC' : 'DESC';
    const pagination = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    const [dataResult, countResult] = await withRepeatableRead((client) =>
      Promise.all([
        client.query(
          `
            SELECT TO_CHAR(usagedate::date, 'YYYY-MM-DD') AS usagedate,
                   SUM(quantityused)::float8 AS totalquantityused
            FROM formalinusage
            ${whereClause}
            GROUP BY usagedate::date
            ORDER BY ${sortColumn} ${direction}, usagedate DESC
            ${pagination}
          `,
          [...params, limit, (page - 1) * limit],
        ),
        client.query(
          `
            SELECT COUNT(*)::int AS total
            FROM (
              SELECT usagedate::date
              FROM formalinusage
              ${whereClause}
              GROUP BY usagedate::date
            ) AS grouped_usage
          `,
          params,
        ),
      ]),
    );

    const total = countResult.rows[0].total;
    res.json({
      data: dataResult.rows,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

export const getFormalinUsageBreakdown = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { page, limit, startDate, endDate, sortBy, sortOrder } =
      getFormalinUsageBreakdownQuerySchema.parse(req.query);
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (startDate) {
      conditions.push(`usagedate >= $${paramIndex}::date`);
      params.push(startDate.toISOString().slice(0, 10));
      paramIndex++;
    }
    if (endDate) {
      conditions.push(`usagedate < $${paramIndex}::date + INTERVAL '1 day'`);
      params.push(String(endDate).slice(0, 10));
      paramIndex++;
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';
    const sortColumnMap = {
      usageid: 'usageid',
      quantityused: 'quantityused',
      usagedate: 'usagedate',
      casetype: 'casetype',
    } as const;
    const direction = sortOrder === 'asc' ? 'ASC' : 'DESC';
    const paginationParams = [...params, limit, (page - 1) * limit];
    const pagination = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    const [dataResult, countResult] = await withRepeatableRead((client) =>
      Promise.all([
        client.query(
          `
            SELECT usageid, quantityused, usagedate, casetype, caseid, formalinid
            FROM formalinusage
            ${whereClause}
            ORDER BY ${sortColumnMap[sortBy]} ${direction}, usageid DESC
            ${pagination}
          `,
          paginationParams,
        ),
        client.query(
          `SELECT COUNT(*)::int AS total FROM formalinusage ${whereClause}`,
          params,
        ),
      ]),
    );

    const total = countResult.rows[0].total;
    res.json({
      data: dataResult.rows,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};
