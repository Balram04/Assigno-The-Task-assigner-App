import express from 'express';
import { body } from 'express-validator';
import {
  submitAssignment,
  getGroupSubmissionStatus,
  getGroupProgress,
  gradeSubmission,
  downloadFile
} from '../controllers/submissionController.js';
import { authenticate, isStudent, isAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { uploadSubmissionFiles, handleUploadError } from '../middleware/upload.js';
import Submission from '../models/Submission.js';

const router = express.Router();

// Student routes - require authentication and student role
router.post(
  '/submit',
  authenticate,
  isStudent,
  uploadSubmissionFiles,
  handleUploadError,
  [
    body('assignmentId').isMongoId().withMessage('Invalid assignment ID'),
    body('groupId').isMongoId().withMessage('Invalid group ID'),
    body('submissionNotes').optional().trim(),
    validate
  ],
  submitAssignment
);

// Get submission status
router.get('/status/:assignmentId/:groupId', authenticate, getGroupSubmissionStatus);

// Get submission by ID (for admin review)
router.get('/:submissionId', authenticate, isAdmin, async (req, res) => {
  try {
    const { submissionId } = req.params;
    
    const submission = await Submission.findById(submissionId)
      .populate('submittedBy', 'fullName email studentId')
      .populate('reviewedBy', 'fullName email')
      .populate({
        path: 'groupId',
        select: 'name description category tags',
        populate: {
          path: 'members.userId',
          select: 'fullName email'
        }
      })
      .populate('assignmentId', 'title description dueDate');
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    res.json({
      submission: {
        ...submission.toObject(),
        submitted_by_name: submission.submittedBy?.fullName,
        reviewed_by_name: submission.reviewedBy?.fullName,
        group_name: submission.groupId?.name,
        assignment_title: submission.assignmentId?.title
      }
    });
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
});

// Get group progress
router.get('/progress/:groupId', authenticate, isStudent, getGroupProgress);

// Admin/Teacher routes - require admin role
router.post(
  '/grade/:submissionId',
  authenticate,
  isAdmin,
  [
    body('grade').isFloat({ min: 0, max: 100 }).withMessage('Grade must be between 0 and 100'),
    body('feedback').optional().trim(),
    validate
  ],
  gradeSubmission
);

// Download file - accessible by both students and teachers
router.get('/download/:submissionId/:fileIndex', authenticate, downloadFile);

export default router;
