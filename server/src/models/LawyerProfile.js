import mongoose from 'mongoose';

const lawyerProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    default: 'Advocate'
  },
  experience: {
    type: Number,
    required: true,
    default: 0
  },
  specializations: [{
    type: String
  }],
  bio: {
    type: String,
    default: ''
  },
  languages: [{
    type: String
  }],
  education: {
    type: String,
    default: ''
  },
  linkedin: {
    type: String,
    default: ''
  },
  photo: {
    type: String,
    default: ''
  },
  barCouncilNumber: {
    type: String,
    default: ''
  },
  courts: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: ''
  },
  consultationFee: {
    type: mongoose.Schema.Types.Mixed,
    default: ''
  },
  slug: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  profileStatus: {
    type: String,
    enum: ['incomplete', 'pending_review', 'published', 'rejected'],
    default: 'incomplete'
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  submittedAt: {
    type: Date,
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  mustChangePassword: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE'],
    default: 'ACTIVE'
  }
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Index for public search and filtering
lawyerProfileSchema.index({ profileStatus: 1, city: 1, experience: 1 });

const LawyerProfile = mongoose.models.LawyerProfile || mongoose.model('LawyerProfile', lawyerProfileSchema);
export default LawyerProfile;
