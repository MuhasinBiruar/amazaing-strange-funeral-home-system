import { Router } from 'express';
import { auth } from '../lib/auth.ts';
import { fromNodeHeaders } from 'better-auth/node';

const router = Router();

// For getting session data of logged in user
router.get('/', async (req, res) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  res.json(session);
});

export default router;
