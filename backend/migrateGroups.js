/**
 * Group Schema Migration Script
 * 
 * This script migrates existing Group documents from the old schema to the new enhanced schema.
 * Run this ONCE before deploying the new group features.
 * 
 * Usage: node migrateGroups.js
 */

import mongoose from 'mongoose';
import Group from './models/Group.js';
import dotenv from 'dotenv';

dotenv.config();

const migrateGroups = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Fetch all groups
    const groups = await Group.find({});
    console.log(`📊 Found ${groups.length} groups to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const group of groups) {
      // Check if already migrated (has userId in members)
      if (group.members.length > 0 && group.members[0].userId) {
        console.log(`⏭️  Group "${group.name}" already migrated, skipping...`);
        skippedCount++;
        continue;
      }

      // Store old members array
      const oldMembers = [...group.members];

      // Transform members to new format
      const newMembers = oldMembers.map((userId, index) => ({
        userId: userId,
        // First member (creator) becomes admin, others are members
        role: userId.toString() === group.creatorId.toString() ? 'admin' : 'member',
        joinedAt: group.createdAt || new Date()
      }));

      // Update group with new schema fields
      group.members = newMembers;
      
      // Set default values for new fields if not present
      if (!group.category) {
        group.category = 'general';
      }
      
      if (!group.tags) {
        group.tags = [];
      }
      
      if (!group.maxMembers || group.maxMembers === 10) {
        group.maxMembers = 50; // Upgrade to new default
      }
      
      if (!group.lastActivityAt) {
        group.lastActivityAt = group.createdAt || new Date();
      }
      
      if (!group.activityCount) {
        group.activityCount = 0;
      }
      
      if (!group.announcements) {
        group.announcements = [];
      }
      
      if (!group.resources) {
        group.resources = [];
      }

      // Save migrated group
      await group.save();
      console.log(`✅ Migrated group: "${group.name}" (${oldMembers.length} members)`);
      migratedCount++;
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successfully migrated: ${migratedCount} groups`);
    console.log(`   ⏭️  Already migrated (skipped): ${skippedCount} groups`);
    console.log(`   📦 Total groups: ${groups.length}`);
    console.log('\n🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run migration
console.log('🚀 Starting Group Schema Migration...\n');
migrateGroups();
