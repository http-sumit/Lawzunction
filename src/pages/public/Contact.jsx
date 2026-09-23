import { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { MapPin, Phone, Mail, Clock, ShieldAlert, CheckCircle } from 'lucide-react';
import './Contact.css';

export default function Contact() {
  const { addLead } = useContext(AppContext);

  // Office details database
  const offices = [
    {
      id: 'indore_mg',
      name: 'Indore 01',
      address: "208 ,Indore Centre,Opposite Highcourt, M.G.Road, Indore -452001",
      phone: '+91 6263262661',
      email: 'lawzunction@gmail.com',
      hours: 'Mon - Sat, 09:00 AM - 07:00 PM',
      coordinates: '22.720166° N, 75.872239° E'
    },
    {
      id: 'timarni',
      name: 'Timarni',
      address: 'Bhuskutte Colony, Ward no. 07, Timarni (M.P) -461228',
      phone: '+91 6263241816',
      email: 'lawzunction@gmail.com',
      hours: 'Mon - Fri, 09:30 AM - 06:30 PM',
      coordinates: '22.369230° N, 77.226143° E'
    },
    {
      id: 'indore_galaxy',
      name: 'Indore 02',
      address: '75, Galaxy Homes, Behind Tejaji Mandir, Indore, Madhya Pradesh-452020',
      phone: '+91 6263262661',
      email: 'lawzunction@gmail.com',
      hours: 'Mon - Fri, 09:30 AM - 06:30 PM',
      coordinates: '22.66286° N, 75.89253° E'
    }
  ];

  const [activeOffice, setActiveOffice] = useState('indore_mg');

  // Lead / Contact Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [practiceArea, setPracticeArea] = useState('');
  const [urgency, setUrgency] = useState('Routine');
  const [message, setMessage] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name && phone) {
      addLead({
        type: 'Smart Intake Inquiry',
        name,
        email,
        phone,
        subject,
        practiceArea,
        urgency,
        message
      });
      setFormSubmitted(true);
      // Clear form
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setPracticeArea('');
      setMessage('');
      setTimeout(() => setFormSubmitted(false), 5000);
    }
  };

  const selectedOffice = offices.find(o => o.id === activeOffice);

  return (
    <div className="contact-page animate-fade-in">
      {/* Header */}
      <section className="contact-hero">
        <div className="container text-center">
          <span className="section-tag">GET IN TOUCH</span>
          <h1 className="contact-hero-title">Contact Our Offices</h1>
          <p className="contact-hero-subtitle">Prompt Responses • Pan-India Advocacy Network</p>
        </div>
      </section>

      {/* Main Grid */}
      <section className="section contact-body-section">
        <div className="container grid-2">
          {/* Left: Offices list & Maps */}
          <div className="contact-offices-panel">
            <h2 className="section-title">Our Offices</h2>
            <p className="contact-intro">
              Toggle between our locations to view office coordinators, maps, and direct telephone lines.
            </p>

            <div className="office-tabs">
              {offices.map(o => (
                <button
                  key={o.id}
                  className={`office-tab-btn ${activeOffice === o.id ? 'active' : ''}`}
                  onClick={() => setActiveOffice(o.id)}
                >
                  {o.name}
                </button>
              ))}
            </div>

            <div className="office-details-card glass-card animate-fade-in" key={selectedOffice.id}>
              <div className="detail-row">
                <MapPin className="gold-text" size={18} />
                <div>
                  <h5>Address</h5>
                  <p>{selectedOffice.address}</p>
                </div>
              </div>
              <div className="detail-row">
                <Phone className="gold-text" size={18} />
                <div>
                  <h5>Phone Lines</h5>
                  <p>{selectedOffice.phone}</p>
                </div>
              </div>
              <div className="detail-row">
                <Mail className="gold-text" size={18} />
                <div>
                  <h5>Email Directory</h5>
                  <p><a href={`mailto:${selectedOffice.email}`} className="email-link">{selectedOffice.email}</a></p>
                </div>
              </div>
              <div className="detail-row">
                <Clock className="gold-text" size={18} />
                <div>
                  <h5>Office Hours</h5>
                  <p>{selectedOffice.hours}</p>
                </div>
              </div>
            </div>

            {/* Embedded Google Maps */}
            <div className="google-map-container glass-card">
              <iframe
                title="Google Map Location"
                width="100%"
                height="100%"
                style={{ border: 0, display: 'block' }}
                src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedOffice.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                allowFullScreen
                loading="lazy"
              ></iframe>
            </div>
          </div>

          {/* Right: Intake Form */}
          <div className="contact-intake-form-panel">
            <div className="glass-card form-outer-card">
              <h3 className="form-panel-title">Smart Intake Inquiry</h3>
              <p className="form-panel-desc">All inquiries are reviewable under attorney-client privilege. Field specialists will revert within 2 hours.</p>

              {formSubmitted ? (
                <div className="intake-success-state text-center animate-fade-in">
                  <CheckCircle className="success-icon" />
                  <h4>Inquiry Sent Successfully</h4>
                  <p>Our office coordinator has logged your case details. A legal associate will contact you shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="intake-form-grid">
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

                  <div className="form-row">
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

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Practice Specialization</label>
                      <select
                        required
                        className="form-control"
                        value={practiceArea}
                        onChange={(e) => setPracticeArea(e.target.value)}
                      >
                        <option value="">Select Category</option>
                        <option value="Corporate Law">Corporate & M&A</option>
                        <option value="Startup Advisory">Startup Advisory</option>
                        <option value="Dispute Resolution">Litigation & Disputes</option>
                        <option value="Intellectual Property">Intellectual Property</option>
                        <option value="Taxation">Taxation</option>
                        <option value="Other">General Advocacy</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Urgency Level</label>
                      <select
                        required
                        className="form-control"
                        value={urgency}
                        onChange={(e) => setUrgency(e.target.value)}
                      >
                        <option value="Routine">Routine (24 Hour Response)</option>
                        <option value="Urgent">Urgent (4 Hour Response)</option>
                        <option value="Critical">Immediate / Trial Notice</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Subject / Matter Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Contract Review, Breach Notice, Trademark Registration"
                      className="form-control"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Details / Case Description</label>
                    <textarea
                      required
                      rows="4"
                      placeholder="Please outline dates, company roles, jurisdictions, and context details..."
                      className="form-control"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    ></textarea>
                  </div>

                  <button type="submit" className="btn btn-primary btn-block">
                    Submit Privilege-Shielded Inquiry
                  </button>
                </form>
              )}
            </div>

            {/* Hotlines */}
            <div className="emergency-hotline-card glass-card">
              <ShieldAlert className="gold-text" size={24} />
              <div>
                <h5>24/7 Criminal & Arrest Emergency Line</h5>
                <p>For urgent police representation or search actions: <strong>+91 6263262661</strong></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      
    </div>
  );
}
