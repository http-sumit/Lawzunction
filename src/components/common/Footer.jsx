import { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  const { navigateTo, addNewsletterSubscriber } = useContext(AppContext);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const isValidEmail = (val) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(val).trim());
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Please enter your contact number.');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (!isValidEmail(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    try {
      const res = await addNewsletterSubscriber({ name: name.trim(), phone: phone.trim(), email: email.trim() });
      if (res && res.success !== false) {
        setSubmitted(true);
        setName('');
        setPhone('');
        setEmail('');
        setErrorMsg('');
        setTimeout(() => setSubmitted(false), 5000);
      } else {
        setErrorMsg(res?.message || 'Failed to subscribe. Please try again.');
      }
    } catch {
      setErrorMsg('Failed to subscribe. Please try again.');
    }
  };

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        {/* About Section */}
        <div className="footer-col-brand">
          <div className="footer-logo" onClick={() => navigateTo('#/')}>
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
                className="logo-img-footer"
                width="237"
                height="91"
                loading="lazy"
              />
            </picture>
          </div>
          <p className="footer-tagline">
            Strategic Legal Solutions for Businesses, Startups & Individuals. Elevating advocate ethics and litigation excellence pan-India.
          </p>
          <div className="social-links">
            <a href="https://www.linkedin.com/company/lawzunction/" className="social-icon">LinkedIn</a>
            <a href="https://www.instagram.com/lawzunction?igsh=MXBicGdvZDB3MTNneg==" className="social-icon">Instagram</a>
            <a href="https://www.facebook.com/share/1AmDnXFPSc/" className="social-icon">Facebook</a>
          </div>
        </div>

        {/* Contact Info / Locations */}
        <div className="footer-col">
          <h3 className="footer-col-title">Our Offices</h3>
          <ul className="footer-contact-list">
            <li>
              <div className="contact-item-title"><MapPin size={14} className="gold-text" /> Indore (M.P.) </div>
              <p className="contact-details">208 ,Indore Centre,Opposite Highcourt, M.G.Road, Indore -452001</p>
              <p className="contact-phone"><Phone size={12} /> +91 6263262661</p>
              <p className="contact-email"><Mail size={12} /> <a href="mailto:lawzunction@gmail.com">lawzunction@gmail.com</a></p>
            </li>
            <li>
              <div className="contact-item-title"><MapPin size={14} className="gold-text" /> Timarni (M.P)</div>
              <p className="contact-details">Bhuskutte Colony, Ward no. 07, Timarni (M.P) -461228</p>
              <p className="contact-phone"><Phone size={12} /> +91 6263241816</p>
              <p className="contact-email"><Mail size={12} /> <a href="mailto:lawzunction@gmail.com">lawzunction@gmail.com</a></p>
            </li>
            <li>
              <div className="contact-item-title"><MapPin size={14} className="gold-text" /> Indore (M.P)</div>
              <p className="contact-details">75, Galaxy Homes, Behind Tejaji Mandir, Indore, Madhya Pradesh-452020 </p>
              <p className="contact-phone"><Phone size={12} /> +91 9302146846</p>
              <p className="contact-email"><Mail size={12} /> <a href="mailto:lawzunction@gmail.com">lawzunction@gmail.com</a></p>
            </li>
          </ul>
        </div>

        {/* Newsletter Section */}
        <div className="footer-col-news">
          <h3 className="footer-col-title">Newsletter</h3>
          <p className="newsletter-desc">Subscribe to receive regular regulatory summaries, case law briefs, and firm news.</p>
          <form className="newsletter-form" onSubmit={handleSubscribe}>
            <div className="newsletter-inputs">
              <label htmlFor="newsletter-name" className="sr-only">Your Name</label>
              <input
                id="newsletter-name"
                type="text"
                placeholder="Your Name"
                aria-label="Your Name"
                className="form-control newsletter-input"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                required
              />
              <label htmlFor="newsletter-phone" className="sr-only">Contact Number</label>
              <input
                id="newsletter-phone"
                type="tel"
                placeholder="Contact Number"
                aria-label="Contact Number"
                className="form-control newsletter-input"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                required
              />
              <label htmlFor="newsletter-email" className="sr-only">Email Address</label>
              <input
                id="newsletter-email"
                type="email"
                placeholder="Email Address"
                aria-label="Email Address"
                className="form-control newsletter-input"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                required
              />
            </div>
            {errorMsg && (
              <p className="newsletter-error animate-fade-in" style={{ color: '#ef4444', fontSize: '0.82rem', marginTop: '0.4rem', marginBottom: '0.4rem', fontWeight: 500 }}>
                {errorMsg}
              </p>
            )}
            <button type="submit" className="btn btn-primary newsletter-btn" aria-label="Subscribe">
              Subscribe <Send size={16} />
            </button>
          </form>
          {submitted && (
            <p className="newsletter-success animate-fade-in">
              Thank you for subscribing!
            </p>
          )}
        </div>
      </div>

      {/* Bar Council Disclaimer Banner */}
      <div className="container footer-disclaimer-box">
        <h5 className="disclaimer-title">BAR COUNCIL OF INDIA DISCLAIMER</h5>
        <p className="disclaimer-text">
          The Bar Council of India does not permit advertisement or solicitation by advocates in any form or manner. By accessing this website, <a href="https://www.lawzunction.in" target="_blank" rel="noopener noreferrer" style={{ color: '#c5a880', textDecoration: 'underline' }}>www.lawzunction.in</a>, you acknowledge and confirm that you are seeking information relating to Lawzunction of your own accord and that there has been no form of solicitation, advertisement or inducement by Lawzunction or its members. The content of this website is for informational purposes only and should not be interpreted as soliciting or advertisement. No material/information provided on this website should be construed as legal advice. Lawzunction shall not be liable for consequences of any action taken by relying on the material/information provided on this website. The contents of this website are the intellectual property of Lawzunction.
        </p>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-flex">
          <p>&copy; {new Date().getFullYear()} Lawzunction Partners. All Rights Reserved. <span className="footer-dev-credit">| Designed &amp; Developed by <span className="gold-text">Sumit Ransurma</span></span></p>
          <div className="footer-bottom-links">
            <a href="#/portal">Portal Access</a>
            <a href="#/forgot-password">Forgot Password</a>
            <a href="#/privacy-policy">Privacy Policy</a>
            <a href="#/terms">Terms of Service</a>
            <a href="#/disclaimer">Disclaimer</a>
          </div>
        </div>
      </div>

      
    </footer>
  );
}
