import { Router, type Request, type Response, type NextFunction } from 'express';
import pool from '@/db';
import requireAuth from '@/middleware/require-auth';
import validate from '@/middleware/validate';
import {
  createInventoryAuditQuerySchema,
  getInventoryAuditsQuerySchema,
  updateInventoryAuditQuerySchema,
  type CreateInventoryAuditQuery,
  type UpdateInventoryAuditQuery,
} from 'shared';
import { NotFoundError, ConflictError } from '@/errors';
import { triggerNotificationSweep } from '@/lib/notifications';
import { formatPhilippineDateTime } from '@/util/format';

const router = Router();
const TARGET_SQL = `CASE WHEN ia.formalinid IS NOT NULL
  THEN 'Formalin stock'
  ELSE CONCAT('Casket: ', ci.caskettype) END`;
const AUDIT_SELECT = `SELECT ia.auditid, ia.auditdate, ia.hasdiscrepancy,
  ia.formalinid, ia.casketid, ${TARGET_SQL} AS targetname,
  CASE WHEN ia.formalinid IS NOT NULL THEN fi.currentstock
       ELSE ci.currentstock END AS currentstock
  FROM inventoryaudit ia
  LEFT JOIN casketinventory ci ON ci.casketid = ia.casketid
  LEFT JOIN formalininventory fi ON fi.formalinid = ia.formalinid`;

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { page, limit, search, targetType, sortBy, sortOrder } =
      getInventoryAuditsQuerySchema.parse(req.query);
    const sortColumns = {
      auditdate: 'ia.auditdate',
      targetname: 'targetname',
      currentstock: 'currentstock',
      hasdiscrepancy: 'ia.hasdiscrepancy',
    } as const;
    const params: unknown[] = [];
    const conditions = [
      targetType === 'formalin'
        ? 'ia.formalinid IS NOT NULL'
        : 'ia.casketid IS NOT NULL',
    ];
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`${TARGET_SQL} ILIKE $${params.length}`);
    }
    const where = `WHERE ${conditions.join(' AND ')}`;
    const from = `FROM inventoryaudit ia
      LEFT JOIN casketinventory ci ON ci.casketid = ia.casketid
      LEFT JOIN formalininventory fi ON fi.formalinid = ia.formalinid`;
    const result = await pool.query(
      `SELECT ia.auditid, ia.auditdate, ia.hasdiscrepancy, ia.formalinid, ia.casketid,
          ${TARGET_SQL} AS targetname,
          CASE WHEN ia.formalinid IS NOT NULL THEN fi.currentstock
               ELSE ci.currentstock END AS currentstock
       ${from} ${where}
       ORDER BY ${sortColumns[sortBy]} ${sortOrder === 'asc' ? 'ASC' : 'DESC'}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, (page - 1) * limit],
    );
    const count = await pool.query(
      `SELECT COUNT(*)::int AS total ${from} ${where}`,
      params,
    );
    const total = count.rows[0].total;
    res.json({
      data: result.rows,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/',
  requireAuth,
  validate(createInventoryAuditQuerySchema),
  async (
    req: Request<{}, {}, CreateInventoryAuditQuery>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const parsed = req.body;
      const result = await pool.query(
        `INSERT INTO inventoryaudit
          (auditdate, hasdiscrepancy, formalinid, casketid)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [parsed.auditdate, parsed.hasdiscrepancy, parsed.formalinid, parsed.casketid],
      );
      triggerNotificationSweep();
      const audit = await pool.query(
        `${AUDIT_SELECT} WHERE ia.auditid = $1`,
        [result.rows[0].auditid],
      );
      const recordedAudit = audit.rows[0];
      res.locals.auditAction =
        `${res.locals.session.user.name} recorded an inventory audit for ` +
        `${recordedAudit.targetname} on ${formatPhilippineDateTime(recordedAudit.auditdate)}` +
        `${recordedAudit.hasdiscrepancy ? ' with a discrepancy' : ''}`;
      res.status(201).json({ data: audit.rows[0] });
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  '/:id',
  requireAuth,
  validate(updateInventoryAuditQuerySchema),
  async (
    req: Request<{ id: string }, {}, UpdateInventoryAuditQuery>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (Object.keys(req.body).length === 0)
        throw new ConflictError('No changes provided.');
      const result = await pool.query(
        `SELECT * FROM inventoryaudit WHERE auditid = $1`,
        [req.params.id],
      );
      if (result.rows.length === 0)
        throw new NotFoundError('Inventory audit not found.');
      const existing = result.rows[0];
      const resolving = existing.hasdiscrepancy && req.body.hasdiscrepancy === false;
      if (resolving && (
        req.body.currentstock === undefined ||
        req.body.deliveryid === undefined ||
        req.body.correctedquantityreceived === undefined ||
        req.body.correctedtotalamountpaid === undefined
      ))
        throw new ConflictError(
          'Enter the verified stock and correct an existing delivery before resolving this discrepancy.',
        );

      const updated = await pool.connect();
      try {
        await updated.query('BEGIN');
        if (resolving) {
          const targetColumn = existing.casketid !== null ? 'casketid' : 'formalinid';
          const deliveryTable = existing.casketid !== null ? 'casketdelivery' : 'formalindelivery';
          const targetResult = await updated.query(
            `SELECT ${targetColumn} FROM ${deliveryTable}
             WHERE deliveryid = $1 AND ${targetColumn} = $2
             FOR UPDATE`,
            [req.body.deliveryid, existing[`${targetColumn}`]],
          );
          if (targetResult.rows.length === 0)
            throw new ConflictError('The selected delivery does not belong to this inventory item.');

          await updated.query(
            `UPDATE ${deliveryTable}
             SET quantityreceived = $1,
                 totalamountpaid = $2
             WHERE deliveryid = $3`,
            [
              req.body.correctedquantityreceived,
              req.body.correctedtotalamountpaid,
              req.body.deliveryid,
            ],
          );
          const inventoryTable = existing.casketid !== null ? 'casketinventory' : 'formalininventory';
          const inventoryIdColumn = existing.casketid !== null ? 'casketid' : 'formalinid';
          await updated.query(
            `UPDATE ${inventoryTable}
             SET currentstock = $1
             WHERE ${inventoryIdColumn} = $2`,
            [req.body.currentstock, existing[`${inventoryIdColumn}`]],
          );
        }
        const auditResult = await updated.query(
          `UPDATE inventoryaudit
           SET auditdate = COALESCE($1, auditdate),
               hasdiscrepancy = COALESCE($2, hasdiscrepancy)
           WHERE auditid = $3
           RETURNING *`,
          [req.body.auditdate ?? null, req.body.hasdiscrepancy ?? null, req.params.id],
        );
        await updated.query('COMMIT');
        result.rows = auditResult.rows;
      } catch (error) {
        await updated.query('ROLLBACK');
        throw error;
      } finally {
        updated.release();
      }
      triggerNotificationSweep();
      const audit = await pool.query(
        `${AUDIT_SELECT} WHERE ia.auditid = $1`,
        [result.rows[0].auditid],
      );
      const updatedAudit = audit.rows[0];
      const resolution =
        existing.hasdiscrepancy && req.body.hasdiscrepancy === false
          ? ' and resolved the discrepancy'
          : '';
      res.locals.auditAction =
        `${res.locals.session.user.name} updated the inventory audit for ` +
        `${updatedAudit.targetname} on ${formatPhilippineDateTime(updatedAudit.auditdate)}${resolution}`;
      res.json({ data: audit.rows[0] });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
