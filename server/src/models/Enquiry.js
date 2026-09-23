import mongoose from 'mongoose';

const enquirySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    default: 'no-email-provided@lawzunction.in'
  },
  phone: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    required: true
  },
  practiceArea: {
    type: String,
    default: ''
  },
  urgency: {
    type: String,
    default: 'Routine'
  },
  type: {
    type: String,
    default: 'Smart Intake Inquiry'
  },
  status: {
    type: String,
    enum: ['NEW', 'CONTACTED', 'RESOLVED'],
    default: 'NEW'
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

const Enquiry = mongoose.models.Enquiry || mongoose.model('Enquiry', enquirySchema);
export default Enquiry;
