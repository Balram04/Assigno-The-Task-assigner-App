import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    enum: ['student', 'admin'],
    default: 'student'
  },
  studentId: {
    type: String,
    sparse: true,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for id (to match frontend expectations)
userSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Index for performance - removed unique from field definition to avoid duplicate
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ studentId: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);

export default User;
