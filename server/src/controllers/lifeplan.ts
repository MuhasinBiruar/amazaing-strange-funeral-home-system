import pool from '@/db';
import { getDeceasedName } from '@/util/audit-log';
import type { NextFunction, Request, Response } from 'express';
import { getLifeplansQuerySchema, type CreateLifeplanQuery } from 'shared';
import * as LifeplanModel from '@/model/lifeplan';
import type { LifeplanAgentLocals } from '@/types/controllers';

export async function createLifeplan(
  req: Request<{}, {}, CreateLifeplanQuery>,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = req.body;
    const result = await pool.query(
      `
        INSERT INTO lifeplan (
          plannumber,
          planholdername,
          totalamount,
          caseid,
          companyid
        ) VALUES ($1, $2, $3, $4, $5) RETURNING planid;`,
      [
        parsed.plannumber,
        parsed.planholdername,
        parsed.totalamount,
        parsed.caseid,
        parsed.companyid,
      ],
    );

    const deceasedName = await getDeceasedName(parsed.caseid);
    res.locals.auditAction = `${res.locals.session.user.name} created a life plan for ${deceasedName}`;

    res.status(201).json({
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

async function getLifeplansInternal(
  req: Request,
  res: Response,
  next: NextFunction,
  forcedCompanyId?: number,
) {
  try {
    const parsed = getLifeplansQuerySchema.parse(req.query);

    const { dataResult, countResult } = await LifeplanModel.getLifeplans({
      ...parsed,
      // An agent's company always comes from their account, never the query string.
      companyid: forcedCompanyId ?? parsed.companyid,
    });

    const totalRecords = parseInt(countResult.rows[0].total, 10);
    res.json({
      data: dataResult.rows,
      meta: {
        total: totalRecords,
        page: parsed.page,
        limit: parsed.limit,
        totalPages: Math.ceil(totalRecords / parsed.limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

export const getLifeplans = (req: Request, res: Response, next: NextFunction) =>
  getLifeplansInternal(req, res, next);

export const getMyLifeplans = (
  req: Request,
  res: Response<{}, LifeplanAgentLocals>,
  next: NextFunction,
) => getLifeplansInternal(req, res, next, res.locals.agentCompanyId);
