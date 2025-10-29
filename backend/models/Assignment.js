import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  onedriveLink: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isForAll: {
    type: Boolean,
    default: false
  },
  assignedGroups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for id (to match frontend expectations)
assignmentSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Indexes for performance
assignmentSchema.index({ createdBy: 1 });
assignmentSchema.index({ dueDate: 1 });
assignmentSchema.index({ assignedGroups: 1 });

const Assignment = mongoose.model('Assignment', assignmentSchema);

export default Assignment;
