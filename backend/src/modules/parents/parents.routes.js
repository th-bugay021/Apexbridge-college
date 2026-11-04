import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import * as controller from './parents.controller.js';
import { bulkDeleteParentsSchema, createParentSchema, linkStudentSchema, parentIdSchema, parentListSchema, unlinkStudentSchema, updateParentSchema } from './parents.schema.js';

const router = Router();
router.use(authenticate);
router.get('/', authorize('parents.view'), validate(parentListSchema), controller.list);
router.post('/', authorize('parents.create'), validate(createParentSchema), controller.create);
router.post('/bulk-delete', authorize('parents.delete'), validate(bulkDeleteParentsSchema), controller.bulkDelete);
router.post('/:id/students', authorize('parents.update'), validate(linkStudentSchema), controller.linkStudent);
router.delete('/:id/students/:studentId', authorize('parents.update'), validate(unlinkStudentSchema), controller.unlinkStudent);
router.get('/:id', authorize('parents.view'), validate(parentIdSchema), controller.getOne);
router.patch('/:id', authorize('parents.update'), validate(updateParentSchema), controller.updateOne);
router.delete('/:id', authorize('parents.delete'), validate(parentIdSchema), controller.remove);
export default router;
