import { createExpense, getExpenses } from '@/controllers/expense';
import requireAuth from '@/middleware/require-auth';
import validate from '@/middleware/validate';
import { Router } from 'express';
import { createExpenseQuerySchema } from 'shared';

const router = Router();

router.get('/', requireAuth, getExpenses);
router.post(
  '/',
  requireAuth,
  validate(createExpenseQuerySchema),
  createExpense,
);

export default router;
