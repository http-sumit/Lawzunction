import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
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
  date: {
    type: String,
    required: true
  },
  timeSlot: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  practiceArea: {
    type: String,
    default: ''
  },
  feePaid: {
    type: String,
    default: '1,500 INR'
  },
  paymentStatus: {
    type: String,
    default: 'Paid'
  },
  zoomLink: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'CANCELLED'],
    default: 'PENDING'
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClientProfile',
    default: null
  },
  lawyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LawyerProfile',
    default: null
  },
  lawyerName: {
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

const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);
export default Appointment;
