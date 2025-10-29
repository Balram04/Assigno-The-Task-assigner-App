import express from 'express';
import { body } from 'express-validator';
import {
  createAssignment,
  getAllAssignments,
  getStudentAssignments,
  updateAssignment,
  deleteAssignment,
  getAssignmentDetails
} from '../controllers/assignmentController.js';
import { authenticate, isAdmin, isStudent } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

// Admin routes
router.post(
  '/',
  authenticate,
  isAdmin,
  [
    body('title').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('dueDate').isISO8601(),
    body('onedriveLink').isURL(),
    body('isForAll').isBoolean(),
    body('groupIds').optional().isArray(),
    validate
  ],
  createAssignment
);

router.get('/admin/all', authenticate, isAdmin, getAllAssignments);
router.get('/admin/:assignmentId', authenticate, isAdmin, getAssignmentDetails);

router.put(
  '/:assignmentId',
  authenticate,
  isAdmin,
  [
    body('title').optional().trim().notEmpty(),
    body('description').optional().trim().notEmpty(),
    body('dueDate').optional().isISO8601(),
    body('onedriveLink').optional().isURL(),
    validate
  ],
  updateAssignment
);

router.delete('/:assignmentId', authenticate, isAdmin, deleteAssignment);

// Student routes
router.get('/', authenticate, isStudent, getStudentAssignments);

export default router;
