import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { notImplemented } from './results.controller.js';
const router = Router();
router.use(authenticate, authorize('results.view'));
// Restrict teacher results to their assigned classes and parents to their own children here.
router.use(notImplemented);
export default router;
