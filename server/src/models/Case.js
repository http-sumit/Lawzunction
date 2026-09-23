import mongoose from 'mongoose';

const caseSchema = new mongoose.Schema({
  caseNumber: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['OPEN', 'IN_PROGRESS', 'CLOSED'],
    default: 'IN_PROGRESS'
  },
  progress: {
    type: Number,
    default: 0
  },
  lastUpdate: {
    type: String,
    default: ''
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClientProfile',
    required: true
  },
  lawyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LawyerProfile',
    default: null
  },
  caseType: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  hearingDate: {
    type: String,
    default: ''
  },
  deadline: {
    type: String,
    default: ''
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

// Database indexes for frequent queries
caseSchema.index({ clientId: 1, status: 1 });
caseSchema.index({ lawyerId: 1, status: 1 });
caseSchema.index({ lawyerId: 1 });
caseSchema.index({ updatedAt: -1 });

const Case = mongoose.models.Case || mongoose.model('Case', caseSchema);
export default Case;
