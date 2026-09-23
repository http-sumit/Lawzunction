import { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { ArrowLeft, CheckCircle, ShieldCheck, Calendar } from 'lucide-react';
import Avatar from '../../components/common/Avatar';
import './CaseStudyDetail.css';

export default function CaseStudyDetail({ onOpenBooking }) {
  const { routeParams, caseStudies, lawyers, navigateTo } = useContext(AppContext);

  // Retrieve case study
  const study = caseStudies.find(s => s.id === routeParams.caseStudyId);

  if (!study) {
    return (
      <div className="container py-5 text-center">
        <h2>Case Study Not Found</h2>
        <button className="btn btn-secondary mt-3" onClick={() => navigateTo('#/case-studies')}>
          Return to Case Studies
        </button>
      </div>
    );
  }

  // Find lawyers involved safely
  const leadLawyers = lawyers.filter(l =>
    Array.isArray(study.lawyers) && study.lawyers.includes(l.name)
  );

  return (
    <div className="case-study-detail-page animate-fade-in">
      {/* Banner */}
      <section className="detail-banner">
        <div className="container">
          <button className="back-link-btn" onClick={() => navigateTo('#/case-studies')}>
            <ArrowLeft size={16} /> Back to Case Studies
          </button>
          <div className="case-header-meta">
            <span className="badge">{study.practiceArea}</span>
            <span className="meta-item"><Calendar size={12} /> {study.date}</span>
            <span className="meta-item-industry">{study.industry}</span>
          </div>
          <h1 className="case-detail-title gradient-text">{study.title}</h1>
        </div>
      </section>

      {/* Content */}
      <section className="section case-body-section">
        <div className="container grid-sidebar">
          {/* Main Case Analysis */}
          <div className="detail-main-col">
            {/* The Challenge */}
            <div className="detail-section-block">
              <h3 className="block-title">The Challenge</h3>
              <p className="block-text">{study.challenge}</p>
            </div>

            {/* The Strategy */}
            <div className="detail-section-block">
              <h3 className="block-title">Our Strategic Strategy</h3>
              <p className="block-text">{study.strategy}</p>
            </div>

            {/* The Outcome */}
            <div className="detail-section-block">
              <h3 className="block-title">The Outcome</h3>
              <div className="outcome-highlight-box glass-card">
                <CheckCircle size={24} className="gold-text flex-shrink-0" />
                <p className="outcome-text">{study.outcome}</p>
              </div>
            </div>

            {/* Key Takeaways */}
            <div className="detail-section-block">
              <h3 className="block-title">Key Takeaways</h3>
              <ul className="takeaways-bullets">
                {study.takeaways.map((takeaway, idx) => (
                  <li key={idx} className="takeaway-item glass-card">
                    <ShieldCheck size={16} className="gold-text flex-shrink-0" />
                    <p>{takeaway}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sidebar Attorney and CTA */}
          <div className="detail-sidebar-col">
            {/* Appointment box */}
            <div className="glass-card sidebar-cta-box text-center">
              <h4>Face a Similar Legal Dispute?</h4>
              <p>Schedule a privileged meeting with our litigation & advisory experts.</p>
              <button className="btn btn-primary btn-block" onClick={onOpenBooking}>
                Book consultation
              </button>
            </div>

            {/* Lawyers involved */}
            {leadLawyers.length > 0 && (
              <div className="sidebar-roster-box">
                <h4 className="sidebar-section-title">Legal Counsel In Charge</h4>
                <div className="sidebar-lawyers-list">
                  {leadLawyers.map(l => (
                    <div
                      key={l.id}
                      className="glass-card lawyer-sidebar-card"
                      onClick={() => navigateTo(`#/lawyers/${l.id}`)}
                    >
                      <Avatar name={l.name} src={l.photo} size={40} className="lawyer-avatar-mini" />
                      <div>
                        <h6>{l.name}</h6>
                        <p>{l.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      
    </div>
  );
}
