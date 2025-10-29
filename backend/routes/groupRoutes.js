import express from 'express';
import { body, query } from 'express-validator';
import {
  createGroup,
  getUserGroups,
  getGroupDetails,
  addGroupMember,
  removeGroupMember,
  getAllGroups,
  requestJoinGroup,
  approveJoinRequest,
  rejectJoinRequest,
  getJoinRequests,
  searchGroups,
  getGroupMessages,
  sendGroupMessage,
  createAnnouncement,
  uploadResource,
  getGroupStats,
  deleteAnnouncement,
  deleteResource,
  deleteGroup
} from '../controllers/groupController.js';
import { authenticate, isStudent } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication and student role
router.use(authenticate, isStudent);

// Create group
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Group name is required'),
    body('description').optional().trim(),
    body('category').optional().isIn(['study', 'project', 'class', 'general']),
    body('tags').optional().isArray(),
    body('isPublic').optional().isBoolean(),
    body('maxMembers').optional().isInt({ min: 2, max: 100 }),
    validate
  ],
  createGroup
);

// Get user's groups
router.get('/', getUserGroups);

// Get all public groups (for browsing)
router.get('/browse', getAllGroups);

// Search groups with filters
router.get('/search', searchGroups);

// Get group details
router.get('/:groupId', getGroupDetails);

// Get group statistics
router.get('/:groupId/stats', getGroupStats);

// Get join requests for a group (admin only)
router.get('/:groupId/requests', getJoinRequests);

// Get join requests for a group (admin only)
router.get('/:groupId/requests', getJoinRequests);

// Get group messages (chat/discussion)
router.get('/:groupId/messages', getGroupMessages);

// Send message to group
router.post(
  '/:groupId/messages',
  [
    body('content').trim().notEmpty().withMessage('Message content is required'),
    body('replyTo').optional().isMongoId(),
    validate
  ],
  sendGroupMessage
);

// Create announcement (admin only)
router.post(
  '/:groupId/announcements',
  [
    body('title').trim().notEmpty().withMessage('Announcement title is required'),
    body('content').trim().notEmpty().withMessage('Announcement content is required'),
    body('isPinned').optional().isBoolean(),
    validate
  ],
  createAnnouncement
);

// Delete announcement (admin only)
router.delete('/:groupId/announcements/:announcementId', deleteAnnouncement);

// Upload resource to group
router.post(
  '/:groupId/resources',
  [
    body('name').trim().notEmpty().withMessage('Resource name is required'),
    body('description').optional().trim(),
    body('fileUrl').trim().notEmpty().withMessage('File URL is required'),
    body('fileType').optional().trim(),
    validate
  ],
  uploadResource
);

// Delete resource
router.delete('/:groupId/resources/:resourceId', deleteResource);

// Request to join a group
router.post(
  '/:groupId/join',
  [
    body('message').optional().trim(),
    validate
  ],
  requestJoinGroup
);

// Approve join request (admin only)
router.post('/:groupId/approve/:userId', approveJoinRequest);

// Reject join request (admin only)
router.post('/:groupId/reject/:userId', rejectJoinRequest);

// Add member to group (admin only - direct add)
router.post(
  '/:groupId/members',
  [
    body('emailOrStudentId').trim().notEmpty().withMessage('Email or Student ID is required'),
    validate
  ],
  addGroupMember
);

// Remove member from group (admin only)
router.delete('/:groupId/members/:userId', removeGroupMember);

// Delete group (creator only)
router.delete('/:groupId', deleteGroup);

export default router;
