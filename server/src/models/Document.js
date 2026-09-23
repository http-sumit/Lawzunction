import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  size: {
    type: String,
    default: '0 MB'
  },
  uploadedBy: {
    type: String,
    required: true
  },
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    default: null
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClientProfile',
    default: null
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
documentSchema.index({ caseId: 1, createdAt: -1 });
documentSchema.index({ clientId: 1, createdAt: -1 });

const Document = mongoose.models.Document || mongoose.model('Document', documentSchema);
export default Document;
