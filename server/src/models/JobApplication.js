import mongoose from 'mongoose';

const jobApplicationSchema = new mongoose.Schema({
  jobId: {
    type: String,
    required: true
  },
  jobTitle: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  coverLetter: {
    type: String,
    default: ''
  },
  fileName: {
    type: String,
    default: ''
  },
  resumeData: {
    type: Buffer,
    default: null,
    select: false // Exclude from normal queries for fast list retrieval
  },
  resumeContentType: {
    type: String,
    default: 'application/pdf'
  },
  resumeSize: {
    type: Number,
    default: 0
  },
  hasResume: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      ret.hasResume = Boolean(doc.hasResume || doc.resumeData || doc.fileName);
      delete ret._id;
      delete ret.__v;
      delete ret.resumeData;
      return ret;
    }
  }
});

const JobApplication = mongoose.models.JobApplication || mongoose.model('JobApplication', jobApplicationSchema);
export default JobApplication;
