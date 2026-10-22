import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { notImplemented } from './users.controller.js';
const router = Router();
router.use(authenticate, authorize('users.view'));
router.use(notImplemented);
export default router;
