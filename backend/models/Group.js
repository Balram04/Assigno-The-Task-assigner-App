import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  // Group Category for better organization
  category: {
    type: String,
    enum: ['study', 'project', 'class', 'general'],
    default: 'general'
  },
  // Tags for better discoverability
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  coverImage: {
    type: String, // URL to group cover image
    default: ''
  },
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Join request system
  joinRequests: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    message: {
      type: String,
      trim: true
    }
  }],
  // Group announcements
  announcements: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isPinned: {
      type: Boolean,
      default: false
    }
  }],
  // Group resources/files
  resources: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: String,
    fileUrl: {
      type: String,
      required: true
    },
    fileType: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Group settings
  isPublic: {
    type: Boolean,
    default: true // Public groups can be discovered and joined
  },
  maxMembers: {
    type: Number,
    default: 50,
    min: 2,
    max: 100
  },
  // Activity tracking
  lastActivityAt: {
    type: Date,
    default: Date.now
  },
  activityCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for id (to match frontend expectations)
groupSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Virtual for member count
groupSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Index for performance
groupSchema.index({ creatorId: 1 });
groupSchema.index({ 'members.userId': 1 });
groupSchema.index({ category: 1 });
groupSchema.index({ tags: 1 });
groupSchema.index({ isPublic: 1, lastActivityAt: -1 });
groupSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Update last activity timestamp
groupSchema.methods.updateActivity = function() {
  this.lastActivityAt = new Date();
  this.activityCount += 1;
  return this.save();
};

const Group = mongoose.model('Group', groupSchema);

export default Group;
