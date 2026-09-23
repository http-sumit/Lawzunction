import mongoose from 'mongoose';

const practiceAreaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  icon: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  overview: {
    type: String,
    default: ''
  },
  services: [{
    type: String
  }],
  faqs: [{
    q: String,
    a: String
  }]
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

const PracticeArea = mongoose.models.PracticeArea || mongoose.model('PracticeArea', practiceAreaSchema);
export default PracticeArea;
