import pool from '@/db';
import { BadRequestError, ForbiddenError, NotFoundError } from '@/errors';
import { triggerNotificationSweep } from '@/lib/notifications';
import type { Locals } from '@/types/controllers';
import { joinName, getRepresentativeName } from '@/util/audit-log';
import type { NextFunction, Request, Response } from 'express';
import type {
  CreateDeceasedRecordQuery,
  DeceasedRecord,
  UpdateDeceasedRecordQuery,
} from 'shared';
import type { IdParam } from 'shared/utils';

export const getDeceasedRecordById = async (
  req: Request<IdParam>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM deceasedrecord WHERE caseid = $1',
      [id],
    );
    if (result.rows.length === 0) throw new NotFoundError();

    res.json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const createDeceasedRecord = async (
  req: Request<{}, {}, CreateDeceasedRecordQuery>,
  res: Response<{}, Locals>,
  next: NextFunction,
) => {
  try {
    const parsed = req.body;
    const managedby = res.locals.session.user.id;
    const result = await pool.query<DeceasedRecord>(
      `
      INSERT INTO deceasedrecord (
        firstname,
        middlename,
        lastname,
        causeofdeath,
        typeofdeath,
        physicaldescription,
        servicestatus,
        hasmaturedlifeplan,
        plantype,
        datecreated,
        dateofdeath,
        managedby,
        representedby,
        hasadvanceddecomposition
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *;`,
      [
        parsed.firstname,
        parsed.middlename,
        parsed.lastname,
        parsed.causeofdeath,
        parsed.typeofdeath,
        parsed.physicaldescription,
        parsed.servicestatus,
        parsed.hasmaturedlifeplan,
        parsed.plantype,
        parsed.datecreated,
        parsed.dateofdeath,
        managedby,
        parsed.representedby,
        parsed.hasadvanceddecomposition ?? false,
      ],
    );

    triggerNotificationSweep();

    const deceasedName = joinName(
      parsed.firstname,
      parsed.middlename,
      parsed.lastname,
    );
    const repName = parsed.representedby
      ? await getRepresentativeName(parsed.representedby)
      : null;
    res.locals.auditAction = `${res.locals.session.user.name} created a new record in deceased record for ${
      repName ? `${deceasedName} & ${repName}` : deceasedName
    }`;

    res.status(201).json({
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

export const updateDeceasedRecord = async (
  req: Request<IdParam, {}, UpdateDeceasedRecordQuery, {}, Locals>,
  res: Response<{}, Locals>,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const parsed = req.body;
    const userId = res.locals.session.user.id;
    const role = res.locals.session.user.role;

    if (Object.keys(parsed).length === 0)
      throw new BadRequestError('No fields provided for update.');

    if (role !== 'admin' && role !== 'superadmin') {
      const checkResult = await pool.query(
        `SELECT managedby FROM deceasedrecord WHERE caseid = $1`,
        [id],
      );

      if (checkResult.rows.length === 0)
        throw new NotFoundError('Deceased record not found.');

      if (checkResult.rows[0].managedby !== userId)
        throw new ForbiddenError(
          'You do not have permission to modify this record.',
        );
    }

    const result = await pool.query<DeceasedRecord>(
      `
      UPDATE deceasedrecord SET
        firstname = COALESCE($1, firstname),
        middlename = COALESCE($2, middlename),
        lastname = COALESCE($3, lastname),
        causeofdeath = COALESCE($4, causeofdeath),
        typeofdeath = COALESCE($5, typeofdeath),
        physicaldescription = COALESCE($6, physicaldescription),
        servicestatus = COALESCE($7, servicestatus),
        hasmaturedlifeplan = COALESCE($8, hasmaturedlifeplan),
        plantype = COALESCE($9, plantype),
        datecreated = COALESCE($10, datecreated),
        dateofdeath = COALESCE($11, dateofdeath),
        representedby = COALESCE($12, representedby),
        hasadvanceddecomposition = COALESCE($13, hasadvanceddecomposition)
      WHERE caseid = $14
      RETURNING *`,
      [
        parsed.firstname ?? null,
        parsed.middlename ?? null,
        parsed.lastname ?? null,
        parsed.causeofdeath ?? null,
        parsed.typeofdeath ?? null,
        parsed.physicaldescription ?? null,
        parsed.servicestatus ?? null,
        parsed.hasmaturedlifeplan ?? null,
        parsed.plantype ?? null,
        parsed.datecreated ?? null,
        parsed.dateofdeath ?? null,
        parsed.representedby ?? null,
        parsed.hasadvanceddecomposition ?? null,
        id,
      ],
    );

    if (result.rows.length === 0)
      throw new NotFoundError('Deceased record not found.');

    triggerNotificationSweep();

    const updated = result.rows[0];
    const deceasedName = joinName(
      updated.firstname,
      updated.middlename,
      updated.lastname,
    );
    const repName = updated.representedby
      ? await getRepresentativeName(updated.representedby)
      : null;
    res.locals.auditAction = `${res.locals.session.user.name} updated the deceased record for ${
      repName ? `${deceasedName} & ${repName}` : deceasedName
    }`;

    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteDeceasedRecord = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params as unknown as IdParam;

    const result = await pool.query(
      'DELETE FROM deceasedrecord WHERE caseid = $1 RETURNING *',
      [id],
    );

    if (result.rows.length === 0) throw new NotFoundError();

    const deleted = result.rows[0];
    const deceasedName = joinName(
      deleted.firstname,
      deleted.middlename,
      deleted.lastname,
    );
    res.locals.auditAction = `${res.locals.session.user.name} deleted deceased record ${deceasedName}`;

    res.json({
      data: deleted,
    });
  } catch (error) {
    next(error);
  }
};
