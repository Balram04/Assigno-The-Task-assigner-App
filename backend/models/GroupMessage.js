import mongoose from 'mongoose';

const groupMessageSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  messageType: {
    type: String,
    enum: ['text', 'file', 'announcement'],
    default: 'text'
  },
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GroupMessage'
  },
  reactions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
groupMessageSchema.index({ groupId: 1, createdAt: -1 });
groupMessageSchema.index({ senderId: 1 });

// Virtual for id
groupMessageSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

groupMessageSchema.set('toJSON', { virtuals: true });
groupMessageSchema.set('toObject', { virtuals: true });

const GroupMessage = mongoose.model('GroupMessage', groupMessageSchema);

export default GroupMessage;
