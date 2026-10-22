import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import * as controller from './classes.controller.js';
import {
  assignSubjectSchema,
  classIdSchema,
  classListSchema,
  createClassSchema,
  unassignSubjectSchema,
  updateClassSchema,
} from './classes.schema.js';
const router = Router();
router.use(authenticate);
router.get('/me', authorize('classes.view.own'), controller.getMine);
router.get('/', authorize('classes.view'), validate(classListSchema), controller.list);
router.get('/:id', authorize('classes.view'), validate(classIdSchema), controller.getOne);
router.post('/', authorize('classes.manage'), validate(createClassSchema), controller.create);
router.patch('/:id', authorize('classes.manage'), validate(updateClassSchema), controller.update);
router.delete('/:id', authorize('classes.manage'), validate(classIdSchema), controller.remove);
router.post('/:id/subjects', authorize('classes.manage'), validate(assignSubjectSchema), controller.assignSubject);
router.delete('/:id/subjects/:subjectId', authorize('classes.manage'), validate(unassignSubjectSchema), controller.unassignSubject);
export default router;
