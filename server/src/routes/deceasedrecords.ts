import { Router } from 'express';
import validate from '@/middleware/validate';
import requireAuth from '@/middleware/require-auth';
import {
  createDeceasedRecordQuerySchema,
  updateDeceasedRecordQuerySchema,
} from 'shared';
import validateParams from '@/middleware/validate-params';
import { idParamSchema, type IdParam } from 'shared/utils';
import { triggerNotificationSweep } from '@/lib/notifications';
import { triggerServiceStatusSweep } from '@/lib/service-status';
import type { Locals } from '@/types/controllers';

const router = Router();

/**
 * Sample URLs
 * `http://localhost:4000/deceasedrecords/without-contract`
 * `http://localhost:4000/deceasedrecords/without-contract?search=Juan`
 * `http://localhost:4000/deceasedrecords/without-contract?status=intake&sortBy=datecreated&sortOrder=desc&page=1&limit=20`
 */
router.get('/without-contract', requireAuth, getUncontractedDeceased);

router.get(
  '/:id',
  requireAuth,
  validateParams(idParamSchema),
  getDeceasedRecordById,
);

router.post(
  '/',
  requireAuth,
  validate(createDeceasedRecordQuerySchema),
  createDeceasedRecord,
);

router.patch(
  '/:id',
  requireAuth,
  validateParams(idParamSchema),
  validate(updateDeceasedRecordQuerySchema),
  async (
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
          `SELECT managedby FROM DeceasedRecord WHERE caseid = $1`,
          [id],
        );

        if (checkResult.rows.length === 0)
          throw new NotFoundError('Deceased record not found.');

        if (checkResult.rows[0].managedby !== userId)
          throw new ForbiddenError(
            'You do not have permission to modify this record.',
          );
      }

      const result = await pool.query(
        `UPDATE DeceasedRecord SET
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
          hasadvanceddecomposition = COALESCE($14, hasadvanceddecomposition)
        WHERE caseid = $13
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
          id,
          parsed.hasadvanceddecomposition ?? null,
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

      if (parsed.plantype !== undefined) triggerServiceStatusSweep();
      res.json({ data: updated });
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  '/:id',
  requireAuth,
  validateParams(idParamSchema),
  deleteDeceasedRecord,
);

export default router;
