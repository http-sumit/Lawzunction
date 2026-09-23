import { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { Scale, Briefcase, Award, Clock, ArrowRight, ShieldCheck, Star, Users, Phone, Zap } from 'lucide-react';
import './Home.css';

export default function Home({ onOpenBooking }) {
  const { practiceAreas, articles, addLead } = useContext(AppContext);

  // Callback / Callback Lead Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleCallbackSubmit = (e) => {
    e.preventDefault();
    if (name && phone) {
      addLead({
        type: 'Callback Request',
        name,
        phone,
        practiceArea: area || 'General Inquiry'
      });
      setFormSubmitted(true);
      setName('');
      setPhone('');
      setArea('');
      setTimeout(() => setFormSubmitted(false), 5000);
    }
  };

  // Featured Practice Areas (Select top 8 for Home Grid)
  const featuredAreas = practiceAreas.slice(0, 8);

  // Latest 3 insights
  const latestInsights = articles.slice(0, 3);

  // Testimonials
  const testimonials = [
    { name: 'Ritesh Agarwal', company: 'Founder, Ovel Tech', quote: 'Lawzunction managed our Series A documentation flawlessly. Madhav Raghuwanshi and the legal team are exceptional advisors for early stage startups.' },
    { name: 'Sarah D’Souza', company: 'In-House Counsel, Apex Group', quote: 'Adv. Mayank Verma represents us in High Court disputes. His courtroom advocacy is stellar, and response times are unmatched.' },
    { name: 'Harish Kumar', company: 'CFO, Sterling Infrastructure', quote: 'Lawzunction saved our company from a major corporate dispute liability before the tribunal. Their legal strategy is a game changer.' }
  ];

  const [activeTestimonial, setActiveTestimonial] = useState(0);

  return (
    <div className="home-page-container">
      {/* 1. HERO SECTION */}
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-content">
            <span className="section-tag">PREMIUM LEGAL REPRESENTATION</span>
            <h1 className="hero-title">
              Your Trusted <span className="gradient-text">Legal Partner</span>
            </h1>
            <p className="hero-subtitle">
              Expert Legal Consultation, Litigation Support, and Legal Solutions Across India.
            </p>
            <div className="hero-buttons">
              <button className="btn btn-primary" onClick={onOpenBooking}>
                Book Consultation
              </button>
              <a href="#/practice-areas" className="btn btn-secondary">
                Explore Practice Areas
              </a>
            </div>
            <div className="hero-whatsapp-inline">
              <Phone size={14} className="gold-text" /> <strong>Emergency Hotline:</strong> +91 6263262661 (Available 24/7)
            </div>
          </div>
          <div className="hero-graphic-container">
            <div className="gavel-seal-card">
              <picture>
                <source
                  type="image/webp"
                  srcSet="/logo-240.webp?v=1.0 240w, /logo-480.webp?v=1.0 480w"
                  sizes="(max-width: 640px) 240px, 480px"
                />
                <source
                  type="image/jpeg"
                  srcSet="/logo-240.jpg?v=1.0 240w, /logo-480.jpg?v=1.0 480w"
                  sizes="(max-width: 640px) 240px, 480px"
                />
                <img
                  src="/logo-240.jpg?v=1.0"
                  alt="Lawzunction Logo"
                  className="seal-logo"
                  width="237"
                  height="91"
                  loading="eager"
                  fetchpriority="high"
                />
              </picture>
              <div className="seal-text-glow">ESTD 2023</div>
              <div className="seal-glow-line"></div>
              <p className="seal-motto">Integrity • Excellence • Confidentiality</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TRUST STATS STRIP */}
      <section className="trust-stats-strip">
        <div className="container stats-flex">
          <div className="stat-item">
            <div className="stat-num">5+</div>
            <div className="stat-label">Years of Experience</div>
          </div>
          <div className="stat-item border-left">
            <div className="stat-num">100+</div>
            <div className="stat-label">Matters Handled</div>
          </div>
          <div className="stat-item border-left">
            <div className="stat-num">3</div>
            <div className="stat-label">Main Offices</div>
          </div>
          <div className="stat-item border-left">
            <div className="stat-num">5+</div>
            <div className="stat-label"> Legal Awards</div>
          </div>
          <div className="stat-item border-left">
            <div className="stat-num">98%</div>
            <div className="stat-label">Client Satisfaction Score</div>
          </div>
        </div>
      </section>

      {/* 3. FEATURED PRACTICE AREAS */}
      <section className="section featured-practices-section">
        <div className="container">
          <div className="text-center">
            <span className="section-tag">OUR PRACTICE AREAS</span>
            <h2 className="section-title">Specialized Corporate & Trial Expertise</h2>
            <p className="section-subtitle">
              LawZunction is a full-service legal and business advisory platform providing comprehensive legal solutions to individuals, startups, businesses, and organizations. Our services cover corporate law, business advisory, contract drafting and review, regulatory compliance, dispute resolution, arbitration, mediation, civil and criminal litigation, family law, property matters, consumer disputes, labor and employment law, intellectual property, taxation, insolvency and bankruptcy matters before NCLT/NCLAT, and litigation before various High Courts and the Supreme Court of India. We are committed to delivering practical, strategic, and client-focused legal solutions with professionalism, integrity, and excellence.
            </p>
          </div>

          <div className="grid-4 practice-cards-grid">
            {featuredAreas.map((area) => (
              <div
                key={area.id}
                className="glass-card practice-card"
                onClick={() => window.location.hash = `#/practice-areas/${area.id}`}
              >
                <div className="practice-card-icon-box">
                  {/* Select corresponding icon */}
                  {area.id.includes('corporate') && <Briefcase className="card-icon" />}
                  {area.id.includes('m-and-a') && <Zap className="card-icon" />}
                  {area.id.includes('litigation') && <Scale className="card-icon" />}
                  {area.id.includes('intellectual') && <Award className="card-icon" />}
                  {area.id.includes('banking') && <ShieldCheck className="card-icon" />}
                  {area.id.includes('employment') && <Users className="card-icon" />}
                  {area.id.includes('startup') && <Zap className="card-icon" />}
                  {!['corporate', 'm-and-a', 'litigation', 'intellectual', 'banking', 'employment', 'startup'].some(x => area.id.includes(x)) && <Scale className="card-icon" />}
                </div>
                <h3 className="practice-card-title">{area.name}</h3>
                <p className="practice-card-desc">{area.description.slice(0, 100)}...</p>
                <span className="practice-card-link">
                  Learn More <ArrowRight size={14} />
                </span>
              </div>
            ))}
          </div>

          <div className="text-center view-all-practices-band">
            <a href="#/practice-areas" className="btn btn-secondary">
              View All 17 Practice Areas
            </a>
          </div>
        </div>
      </section>

      {/* 4. WHY CHOOSE US */}
      <section className="section why-choose-us-section">
        <div className="container grid-2 align-center">
          <div className="why-content-left">
            <span className="section-tag">THE LAWZUNCTION DIFFERENCE</span>
            <h2 className="section-title">Why Leading Corporates & Startups Choose Us</h2>
            <p className="why-desc-para">
              We design legal strategies aligned with your commercial goals. Our client roster includes multinational manufacturers, FinTech developers, early-stage unicorns, and high-net-worth individuals.
            </p>

            <div className="value-props-list">
              <div className="value-prop-item">
                <div className="value-prop-icon-box">
                  <Star size={18} className="gold-text" />
                </div>
                <div>
                  <h3>Top-Tier Attorneys</h3>
                  <p>Backed by legal expertise and a commitment to excellence, our team delivers practical, result-oriented solutions in complex legal and commercial matters, with a strong focus on client service and professional integrity.</p>
                </div>
              </div>
              <div className="value-prop-item">
                <div className="value-prop-icon-box">
                  <Clock size={18} className="gold-text" />
                </div>
                <div>
                  <h3>Fast Turnaround & Transparency</h3>
                  <p>24-hour initial response SLA on inquiries, with clean itemized billing via our client portal.</p>
                </div>
              </div>
              <div className="value-prop-item">
                <div className="value-prop-icon-box">
                  <Briefcase size={18} className="gold-text" />
                </div>
                <div>
                  <h3>Pan-India Network</h3>
                  <p>Cohesive legal services across locations in Indore, Jabalpur, Delhi, Bhopal, and Mumbai with local trial expertise.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="why-graphic-right">
            <div className="why-stats-card glass-card">
              <div className="why-stats-item">
                <span className="why-stat-big gold-text">100%</span>
                <p>Client Confidentiality Record</p>
              </div>
              <div className="why-stats-item border-top">
                <span className="why-stat-big gold-text">30+</span>
                <p>Attorneys & Paralegals</p>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 5. TESTIMONIALS */}
      <section className="section testimonials-section">
        <div className="container text-center">
          <span className="section-tag">CLIENT TESTIMONIALS</span>
          <h2 className="section-title">Trusted By Corporate Leaders</h2>

          <div className="testimonial-container glass-card">
            <div className="stars-row">
              <Star className="star-icon filled" />
              <Star className="star-icon filled" />
              <Star className="star-icon filled" />
              <Star className="star-icon filled" />
              <Star className="star-icon filled" />
            </div>
            <p className="testimonial-quote">
              "{testimonials[activeTestimonial].quote}"
            </p>
            <div className="testimonial-author">
              <strong>{testimonials[activeTestimonial].name}</strong>
              <span>{testimonials[activeTestimonial].company}</span>
            </div>

            <div className="testimonial-dots">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`dot-btn ${activeTestimonial === idx ? 'active' : ''}`}
                  onClick={() => setActiveTestimonial(idx)}
                  aria-label={`Go to testimonial ${idx + 1}`}
                  aria-current={activeTestimonial === idx ? 'true' : undefined}
                ></button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 7. INSIGHTS SECTION */}
      <section className="section insights-section">
        <div className="container">
          <div className="text-center">
            <span className="section-tag">LEGAL INSIGHTS</span>
            <h2 className="section-title">Latest from our Knowledge Center</h2>
            <p className="section-subtitle">Stay informed on critical regulatory amendments, statutory changes, and case commentaries.</p>
          </div>

          <div className="grid-3 insights-grid">
            {latestInsights.map((art) => (
              <div key={art.id} className="glass-card article-card">
                <div className="article-meta">
                  <span className="badge">{art.category}</span>
                  <span className="read-time">{art.readTime}</span>
                </div>
                <h3 className="article-card-title">{art.title}</h3>
                <p className="article-card-desc">{art.summary}</p>
                <div className="article-card-bottom">
                  <span className="article-author">By {art.author}</span>
                  <button
                    className="btn-text"
                    onClick={() => window.location.hash = `#/insights/${art.id}`}
                  >
                    Read Article <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center view-all-practices-band">
            <a href="#/insights" className="btn btn-secondary">
              Explore Publication Library
            </a>
          </div>
        </div>
      </section>

      {/* 8. CONTACT CTA BAND WITH CALLBACK FORM */}
      <section className="contact-cta-band-section">
        <div className="container band-grid">
          <div className="band-left">
            <h2 className="band-title">Request a Strategic Callback</h2>
            <p className="band-desc">
              Have an urgent contract requirement or trial notice? Fill out this rapid intake form, and an associate from the relevant practice area will contact you within 2 business hours.
            </p>
            <div className="band-hotlines">
              <p><strong>Indore Office:</strong> +91 6363262661</p>
              <p><strong>Jabalpur Office:</strong> +91 6263241816</p>
            </div>
          </div>

          <div className="band-right glass-card">
            {formSubmitted ? (
              <div className="callback-success text-center animate-fade-in">
                <ShieldCheck className="success-check-icon" />
                <h4>Intake Submitted</h4>
                <p>An associate is reviewing your callback request. Talk to you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleCallbackSubmit} className="callback-form">
                <div className="form-group">
                  <label htmlFor="callback-name" className="form-label">Your Name</label>
                  <input
                    id="callback-name"
                    type="text"
                    required
                    placeholder="Full Name"
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="callback-phone" className="form-label">Phone Number</label>
                  <input
                    id="callback-phone"
                    type="tel"
                    required
                    placeholder="+91 XXXXX XXXXX"
                    className="form-control"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="callback-sector" className="form-label">Practice Group (Optional)</label>
                  <select
                    id="callback-sector"
                    className="form-control"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    aria-label="Practice Group"
                  >
                    <option value="">Select Sector</option>
                    <option value="Corporate Law">Corporate & M&A</option>
                    <option value="Dispute Resolution">Litigation & Dispute Resolution</option>
                    <option value="Intellectual Property">Intellectual Property</option>
                    <option value="Taxation">Taxation & Finance</option>
                    <option value="Other">General Legal Counsel</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary btn-block">
                  Request Callback
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      
    </div>
  );
}
