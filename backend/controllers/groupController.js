import Group from '../models/Group.js';
import GroupMessage from '../models/GroupMessage.js';
import User from '../models/User.js';

// Create new group
export const createGroup = async (req, res) => {
  try {
    const { name, description, category, tags, isPublic, maxMembers } = req.body;
    const creatorId = req.user.userId;
    
    // Create group with creator as first member with admin role
    const group = await Group.create({
      name,
      description,
      category: category || 'general',
      tags: tags || [],
      isPublic: isPublic !== undefined ? isPublic : true,
      maxMembers: maxMembers || 50,
      creatorId,
      members: [{ userId: creatorId, role: 'admin', joinedAt: new Date() }],
      lastActivityAt: new Date(),
      activityCount: 1
    });
    
    // Populate creator info
    await group.populate('creatorId', 'fullName email');
    
    res.status(201).json({
      message: 'Group created successfully',
      group
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
};

// Get all groups for current user
export const getUserGroups = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const groups = await Group.find({ 'members.userId': userId })
      .populate('creatorId', 'fullName email')
      .sort({ lastActivityAt: -1 });
    
    // Get unread message counts for each group
    const groupsWithDetails = await Promise.all(groups.map(async (group) => {
      // Filter out any null members
      const validMembers = group.members.filter(m => m.userId);
      
      const memberInfo = validMembers.find(m => m.userId.toString() === userId);
      const unreadCount = await GroupMessage.countDocuments({
        groupId: group._id,
        createdAt: { $gt: memberInfo?.joinedAt || new Date() },
        senderId: { $ne: userId }
      });

      return {
        ...group.toObject(),
        member_count: validMembers.length,
        creator_name: group.creatorId?.fullName || 'Unknown User',
        user_role: memberInfo?.role || 'member',
        unread_count: unreadCount,
        last_activity: group.lastActivityAt
      };
    }));
    
    res.json({ groups: groupsWithDetails });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
};

// Get group details with members
export const getGroupDetails = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.userId;
    
    // Get group with populated creator and members
    const group = await Group.findById(groupId)
      .populate('creatorId', 'fullName email')
      .populate('members.userId', 'id email fullName studentId')
      .populate('announcements.createdBy', 'fullName')
      .populate('resources.uploadedBy', 'fullName');
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Clean up members with deleted users
    const validMembers = group.members.filter(m => m.userId != null);
    if (validMembers.length !== group.members.length) {
      // Remove null members from database
      group.members = validMembers;
      await group.save();
    }

    // Check if user is a member
    const isMember = group.members.some(m => m.userId && m.userId._id.toString() === userId);
    if (!isMember) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    // Get recent activity count
    const recentMessages = await GroupMessage.countDocuments({
      groupId: group._id,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    });
    
    res.json({
      group: {
        ...group.toObject(),
        creator_name: group.creatorId?.fullName || 'Unknown User',
        recent_activity: recentMessages
      },
      members: group.members.filter(m => m.userId).map(m => ({
        id: m.userId.id,
        email: m.userId.email,
        full_name: m.userId.fullName,
        student_id: m.userId.studentId,
        role: m.role,
        joined_at: m.joinedAt
      }))
    });
  } catch (error) {
    console.error('Get group details error:', error);
    res.status(500).json({ error: 'Failed to fetch group details' });
  }
};

// Add member to group
export const addGroupMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { emailOrStudentId } = req.body;
    
    // Find group
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Check if user is group admin
    const requestorMember = group.members.find(m => m.userId.toString() === req.user.userId);
    if (!requestorMember || requestorMember.role !== 'admin') {
      return res.status(403).json({ error: 'Only group admins can add members' });
    }
    
    // Find user by email or student ID
    const user = await User.findOne({
      $or: [
        { email: emailOrStudentId },
        { studentId: emailOrStudentId }
      ],
      role: 'student'
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Check if already a member
    if (group.members.some(m => m.userId.toString() === user._id.toString())) {
      return res.status(400).json({ error: 'User is already a member' });
    }

    // Check if group is full
    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({ error: 'Group is full' });
    }
    
    // Add member
    group.members.push({ userId: user._id, role: 'member', joinedAt: new Date() });
    await group.updateActivity();
    
    res.json({ message: 'Member added successfully' });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
};

// Remove member from group
export const removeGroupMember = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    
    // Find group
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Check if user is group admin
    const requestorMember = group.members.find(m => m.userId.toString() === req.user.userId);
    if (!requestorMember || requestorMember.role !== 'admin') {
      return res.status(403).json({ error: 'Only group admins can remove members' });
    }
    
    // Cannot remove creator
    if (userId === group.creatorId.toString()) {
      return res.status(400).json({ error: 'Cannot remove group creator' });
    }
    
    // Remove member
    group.members = group.members.filter(m => m.userId.toString() !== userId);
    await group.save();
    
    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
};

// Get all public groups (for browsing/discovering groups)
export const getAllGroups = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const groups = await Group.find({ isPublic: true })
      .populate('creatorId', 'fullName email')
      .sort({ lastActivityAt: -1 })
      .limit(100);
    
    // Add member count and check if user is member or has pending request
    const groupsWithInfo = groups.map(group => {
      const isMember = group.members.some(m => m.userId && m.userId.toString() === userId);
      const hasPendingRequest = group.joinRequests.some(req => req.userId && req.userId.toString() === userId);
      
      return {
        ...group.toObject(),
        member_count: group.members.filter(m => m.userId).length,
        creator_name: group.creatorId?.fullName || 'Unknown User',
        is_member: isMember,
        has_pending_request: hasPendingRequest,
        is_full: group.members.filter(m => m.userId).length >= group.maxMembers
      };
    });
    
    res.json({ groups: groupsWithInfo });
  } catch (error) {
    console.error('Get all groups error:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
};

// Request to join a group
export const requestJoinGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { message } = req.body;
    const userId = req.user.userId;
    
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    if (!group.isPublic) {
      return res.status(403).json({ error: 'This group is private' });
    }
    
    // Check if already a member
    if (group.members.some(m => m.userId.toString() === userId)) {
      return res.status(400).json({ error: 'You are already a member of this group' });
    }
    
    // Check if already has pending request
    if (group.joinRequests.some(req => req.userId.toString() === userId)) {
      return res.status(400).json({ error: 'You already have a pending request' });
    }
    
    // Check if group is full
    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({ error: 'Group is full' });
    }
    
    // Add join request
    group.joinRequests.push({
      userId,
      message,
      requestedAt: new Date()
    });
    
    await group.save();
    
    res.json({ message: 'Join request sent successfully' });
  } catch (error) {
    console.error('Request join group error:', error);
    res.status(500).json({ error: 'Failed to send join request' });
  }
};

// Approve join request
export const approveJoinRequest = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Check if user is group admin
    const requestorMember = group.members.find(m => m.userId.toString() === req.user.userId);
    if (!requestorMember || requestorMember.role !== 'admin') {
      return res.status(403).json({ error: 'Only group admins can approve requests' });
    }
    
    // Check if group is full
    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({ error: 'Group is full' });
    }
    
    // Find and remove the request
    const requestIndex = group.joinRequests.findIndex(req => req.userId.toString() === userId);
    
    if (requestIndex === -1) {
      return res.status(404).json({ error: 'Join request not found' });
    }
    
    group.joinRequests.splice(requestIndex, 1);
    group.members.push({ userId, role: 'member', joinedAt: new Date() });
    await group.updateActivity();
    
    res.json({ message: 'Join request approved' });
  } catch (error) {
    console.error('Approve join request error:', error);
    res.status(500).json({ error: 'Failed to approve request' });
  }
};

// Reject join request
export const rejectJoinRequest = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Check if user is group admin
    const requestorMember = group.members.find(m => m.userId.toString() === req.user.userId);
    if (!requestorMember || requestorMember.role !== 'admin') {
      return res.status(403).json({ error: 'Only group admins can reject requests' });
    }
    
    // Find and remove the request
    const requestIndex = group.joinRequests.findIndex(req => req.userId.toString() === userId);
    
    if (requestIndex === -1) {
      return res.status(404).json({ error: 'Join request not found' });
    }
    
    group.joinRequests.splice(requestIndex, 1);
    await group.save();
    
    res.json({ message: 'Join request rejected' });
  } catch (error) {
    console.error('Reject join request error:', error);
    res.status(500).json({ error: 'Failed to reject request' });
  }
};

// Get join requests for a group (creator only)
export const getJoinRequests = async (req, res) => {
  try {
    const { groupId } = req.params;
    
    const group = await Group.findById(groupId)
      .populate('joinRequests.userId', 'fullName email studentId');
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Check if user is group admin
    const requestorMember = group.members.find(m => m.userId.toString() === req.user.userId);
    if (!requestorMember || requestorMember.role !== 'admin') {
      return res.status(403).json({ error: 'Only group admins can view requests' });
    }
    
    const requests = group.joinRequests.map(req => ({
      user_id: req.userId._id,
      full_name: req.userId.fullName,
      email: req.userId.email,
      student_id: req.userId.studentId,
      message: req.message,
      requested_at: req.requestedAt
    }));
    
    res.json({ requests });
  } catch (error) {
    console.error('Get join requests error:', error);
    res.status(500).json({ error: 'Failed to fetch join requests' });
  }
};

// ====== NEW ENHANCED FEATURES ======

// Search/Browse groups with filters
export const searchGroups = async (req, res) => {
  try {
    const { query, category, tags } = req.query;
    const userId = req.user.userId;
    
    let filter = { isPublic: true };
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim());
      filter.tags = { $in: tagArray };
    }
    
    if (query) {
      filter.$text = { $search: query };
    }
    
    const groups = await Group.find(filter)
      .populate('creatorId', 'fullName email')
      .sort(query ? { score: { $meta: 'textScore' } } : { lastActivityAt: -1 })
      .limit(50);
    
    const groupsWithInfo = groups.map(group => {
      const isMember = group.members.some(m => m.userId && m.userId.toString() === userId);
      const hasPendingRequest = group.joinRequests.some(req => req.userId && req.userId.toString() === userId);
      
      return {
        ...group.toObject(),
        member_count: group.members.filter(m => m.userId).length,
        creator_name: group.creatorId?.fullName || 'Unknown User',
        is_member: isMember,
        has_pending_request: hasPendingRequest,
        is_full: group.members.filter(m => m.userId).length >= group.maxMembers
      };
    });
    
    res.json({ groups: groupsWithInfo });
  } catch (error) {
    console.error('Search groups error:', error);
    res.status(500).json({ error: 'Failed to search groups' });
  }
};

// Get group messages (chat/discussion)
export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { limit = 50, before } = req.query;
    const userId = req.user.userId;
    
    // Check if user is member
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    const isMember = group.members.some(m => m.userId.toString() === userId);
    if (!isMember) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }
    
    let query = { groupId, isDeleted: false };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }
    
    const messages = await GroupMessage.find(query)
      .populate('senderId', 'fullName email')
      .populate('replyTo')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json({ 
      messages: messages.reverse(),
      hasMore: messages.length === parseInt(limit)
    });
  } catch (error) {
    console.error('Get group messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// Send message to group
export const sendGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { content, replyTo } = req.body;
    const userId = req.user.userId;
    
    // Check if user is member
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    const isMember = group.members.some(m => m.userId.toString() === userId);
    if (!isMember) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }
    
    const message = await GroupMessage.create({
      groupId,
      senderId: userId,
      content,
      replyTo: replyTo || null
    });
    
    // Update group activity
    await group.updateActivity();
    
    await message.populate('senderId', 'fullName email');
    
    res.status(201).json({ message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Create group announcement
export const createAnnouncement = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { title, content, isPinned } = req.body;
    const userId = req.user.userId;
    
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Check if user is admin
    const member = group.members.find(m => m.userId.toString() === userId);
    if (!member || member.role !== 'admin') {
      return res.status(403).json({ error: 'Only group admins can create announcements' });
    }
    
    group.announcements.push({
      title,
      content,
      createdBy: userId,
      isPinned: isPinned || false,
      createdAt: new Date()
    });
    
    await group.updateActivity();
    await group.populate('announcements.createdBy', 'fullName');
    
    res.status(201).json({ 
      message: 'Announcement created',
      announcement: group.announcements[group.announcements.length - 1]
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
};

// Upload group resource
export const uploadResource = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description, fileUrl, fileType } = req.body;
    const userId = req.user.userId;
    
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    const isMember = group.members.some(m => m.userId.toString() === userId);
    if (!isMember) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }
    
    group.resources.push({
      name,
      description,
      fileUrl,
      fileType,
      uploadedBy: userId,
      uploadedAt: new Date()
    });
    
    await group.updateActivity();
    await group.populate('resources.uploadedBy', 'fullName');
    
    res.status(201).json({ 
      message: 'Resource uploaded',
      resource: group.resources[group.resources.length - 1]
    });
  } catch (error) {
    console.error('Upload resource error:', error);
    res.status(500).json({ error: 'Failed to upload resource' });
  }
};

// Get group statistics
export const getGroupStats = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.userId;
    
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    const isMember = group.members.some(m => m.userId.toString() === userId);
    if (!isMember) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }
    
    // Get message stats
    const totalMessages = await GroupMessage.countDocuments({ groupId, isDeleted: false });
    const last24hMessages = await GroupMessage.countDocuments({
      groupId,
      isDeleted: false,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    
    // Get active members (who sent messages in last 7 days)
    const activeMembers = await GroupMessage.distinct('senderId', {
      groupId,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
    
    res.json({
      stats: {
        total_members: group.members.length,
        total_messages: totalMessages,
        messages_last_24h: last24hMessages,
        active_members: activeMembers.length,
        total_resources: group.resources.length,
        total_announcements: group.announcements.length,
        activity_count: group.activityCount,
        created_at: group.createdAt,
        last_activity_at: group.lastActivityAt
      }
    });
  } catch (error) {
    console.error('Get group stats error:', error);
    res.status(500).json({ error: 'Failed to fetch group statistics' });
  }
};

// Delete announcement (admin only)
export const deleteAnnouncement = async (req, res) => {
  try {
    const { groupId, announcementId } = req.params;
    const userId = req.user.userId;
    
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    const member = group.members.find(m => m.userId.toString() === userId);
    if (!member || member.role !== 'admin') {
      return res.status(403).json({ error: 'Only group admins can delete announcements' });
    }
    
    group.announcements = group.announcements.filter(a => a._id.toString() !== announcementId);
    await group.save();
    
    res.json({ message: 'Announcement deleted' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
};

// Delete resource
export const deleteResource = async (req, res) => {
  try {
    const { groupId, resourceId } = req.params;
    const userId = req.user.userId;
    
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    const resource = group.resources.find(r => r._id.toString() === resourceId);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    // Only uploader or admin can delete
    const member = group.members.find(m => m.userId.toString() === userId);
    if (resource.uploadedBy.toString() !== userId && (!member || member.role !== 'admin')) {
      return res.status(403).json({ error: 'You cannot delete this resource' });
    }
    
    group.resources = group.resources.filter(r => r._id.toString() !== resourceId);
    await group.save();
    
    res.json({ message: 'Resource deleted' });
  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json({ error: 'Failed to delete resource' });
  }
};

// Delete group (creator only)
export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.userId;
    
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Only creator can delete the group
    if (group.creatorId.toString() !== userId) {
      return res.status(403).json({ error: 'Only group creator can delete the group' });
    }
    
    // Delete all messages associated with this group
    await GroupMessage.deleteMany({ groupId: group._id });
    
    // Delete the group
    await Group.findByIdAndDelete(groupId);
    
    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ error: 'Failed to delete group' });
  }
};
