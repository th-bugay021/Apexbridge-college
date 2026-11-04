import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import * as controller from './students.controller.js';
import { bulkDeleteStudentsSchema, createStudentSchema, studentIdSchema, studentListSchema, updateStudentSchema } from './students.schema.js';

const router = Router();
router.use(authenticate);
router.get('/', authorize('students.view'), validate(studentListSchema), controller.list);
router.post('/', authorize('students.create'), validate(createStudentSchema), controller.create);
router.post('/bulk-delete', authorize('students.delete'), validate(bulkDeleteStudentsSchema), controller.bulkDelete);
router.get('/:id', authorize('students.view'), validate(studentIdSchema), controller.getOne);
router.patch('/:id', authorize('students.update'), validate(updateStudentSchema), controller.updateOne);
router.delete('/:id', authorize('students.delete'), validate(studentIdSchema), controller.remove);
export default router;
