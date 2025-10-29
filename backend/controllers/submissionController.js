import Submission from '../models/Submission.js';
import Group from '../models/Group.js';
import Assignment from '../models/Assignment.js';
import fs from 'fs';
import path from 'path';

// Submit assignment with file upload (One-step submission)
export const submitAssignment = async (req, res) => {
  try {
    const { assignmentId, groupId, submissionNotes } = req.body;
    const userId = req.user.userId;
    
    // Check if user is member of the group
    const group = await Group.findById(groupId);
    const isMember = group && group.members.some(m => 
      m.userId.toString() === userId || m.userId._id?.toString() === userId
    );
    
    if (!group || !isMember) {
      // Clean up uploaded files if user is not authorized
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          fs.unlink(file.path, err => {
            if (err) console.error('Error deleting file:', err);
          });
        });
      }
      return res.status(403).json({ error: 'You are not a member of this group' });
    }
    
    // Check if assignment exists
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    // Process uploaded files
    const uploadedFiles = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        uploadedFiles.push({
          filename: file.filename,
          originalName: file.originalname,
          path: file.path,
          mimetype: file.mimetype,
          size: file.size,
          uploadedAt: new Date()
        });
      });
    }
    
    // Check if already submitted
    const existingSubmission = await Submission.findOne({ assignmentId, groupId });
    
    if (existingSubmission) {
      // Update existing submission if not yet graded
      if (existingSubmission.status === 'graded') {
        // Clean up uploaded files
        if (req.files && req.files.length > 0) {
          req.files.forEach(file => {
            fs.unlink(file.path, err => {
              if (err) console.error('Error deleting file:', err);
            });
          });
        }
        return res.status(400).json({ error: 'Assignment already graded. Cannot resubmit.' });
      }
      
      // Delete old files if new ones are uploaded
      if (uploadedFiles.length > 0 && existingSubmission.uploadedFiles.length > 0) {
        existingSubmission.uploadedFiles.forEach(oldFile => {
          fs.unlink(oldFile.path, err => {
            if (err) console.error('Error deleting old file:', err);
          });
        });
      }
      
      existingSubmission.status = 'submitted';
      existingSubmission.submissionNotes = submissionNotes;
      existingSubmission.submittedBy = userId;
      existingSubmission.submittedAt = new Date();
      if (uploadedFiles.length > 0) {
        existingSubmission.uploadedFiles = uploadedFiles;
      }
      await existingSubmission.save();
      
      return res.json({
        message: 'Assignment resubmitted successfully!',
        submission: existingSubmission
      });
    }
    
    // Create new submission
    const submission = await Submission.create({
      assignmentId,
      groupId,
      submittedBy: userId,
      status: 'submitted',
      submissionNotes,
      uploadedFiles,
      submittedAt: new Date()
    });
    
    res.status(201).json({
      message: 'Assignment submitted successfully!',
      submission
    });
  } catch (error) {
    console.error('Submit assignment error:', error);
    // Clean up uploaded files on error
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        fs.unlink(file.path, err => {
          if (err) console.error('Error deleting file:', err);
        });
      });
    }
    res.status(500).json({ error: 'Failed to submit assignment' });
  }
};

// Get group submission status for an assignment
export const getGroupSubmissionStatus = async (req, res) => {
  try {
    const { assignmentId, groupId } = req.params;
    
    const submission = await Submission.findOne({ assignmentId, groupId })
      .populate('submittedBy', 'fullName email')
      .populate('reviewedBy', 'fullName email');
    
    if (!submission) {
      return res.json({ submission: null });
    }
    
    res.json({
      submission: {
        ...submission.toObject(),
        submitted_by_name: submission.submittedBy?.fullName,
        reviewed_by_name: submission.reviewedBy?.fullName
      }
    });
  } catch (error) {
    console.error('Get submission status error:', error);
    res.status(500).json({ error: 'Failed to fetch submission status' });
  }
};

// Grade submission (Teacher/Admin only)
export const gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { grade, feedback } = req.body;
    const reviewerId = req.user.userId;
    
    const submission = await Submission.findById(submissionId);
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    if (submission.status !== 'submitted' && submission.status !== 'reviewed') {
      return res.status(400).json({ error: 'Can only grade submitted assignments' });
    }
    
    // Validate grade
    if (grade !== undefined && (grade < 0 || grade > 100)) {
      return res.status(400).json({ error: 'Grade must be between 0 and 100' });
    }
    
    submission.grade = grade;
    submission.feedback = feedback;
    submission.reviewedBy = reviewerId;
    submission.reviewedAt = new Date();
    submission.status = 'graded';
    await submission.save();
    
    await submission.populate('reviewedBy', 'fullName email');
    
    res.json({
      message: 'Submission graded successfully',
      submission
    });
  } catch (error) {
    console.error('Grade submission error:', error);
    res.status(500).json({ error: 'Failed to grade submission' });
  }
};

// Download submission file
export const downloadFile = async (req, res) => {
  try {
    const { submissionId, fileIndex } = req.params;
    
    const submission = await Submission.findById(submissionId);
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    const file = submission.uploadedFiles[parseInt(fileIndex)];
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Check if file exists
    if (!fs.existsSync(file.path)) {
      return res.status(404).json({ error: 'File no longer exists on server' });
    }
    
    res.download(file.path, file.originalName);
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
};

// Get group progress (for student dashboard)
export const getGroupProgress = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.userId;
    
    // Check if user is member of the group
    const group = await Group.findById(groupId);
    const isMember = group && group.members.some(m => 
      m.userId.toString() === userId || m.userId._id?.toString() === userId
    );
    
    if (!group || !isMember) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }
    
    // Get total assignments for this group
    const totalAssignments = await Assignment.countDocuments({
      $or: [
        { isForAll: true },
        { assignedGroups: groupId }
      ]
    });
    
    // Get submitted submissions
    const submittedCount = await Submission.countDocuments({
      groupId,
      status: { $in: ['submitted', 'reviewed', 'graded'] }
    });
    
    // Get graded submissions
    const gradedCount = await Submission.countDocuments({
      groupId,
      status: 'graded'
    });
    
    res.json({
      total: totalAssignments,
      submitted: submittedCount,
      graded: gradedCount,
      pending: totalAssignments - submittedCount,
      completionPercentage: totalAssignments > 0 ? Math.round((submittedCount / totalAssignments) * 100) : 0
    });
  } catch (error) {
    console.error('Get group progress error:', error);
    res.status(500).json({ error: 'Failed to fetch group progress' });
  }
};
