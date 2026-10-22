import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import * as controller from './subjects.controller.js';
import { createSubjectSchema, subjectIdSchema, subjectListSchema, updateSubjectSchema } from './subjects.schema.js';

const router = Router();
router.use(authenticate);
router.get('/', authorize('subjects.view'), validate(subjectListSchema), controller.list);
router.get('/:id', authorize('subjects.view'), validate(subjectIdSchema), controller.getOne);
router.post('/', authorize('subjects.manage'), validate(createSubjectSchema), controller.create);
router.patch('/:id', authorize('subjects.manage'), validate(updateSubjectSchema), controller.update);
router.delete('/:id', authorize('subjects.manage'), validate(subjectIdSchema), controller.remove);

export default router;
