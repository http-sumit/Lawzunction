import { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { ArrowLeft, MapPin, Globe, Award, BookOpen, GraduationCap, Briefcase, Calendar } from 'lucide-react';
import Avatar from '../../components/common/Avatar';
import './LawyerDetail.css';

export default function LawyerDetail({ onOpenBooking }) {
  const { routeParams, lawyers, navigateTo } = useContext(AppContext);

  // Retrieve lawyer by SEO slug, ID, or sanitized name
  const lawyer = lawyers.find(l => 
    l.slug === routeParams.lawyerId || 
    l.id === routeParams.lawyerId || 
    l._id === routeParams.lawyerId ||
    (l.name && l.name.toLowerCase().replace(/[^a-z0-9]/g, '-') === routeParams.lawyerId)
  );

  if (!lawyer) {
    return (
      <div className="container py-5 text-center">
        <h2>Attorney Profile Not Found</h2>
        <button className="btn btn-secondary mt-3" onClick={() => navigateTo('#/lawyers')}>
          Return to Lawyer Directory
        </button>
      </div>
    );
  }

  const getOfficeLocationName = () => {
    return '208 Indore Centre M.G. Road';
  };

  return (
    <div className="lawyer-detail-page animate-fade-in">
      {/* Banner */}
      <section className="detail-banner">
        <div className="container">
          <button className="back-link-btn" onClick={() => navigateTo('#/lawyers')}>
            <ArrowLeft size={16} /> Back to Directory
          </button>
          <div className="lawyer-header-profile">
            <Avatar name={lawyer.name} src={lawyer.photo} size={140} className="lawyer-big-avatar" />
            <div className="lawyer-header-info">
              <span className="section-tag">ATTORNEY BIOGRAPHY</span>
              <h1 className="lawyer-detail-name">{lawyer.name}</h1>
              <p className="lawyer-detail-title">{lawyer.title}</p>
              <div className="lawyer-detail-meta-list">
                <span className="meta-badge"><MapPin size={12} /> {lawyer.city || getOfficeLocationName(lawyer.id)}</span>
                <span className="meta-badge"><Globe size={12} /> {Array.isArray(lawyer.languages) ? lawyer.languages.join(', ') : 'English, Hindi'}</span>
                <span className="meta-badge"><Briefcase size={12} /> {lawyer.experience || 0} Years Experience</span>
                {lawyer.courts && <span className="meta-badge"><Award size={12} /> {lawyer.courts}</span>}
                {lawyer.barCouncilNumber && <span className="meta-badge"><Award size={12} /> Bar Reg: {lawyer.barCouncilNumber}</span>}
                {lawyer.consultationFee && <span className="meta-badge">Fee: {lawyer.consultationFee}</span>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Details */}
      <section className="section lawyer-body-section">
        <div className="container grid-sidebar">
          {/* Main Biography Column */}
          <div className="detail-main-col">
            {/* Bio */}
            <div className="detail-section-block">
              <h3 className="block-title">Professional Biography</h3>
              <p className="block-text">{lawyer.bio || 'Professional Legal Counsel'}</p>
            </div>

            {/* Representative Matters */}
            {lawyer.matters && lawyer.matters.length > 0 && (
              <div className="detail-section-block">
                <h3 className="block-title">Representative Matters</h3>
                <ul className="matters-list">
                  {lawyer.matters.map((matter, index) => (
                    <li key={index} className="matter-list-item">
                      <p className="matter-text">{matter}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Publications */}
            {lawyer.publications && lawyer.publications.length > 0 && (
              <div className="detail-section-block">
                <h3 className="block-title">Key Publications</h3>
                <ul className="publications-list">
                  {lawyer.publications.map((pub, index) => (
                    <li key={index} className="pub-list-item">
                      <BookOpen size={16} className="gold-text flex-shrink-0" />
                      <p className="pub-text">{pub}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar Credentials */}
          <div className="detail-sidebar-col">
            {/* Quick booking CTA */}
            <div className="glass-card sidebar-cta-box text-center">
              <h4>Consult with {(lawyer.name || 'Counsel').split(' ')[0]}</h4>
              <p>Schedule a 30-minute virtual consultation with our legal counsel.</p>
              <button className="btn btn-primary btn-block" onClick={onOpenBooking}>
                <Calendar size={16} /> Book Consultation
              </button>
              {lawyer.linkedin && (
                <a
                  href={lawyer.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="linkedin-link-btn"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-linkedin" style={{width: '14px', height: '14px'}}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg> Connect on LinkedIn
                </a>
              )}
            </div>

            {/* Education & Qualifications */}
            <div className="sidebar-credentials-card glass-card">
              <h4 className="credentials-title"><GraduationCap size={18} className="gold-text" /> Education</h4>
              <p className="credentials-text">{lawyer.education}</p>
            </div>

            {/* Awards & Recognition */}
            {lawyer.awards && lawyer.awards.length > 0 && (
              <div className="sidebar-credentials-card glass-card mt-3">
                <h4 className="credentials-title"><Award size={18} className="gold-text" /> Key Honors</h4>
                <ul className="credentials-bullets">
                  {lawyer.awards.map((award, index) => (
                    <li key={index}>{award}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      
    </div>
  );
}
