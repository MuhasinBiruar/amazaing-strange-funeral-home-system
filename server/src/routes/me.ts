import { Router } from 'express';
import { auth } from '@/lib/auth';
import { fromNodeHeaders } from 'better-auth/node';
import { requireSession } from '@/middleware/require-auth';

const router = Router();

// For getting session data of logged in user
router.get('/', requireSession, async (req, res) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  res.json(session);
});

export default router;
