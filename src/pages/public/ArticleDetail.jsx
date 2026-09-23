import { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { ArrowLeft, User, Calendar, Clock, Download } from 'lucide-react';
import Avatar from '../../components/common/Avatar';
import './ArticleDetail.css';

export default function ArticleDetail() {
  const { routeParams, articles, lawyers, navigateTo } = useContext(AppContext);

  // Retrieve article
  const article = articles.find(art => art.id === routeParams.articleId);

  if (!article) {
    return (
      <div className="container py-5 text-center">
        <h2>Publication Not Found</h2>
        <button className="btn btn-secondary mt-3" onClick={() => navigateTo('#/insights')}>
          Return to Knowledge Center
        </button>
      </div>
    );
  }

  // Find corresponding lawyer if exists
  const authorLawyer = lawyers.find(l => l.name === article.author);

  const handleDownload = (fileName) => {
    alert(`Initiating download for: ${fileName}. Secure copy fetched successfully.`);
  };

  return (
    <div className="article-detail-page animate-fade-in">
      {/* Banner */}
      <section className="detail-banner">
        <div className="container">
          <button className="back-link-btn" onClick={() => navigateTo('#/insights')}>
            <ArrowLeft size={16} /> Back to Knowledge Center
          </button>
          <div className="article-header-meta">
            <span className="badge">{article.category}</span>
            <span className="meta-item"><Calendar size={12} /> {article.date}</span>
            <span className="meta-item"><Clock size={12} /> {article.readTime}</span>
          </div>
          <h1 className="article-detail-title gradient-text">{article.title}</h1>
        </div>
      </section>

      {/* Main Body */}
      <section className="section article-body-section">
        <div className="container grid-sidebar">
          {/* Main Article Content */}
          <div className="detail-main-col">
            <div className="glass-card article-content-card">
              <p className="article-lead-text">{article.summary}</p>
              
              {/* Splitting mock text into multiple paragraphs for visual quality */}
              <div className="article-paragraphs">
                <p className="art-para">
                  {article.content}
                </p>
                <p className="art-para">
                  As regulatory frameworks tighten across jurisdictions, corporate compliance officer checklists continue to grow. It is no longer sufficient to carry out audits once a year. Successful regulatory shielding demands that data governance, POSH protocols, and contractual terms are integrated into standard daily operations.
                </p>
                <p className="art-para">
                  For businesses planning transactions, early preparation of files and clearing zoning or FDI guidelines prevents delay. Working closely with counsel ensures that negotiations are completed within targets, while maintaining strong compliance standards.
                </p>
              </div>

              {/* Gated file download CTA */}
              <div className="article-gated-download-box">
                <div className="download-text-left">
                  <h5>Reference Documentation Available</h5>
                  <p>Download the fully annotated PDF briefing ({article.downloadUrl}) for reference.</p>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => handleDownload(article.downloadUrl)}
                >
                  <Download size={16} /> Download Briefing
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar Author Info */}
          <div className="detail-sidebar-col">
            {/* Author Profile card */}
            {authorLawyer ? (
              <div className="glass-card author-profile-sidebar-card text-center">
                <Avatar name={authorLawyer.name} src={authorLawyer.photo} size={70} className="author-avatar" style={{ margin: '0 auto 1rem auto' }} />
                <h4 className="author-name">{authorLawyer.name}</h4>
                <p className="author-title">{authorLawyer.title}</p>
                <hr className="divider" />
                <p className="author-bio-snippet">{authorLawyer.bio.slice(0, 100)}...</p>
                <button
                  className="btn btn-secondary btn-block mt-3"
                  onClick={() => navigateTo(`#/lawyers/${authorLawyer.id}`)}
                >
                  View Full Bio
                </button>
              </div>
            ) : (
              <div className="glass-card author-profile-sidebar-card text-center">
                <Avatar name={article.author} size={60} style={{ margin: '0 auto 12px auto' }} />
                <h4 className="author-name">{article.author}</h4>
                <p className="author-title">Lawzunction Contributor</p>
              </div>
            )}
          </div>
        </div>
      </section>

      
    </div>
  );
}
