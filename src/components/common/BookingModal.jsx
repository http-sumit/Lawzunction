import { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { X, Sparkles, CheckCircle, Send } from 'lucide-react';
import './BookingModal.css';

export default function BookingModal({ isOpen, onClose }) {
  const { lawyers, practiceAreas, addBooking } = useContext(AppContext);
  const [step, setStep] = useState(1); // 1: Form, 2: Success Request Submitted Pop-up

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [practiceArea, setPracticeArea] = useState('');
  const [selectedLawyer, setSelectedLawyer] = useState('');
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [description, setDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalBooking, setFinalBooking] = useState(null);

  if (!isOpen) return null;

  const handleBookConsultation = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const selectedLawyerObj = lawyers.find(l => l.name === selectedLawyer);
      const bookingRecord = await addBooking({
        name,
        email,
        phone,
        practiceArea,
        lawyer: selectedLawyer || undefined,
        lawyerName: selectedLawyer || undefined,
        lawyerId: selectedLawyerObj ? selectedLawyerObj.id : undefined,
        date,
        timeSlot,
        description,
        feePaid: 'Free Consultation',
        paymentStatus: 'Submitted'
      });

      setFinalBooking(bookingRecord || {
        id: `LWZ-REC-${Math.floor(100000 + Math.random() * 900000)}`,
        name,
        email,
        phone,
        practiceArea,
        lawyer: selectedLawyer || 'Lead Advocate',
        lawyerId: selectedLawyerObj ? selectedLawyerObj.id : 'LWZ-ATT-DEFAULT',
        date,
        timeSlot,
        zoomLink: `https://meet.google.com/law-${Math.random().toString(36).substring(2, 7)}-zunc`
      });
      setStep(2);
    } catch (err) {
      console.error('Booking error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setName('');
    setEmail('');
    setPhone('');
    setPracticeArea('');
    setSelectedLawyer('');
    setDate('');
    setTimeSlot('');
    setDescription('');
    setStep(1);
    onClose();
  };

  const timeSlots = [
    '10:00 AM - 10:30 AM',
    '11:00 AM - 11:30 AM',
    '02:00 PM - 02:30 PM',
    '03:30 PM - 04:00 PM',
    '04:30 PM - 05:00 PM'
  ];

  return (
    <div className="modal-backdrop">
      <div className="modal-content-card animate-fade-in">
        <button className="modal-close-btn" onClick={handleReset} aria-label="Close booking modal">
          <X size={20} />
        </button>

        {/* STEP 1: Intake & Scheduling Form */}
        {step === 1 && (
          <form className="booking-form-wizard" onSubmit={handleBookConsultation}>
            <h3 className="modal-title gradient-text">Book Legal Consultation</h3>
            <p className="modal-subtitle">Schedule a 30-minute virtual session with a specialized legal advisor.</p>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 XXXXX XXXXX"
                  className="form-control"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address (Optional)</label>
              <input
                type="email"
                placeholder="email@example.com"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Practice Area Group</label>
                <select
                  required
                  className="form-control"
                  value={practiceArea}
                  onChange={(e) => setPracticeArea(e.target.value)}
                >
                  <option value="">Select Specialization</option>
                  {practiceAreas.map(pa => (
                    <option key={pa.id} value={pa.name}>{pa.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Preferred Attorney (Optional)</label>
                <select
                  className="form-control"
                  value={selectedLawyer}
                  onChange={(e) => setSelectedLawyer(e.target.value)}
                >
                  <option value="">Auto-Assign Best Match</option>
                  {lawyers.map(l => (
                    <option key={l.id} value={l.name}>{l.name} ({l.title})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Select Date</label>
                <input
                  type="date"
                  required
                  className="form-control"
                  min={new Date().toISOString().split('T')[0]}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Preferred Time Slot</label>
                <select
                  required
                  className="form-control"
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                >
                  <option value="">Select Time Slot</option>
                  {timeSlots.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Brief Summary of Legal Assistance Needed</label>
              <textarea
                rows="3"
                placeholder="Include key details like case type, urgency, or relevant corporate background..."
                className="form-control"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
              {isSubmitting ? (
                <span>Submitting Consultation Request...</span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Send size={16} /> Submit Consultation Request
                </span>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Request Submitted Pop-Up Modal */}
        {step === 2 && finalBooking && (
          <div className="booking-success-wizard text-center animate-fade-in">
            <CheckCircle className="success-gavel-icon" />
            <h3 className="modal-title">Consultation Request Submitted!</h3>
            <p className="modal-subtitle">
              Your request has been successfully received by <strong>Lawzunction</strong>. A notification email with your booking details and lawyer ID has been dispatched to <strong>lawzunction@gmail.com</strong> and to your email address <strong>{email}</strong>.
            </p>

            <div className="receipt-container">
              <div className="receipt-header">
                <Sparkles size={16} className="gold-text" /> REQUEST DETAILS
              </div>
              <div className="receipt-details">
                <div className="receipt-row">
                  <span>Booking Reference:</span>
                  <span className="receipt-value font-mono">{finalBooking.id}</span>
                </div>
                <div className="receipt-row">
                  <span>Client Name:</span>
                  <span className="receipt-value">{finalBooking.name || name}</span>
                </div>
                <div className="receipt-row">
                  <span>Assigned Attorney:</span>
                  <span className="receipt-value">{finalBooking.lawyer || 'Lead Advocate'}</span>
                </div>
                <div className="receipt-row">
                  <span>Scheduled Session:</span>
                  <span className="receipt-value">{finalBooking.date} • {finalBooking.timeSlot}</span>
                </div>
                <div className="receipt-row">
                  <span>Practice Specialization:</span>
                  <span className="receipt-value">{finalBooking.practiceArea}</span>
                </div>
                <div className="receipt-row">
                  <span>Request Status:</span>
                  <span className="receipt-value gold-text">Dispatched to Lawzunction (Pending Review)</span>
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.3)', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.85rem', color: '#ffd700', textAlign: 'left', lineHeight: '1.5' }}>
              ℹ️ <strong>Lawyer Confirmation Pending:</strong> An official email has been sent directly to Lawzunction with full client details. Once our advocate reviews and accepts the slot, a final confirmation will be sent to your inbox.
            </div>

            <div className="success-buttons">
              <button className="btn btn-primary" onClick={handleReset} style={{ minWidth: '160px' }}>
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
