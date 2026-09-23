import mongoose from 'mongoose';

const newsletterSchema = new mongoose.Schema({
  name: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['Newsletter', 'Briefings'],
    default: 'Newsletter'
  },
  source: {
    type: String,
    default: 'Website'
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

const Newsletter = mongoose.models.Newsletter || mongoose.model('Newsletter', newsletterSchema);
export default Newsletter;
