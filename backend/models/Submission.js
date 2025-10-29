import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'submitted', 'reviewed', 'graded'],
    default: 'pending'
  },
  submissionNotes: {
    type: String,
    trim: true
  },
  // File upload fields
  uploadedFiles: [{
    filename: String,
    originalName: String,
    path: String,
    mimetype: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Grading fields
  grade: {
    type: Number,
    min: 0,
    max: 100
  },
  feedback: {
    type: String,
    trim: true
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  submittedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for id (to match frontend expectations)
submissionSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Compound indexes for queries
submissionSchema.index({ assignmentId: 1, groupId: 1 }, { unique: true });
submissionSchema.index({ groupId: 1 });
submissionSchema.index({ submittedBy: 1 });
submissionSchema.index({ confirmationStep: 1 });

const Submission = mongoose.model('Submission', submissionSchema);

export default Submission;
