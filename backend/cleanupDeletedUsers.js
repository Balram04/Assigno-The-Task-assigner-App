import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Group from './models/Group.js';
import User from './models/User.js';

dotenv.config();

/**
 * Cleanup Script: Remove deleted users from groups
 * This script removes references to deleted users from group members and join requests
 */

const cleanupDeletedUsers = async () => {
  try {
    console.log('🔧 Starting cleanup of deleted users from groups...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all groups
    const groups = await Group.find({});
    console.log(`📊 Found ${groups.length} groups to check\n`);

    let groupsUpdated = 0;
    let membersRemoved = 0;
    let requestsRemoved = 0;

    for (const group of groups) {
      let groupModified = false;
      const originalMemberCount = group.members.length;
      const originalRequestCount = group.joinRequests.length;

      // Check creator - if deleted, you may want to reassign ownership
      if (group.creatorId) {
        const creatorExists = await User.findById(group.creatorId);
        if (!creatorExists) {
          console.log(`⚠️  Group "${group.name}" has deleted creator`);
          
          // Try to find an admin member to transfer ownership
          const adminMember = group.members.find(m => m.role === 'admin' && m.userId);
          if (adminMember) {
            const adminUser = await User.findById(adminMember.userId);
            if (adminUser) {
              group.creatorId = adminMember.userId;
              groupModified = true;
              console.log(`   ✓ Transferred ownership to ${adminUser.fullName}`);
            }
          } else {
            // Find any valid member
            const anyMember = group.members.find(m => m.userId);
            if (anyMember) {
              const memberUser = await User.findById(anyMember.userId);
              if (memberUser) {
                group.creatorId = anyMember.userId;
                anyMember.role = 'admin'; // Promote to admin
                groupModified = true;
                console.log(`   ✓ Transferred ownership to ${memberUser.fullName} (promoted to admin)`);
              }
            }
          }
        }
      }

      // Clean up members with deleted users
      const validMembers = [];
      for (const member of group.members) {
        if (member.userId) {
          const userExists = await User.findById(member.userId);
          if (userExists) {
            validMembers.push(member);
          } else {
            membersRemoved++;
            console.log(`   ✗ Removing deleted member from "${group.name}"`);
          }
        } else {
          membersRemoved++;
          console.log(`   ✗ Removing null member from "${group.name}"`);
        }
      }

      if (validMembers.length !== originalMemberCount) {
        group.members = validMembers;
        groupModified = true;
      }

      // Clean up join requests with deleted users
      const validRequests = [];
      for (const request of group.joinRequests) {
        if (request.userId) {
          const userExists = await User.findById(request.userId);
          if (userExists) {
            validRequests.push(request);
          } else {
            requestsRemoved++;
            console.log(`   ✗ Removing deleted join request from "${group.name}"`);
          }
        } else {
          requestsRemoved++;
          console.log(`   ✗ Removing null join request from "${group.name}"`);
        }
      }

      if (validRequests.length !== originalRequestCount) {
        group.joinRequests = validRequests;
        groupModified = true;
      }

      // Check if group should be deleted (no valid members left)
      if (group.members.length === 0) {
        console.log(`   🗑️  Deleting empty group: "${group.name}"`);
        await Group.findByIdAndDelete(group._id);
        groupsUpdated++;
        continue;
      }

      // Save if modified
      if (groupModified) {
        await group.save();
        groupsUpdated++;
        console.log(`   ✓ Updated group: "${group.name}"`);
      }
    }

    console.log('\n📊 Cleanup Summary:');
    console.log(`   - Groups checked: ${groups.length}`);
    console.log(`   - Groups updated: ${groupsUpdated}`);
    console.log(`   - Members removed: ${membersRemoved}`);
    console.log(`   - Join requests removed: ${requestsRemoved}`);
    console.log('\n✅ Cleanup completed successfully!');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the cleanup
cleanupDeletedUsers();
