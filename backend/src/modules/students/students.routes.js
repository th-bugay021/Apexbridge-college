import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { notImplemented } from './students.controller.js';
const router = Router();
router.use(authenticate, authorize('students.view'));
// Enforce teacher class scope and parent-child ownership here when student handlers are implemented.
router.use(notImplemented);
export default router;
