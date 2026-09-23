import { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { ChevronDown, FileText, ArrowLeft, Calendar } from 'lucide-react';
import Avatar from '../../components/common/Avatar';
import './PracticeAreaDetail.css';

export default function PracticeAreaDetail({ onOpenBooking }) {
  const { routeParams, practiceAreas, lawyers, articles, navigateTo } = useContext(AppContext);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  // Retrieve practice area
  const practice = practiceAreas.find(p => p.id === routeParams.practiceId);

  if (!practice) {
    return (
      <div className="container py-5 text-center">
        <h2>Practice Area Not Found</h2>
        <button className="btn btn-secondary mt-3" onClick={() => navigateTo('#/practice-areas')}>
          Return to Practice Areas
        </button>
      </div>
    );
  }

  // Filter relevant lawyers safely
  const relevantLawyers = lawyers.filter(l =>
    Array.isArray(l.specializations) && l.specializations.includes(practice.name)
  );

  // Filter relevant articles safely
  const relevantArticles = articles.filter(art =>
    art.practiceArea && practice.name && art.practiceArea.toLowerCase() === practice.name.toLowerCase()
  );

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="practice-detail-page animate-fade-in">
      {/* Header Banner */}
      <section className="detail-banner">
        <div className="container">
          <button className="back-link-btn" onClick={() => navigateTo('#/practice-areas')}>
            <ArrowLeft size={16} /> Back to Practices
          </button>
          <span className="section-tag">PRACTICE AREA PROFILE</span>
          <h1 className="detail-title gradient-text">{practice.name}</h1>
          <p className="detail-subtitle">{practice.description}</p>
        </div>
      </section>

      {/* Main Content Sections */}
      <section className="section detail-content-section">
        <div className="container grid-3 grid-sidebar">
          {/* Main Body Column */}
          <div className="detail-main-col">
            {/* Overview */}
            <div className="detail-section-block">
              <h3 className="block-title">Overview</h3>
              <p className="block-text">{practice.overview}</p>
            </div>

            {/* Services List */}
            <div className="detail-section-block">
              <h3 className="block-title">Key Services We Offer</h3>
              <ul className="services-bullets-list">
                {practice.services.map((service, idx) => (
                  <li key={idx} className="service-bullet-item">
                    {service}
                  </li>
                ))}
              </ul>
            </div>

            {/* FAQs Accordion */}
            {practice.faqs && practice.faqs.length > 0 && (
              <div className="detail-section-block">
                <h3 className="block-title">Frequently Asked Questions</h3>
                <div className="faqs-accordion-container" itemScope itemType="https://schema.org/FAQPage">
                  {practice.faqs.map((faq, idx) => (
                    <div
                      key={idx}
                      className={`faq-accordion-item ${openFaqIndex === idx ? 'open' : ''}`}
                      itemProp="mainEntity"
                      itemScope
                      itemType="https://schema.org/Question"
                    >
                      <button
                        className="faq-question-toggle"
                        onClick={() => toggleFaq(idx)}
                        aria-expanded={openFaqIndex === idx}
                      >
                        <span itemProp="name">{faq.q}</span>
                        <ChevronDown className="faq-chevron" size={16} />
                      </button>
                      <div
                        className="faq-answer-collapse"
                        itemProp="acceptedAnswer"
                        itemScope
                        itemType="https://schema.org/Answer"
                      >
                        <div className="faq-answer-inner" itemProp="text">
                          {faq.a}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Column (Lawyers & Publications) */}
          <div className="detail-sidebar-col">
            {/* CTA Box */}
            <div className="glass-card sidebar-cta-box text-center">
              <h4>Need Legal Assistance?</h4>
              <p>Schedule a consult with our {practice.name} specialists today.</p>
              <button className="btn btn-primary btn-block" onClick={onOpenBooking}>
                <Calendar size={16} /> Book Session
              </button>
            </div>

            {/* Lawyers */}
            {relevantLawyers.length > 0 && (
              <div className="sidebar-roster-box">
                <h4 className="sidebar-section-title">Specialized Attorneys</h4>
                <div className="sidebar-lawyers-list">
                  {relevantLawyers.map(l => (
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

            {/* Related Publications */}
            {relevantArticles.length > 0 && (
              <div className="sidebar-roster-box mt-4">
                <h4 className="sidebar-section-title">Related Publications</h4>
                <div className="sidebar-articles-list">
                  {relevantArticles.map(art => (
                    <div
                      key={art.id}
                      className="glass-card article-sidebar-card"
                      onClick={() => navigateTo(`#/insights/${art.id}`)}
                    >
                      <FileText size={16} className="gold-text flex-shrink-0" />
                      <h6>{art.title}</h6>
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
