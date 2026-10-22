import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { notImplemented } from './fees.controller.js';
const router = Router();
router.use(authenticate, authorize('fees.view'));
router.use(notImplemented);
export default router;
