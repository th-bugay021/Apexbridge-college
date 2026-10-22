import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import * as controller from './timetable.controller.js';
import {
  classTimetableSchema,
  createTimetableEntrySchema,
  myTimetableSchema,
  timetableEntryIdSchema,
  updateTimetableEntrySchema,
} from './timetable.schema.js';

const router = Router();
router.use(authenticate);

// Keep /me ahead of parameterized routes so it remains a literal endpoint.
router.get('/me', authorize('timetable.view.own'), validate(myTimetableSchema), controller.getMine);
router.get('/classes/:classId', validate(classTimetableSchema), controller.getClass);
router.post('/', authorize('timetable.manage'), validate(createTimetableEntrySchema), controller.create);
router.patch('/:id', authorize('timetable.manage'), validate(updateTimetableEntrySchema), controller.update);
router.delete('/:id', authorize('timetable.manage'), validate(timetableEntryIdSchema), controller.remove);

export default router;
