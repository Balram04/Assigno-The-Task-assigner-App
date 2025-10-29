import Assignment from '../models/Assignment.js';
import Submission from '../models/Submission.js';
import Group from '../models/Group.js';

// Create assignment (Admin only)
export const createAssignment = async (req, res) => {
  try {
    const { title, description, dueDate, onedriveLink, isForAll, groupIds } = req.body;
    const createdBy = req.user.userId;
    
    // Create assignment
    const assignment = await Assignment.create({
      title,
      description,
      dueDate,
      onedriveLink,
      createdBy,
      isForAll,
      assignedGroups: isForAll ? [] : (groupIds || [])
    });
    
    await assignment.populate('createdBy', 'fullName email');
    
    res.status(201).json({
      message: 'Assignment created successfully',
      assignment
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
};

// Get all assignments (Admin)
export const getAllAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate('createdBy', 'fullName email')
      .sort({ dueDate: -1 });
    
    // Get confirmed count for each assignment
    const assignmentsWithStats = await Promise.all(
      assignments.map(async (assignment) => {
        const submittedCount = await Submission.countDocuments({
          assignmentId: assignment._id,
          status: { $in: ['submitted', 'reviewed', 'graded'] }
        });
        
        const gradedCount = await Submission.countDocuments({
          assignmentId: assignment._id,
          status: 'graded'
        });
        
        const totalGroups = await Group.countDocuments();
        
        const assignmentObj = assignment.toObject();
        return {
          id: assignmentObj.id || assignmentObj._id.toString(),
          title: assignmentObj.title,
          description: assignmentObj.description,
          due_date: assignmentObj.dueDate,
          onedrive_link: assignmentObj.onedriveLink,
          created_by: assignmentObj.createdBy,
          is_for_all: assignmentObj.isForAll,
          assigned_groups: assignmentObj.assignedGroups,
          creator_name: assignment.createdBy?.fullName,
          submitted_count: submittedCount,
          graded_count: gradedCount,
          total_groups: totalGroups,
          createdAt: assignmentObj.createdAt,
          updatedAt: assignmentObj.updatedAt
        };
      })
    );
    
    res.json({ assignments: assignmentsWithStats });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
};

// Get assignments for student
export const getStudentAssignments = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get user's groups (with new schema)
    const userGroups = await Group.find({ 'members.userId': userId }).select('_id');
    const groupIds = userGroups.map(g => g._id);
    
    // Get assignments (for all students or for specific groups)
    const assignments = await Assignment.find({
      $or: [
        { isForAll: true },
        { assignedGroups: { $in: groupIds } }
      ]
    })
      .populate('createdBy', 'fullName email')
      .sort({ dueDate: -1 });
    
    // Get submission status for each assignment
    const assignmentsWithStatus = await Promise.all(
      assignments.map(async (assignment) => {
        const submission = await Submission.findOne({
          assignmentId: assignment._id,
          groupId: { $in: groupIds }
        });
        
        const assignmentObj = assignment.toObject();
        return {
          id: assignmentObj.id || assignmentObj._id.toString(),
          title: assignmentObj.title,
          description: assignmentObj.description,
          due_date: assignmentObj.dueDate,
          onedrive_link: assignmentObj.onedriveLink,
          created_by: assignmentObj.createdBy,
          is_for_all: assignmentObj.isForAll,
          assigned_groups: assignmentObj.assignedGroups,
          creator_name: assignment.createdBy?.fullName,
          status: submission?.status || 'pending',
          grade: submission?.grade,
          feedback: submission?.feedback,
          submitted_at: submission?.submittedAt,
          reviewed_at: submission?.reviewedAt,
          createdAt: assignmentObj.createdAt,
          updatedAt: assignmentObj.updatedAt
        };
      })
    );
    
    res.json({ assignments: assignmentsWithStatus });
  } catch (error) {
    console.error('Get student assignments error:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
};

// Update assignment (Admin only)
export const updateAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { title, description, dueDate, onedriveLink } = req.body;
    
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (dueDate !== undefined) updateData.dueDate = dueDate;
    if (onedriveLink !== undefined) updateData.onedriveLink = onedriveLink;
    
    const assignment = await Assignment.findByIdAndUpdate(
      assignmentId,
      updateData,
      { new: true }
    ).populate('createdBy', 'fullName email');
    
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    res.json({
      message: 'Assignment updated successfully',
      assignment
    });
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
};

// Delete assignment (Admin only)
export const deleteAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    await Assignment.findByIdAndDelete(assignmentId);
    // Submissions will be handled by cascade or manually if needed
    await Submission.deleteMany({ assignmentId });
    
    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
};

// Get assignment details with submission stats (Admin)
export const getAssignmentDetails = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    // Get assignment info
    const assignment = await Assignment.findById(assignmentId)
      .populate('createdBy', 'fullName email');
    
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    // Get all groups with their submission status
    const groups = await Group.find();
    
    const submissionsData = await Promise.all(
      groups.map(async (group) => {
        const submission = await Submission.findOne({
          assignmentId,
          groupId: group._id
        })
          .populate('submittedBy', 'fullName')
          .populate('reviewedBy', 'fullName');
        
        return {
          group_id: group._id,
          group_name: group.name,
          status: submission?.status || 'pending',
          submitted_at: submission?.submittedAt,
          reviewed_at: submission?.reviewedAt,
          submitted_by_name: submission?.submittedBy?.fullName,
          reviewed_by_name: submission?.reviewedBy?.fullName,
          grade: submission?.grade,
          feedback: submission?.feedback,
          file_count: submission?.uploadedFiles?.length || 0,
          member_count: group.members.length,
          submission_id: submission?._id
        };
      })
    );
    
    res.json({
      assignment: {
        id: assignment.id || assignment._id.toString(),
        title: assignment.title,
        description: assignment.description,
        due_date: assignment.dueDate,
        onedrive_link: assignment.onedriveLink,
        created_by: assignment.createdBy,
        is_for_all: assignment.isForAll,
        assigned_groups: assignment.assignedGroups,
        creator_name: assignment.createdBy?.fullName,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt
      },
      submissions: submissionsData
    });
  } catch (error) {
    console.error('Get assignment details error:', error);
    res.status(500).json({ error: 'Failed to fetch assignment details' });
  }
};
