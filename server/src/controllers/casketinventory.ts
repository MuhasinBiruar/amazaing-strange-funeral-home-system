import pool from '@/db';
import { BadRequestError, NotFoundError } from '@/errors';
import { withTransaction } from '@/util/with-transaction';
import type { NextFunction, Request, Response } from 'express';
import {
  getPaginatedCasketInventoryQuerySchema,
  type CreateCasketInventoryQuery,
  type UpdateCasketInventoryQuery,
} from 'shared';
import type { IdParam } from 'shared/utils';
import * as CasketInventoryModel from '@/model/casketinventory';

export const getCasketInventory = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await pool.query(
      'SELECT * FROM casketinventory ORDER BY caskettier, caskettype',
    );

    res.json({
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

export const getPaginatedCasketInventory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsed = getPaginatedCasketInventoryQuerySchema.parse(req.query);

    const { dataResult, countResult } =
      await CasketInventoryModel.getPaginatedCasketInventory(parsed);

    const { total } = countResult.rows[0];
    res.json({
      data: dataResult.rows,
      meta: {
        total,
        page: parsed.page,
        limit: parsed.limit,
        totalPages: Math.ceil(total / parsed.limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Adds a casket to inventory. It starts with no stock; stock is added by
 * recording a delivery.
 */
export const createCasketInventory = async (
  req: Request<{}, {}, CreateCasketInventoryQuery>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsed = req.body;
    await CasketInventoryModel.assertCasketNameAvailable(parsed.caskettype);

    const result = await pool.query(
      `INSERT INTO casketinventory (
        caskettype,
        caskettier,
        currentstock,
        minimumthreshold
      ) VALUES ($1, $2, 0, $3) RETURNING *`,
      [parsed.caskettype, parsed.caskettier, parsed.minimumthreshold],
    );

    res.locals.auditAction = `${res.locals.session.user.name} added ${parsed.caskettype} (${parsed.caskettier}) to casket inventory`;
    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all packages for a specific casket.
 */
export const getPackagesOfCasket = async (
  req: Request<IdParam>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await pool.query(
      `
      SELECT
        p.packageid,
        p.casketid,
        p.packagename,
        p.packagetype,
        p.price,
        p.embalmingperiod,
        p.inclusions,
        c.caskettype,
        c.currentstock AS casket_currentstock
      FROM package AS p
      JOIN casketinventory AS c
        ON c.casketid = p.casketid
        WHERE p.casketid = $1
        ORDER BY p.packageid;`,
      [id],
    );
    res.json({
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

export const getDeliveryHistoryOfCasket = async (
  req: Request<IdParam>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await pool.query(
      `
      SELECT
        c.deliveryid,
        c.deliverydate,
        c.quantityreceived,
        c.totalamountpaid,
        c.deliverydate,
        cc.caskettype
      FROM casketdelivery AS c
      JOIN casketinventory AS cc
        ON c.casketid = cc.casketid
      WHERE c.casketid = $1
      ORDER BY c.deliverydate DESC;`,
      [id],
    );
    res.json({
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Edits a casket's name, tier, or minimum threshold. Stock can't be edited
 * here; it only changes through deliveries and contracts.
 */
export const updateCasketInventory = async (
  req: Request<IdParam, {}, UpdateCasketInventoryQuery>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const parsed = req.body;

    if (Object.keys(parsed).length === 0)
      throw new BadRequestError('No fields provided for update.');

    if (parsed.caskettype !== undefined)
      await CasketInventoryModel.assertCasketNameAvailable(
        parsed.caskettype,
        Number(id),
      );

    const result = await pool.query(
      `
      UPDATE casketinventory SET
        caskettype = COALESCE($1, caskettype),
        caskettier = COALESCE($2, caskettier),
        minimumthreshold = COALESCE($3, minimumthreshold)
      WHERE casketid = $4
      RETURNING *`,
      [
        parsed.caskettype ?? null,
        parsed.caskettier ?? null,
        parsed.minimumthreshold ?? null,
        id,
      ],
    );

    if (result.rows.length === 0) throw new NotFoundError('Casket not found.');

    res.locals.auditAction = `${res.locals.session.user.name} edited casket ${result.rows[0].caskettype}`;
    res.json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

/**
 * Deletes a casket that nothing references yet (e.g. one added by mistake).
 */
export const deleteCasketInventory = async (
  req: Request<IdParam>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const caskettype = await withTransaction(async (client) => {
      const caskettype = await CasketInventoryModel.assertCasketCanBeDeleted(
        client,
        id,
      );

      await client.query('DELETE FROM casketinventory WHERE casketid = $1', [
        id,
      ]);

      return caskettype;
    });

    res.locals.auditAction = `${res.locals.session.user.name} deleted casket ${caskettype}`;
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};
