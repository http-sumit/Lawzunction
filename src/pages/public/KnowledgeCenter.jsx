import { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { Search, FileDown, BookOpen, Clock, User, ArrowRight } from 'lucide-react';
import './KnowledgeCenter.css';

export default function KnowledgeCenter() {
  const { articles, subscribeToBriefings, navigateTo } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Briefings state
  const [newsEmail, setNewsEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const categories = ['All', 'Articles', 'Regulatory Updates', 'Newsletters', 'Case Law Analysis', 'White Papers'];

  const filteredArticles = articles.filter(art => {
    const matchesSearch = art.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          art.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' ? true : art.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setSubscribeError('');
    if (!newsEmail.trim()) return;

    setSubscribing(true);
    const res = await subscribeToBriefings(newsEmail.trim());
    setSubscribing(false);

    if (res.success) {
      setSubscribed(true);
      setNewsEmail('');
      setTimeout(() => setSubscribed(false), 6000);
    } else {
      setSubscribeError(res.message || 'Failed to subscribe to briefings. Please try again.');
    }
  };

  const handleDownload = (fileName) => {
    alert(`Initiating download for: ${fileName}. A secure copy has been requested from our PDF center.`);
  };

  return (
    <div className="knowledge-center-page animate-fade-in">
      {/* Banner */}
      <section className="knowledge-hero">
        <div className="container text-center">
          <span className="section-tag">KNOWLEDGE CENTER</span>
          <h1 className="knowledge-hero-title">Insights & Publications</h1>
          <p className="knowledge-hero-subtitle">Meticulous case analyses, regulatory breakdowns, and legal alerts from our experts</p>

          <div className="knowledge-search-wrapper glass-card">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search legal updates, analysis, or guides..."
              className="knowledge-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="categories-filter-section">
        <div className="container">
          <div className="category-tabs-flex">
            {categories.map(cat => (
              <button
                key={cat}
                className={`category-tab-btn ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Listing Grid */}
      <section className="section articles-grid-section">
        <div className="container grid-sidebar">
          {/* Main Roster */}
          <div className="detail-main-col">
            {filteredArticles.length === 0 ? (
              <div className="text-center py-5">
                <h3 className="text-muted">No insights found. Try clearing filters or resetting search.</h3>
              </div>
            ) : (
              <div className="articles-vertical-list">
                {filteredArticles.map(art => (
                  <article key={art.id} className="glass-card article-list-item-card">
                    <div className="art-card-header">
                      <span className="badge">{art.category}</span>
                      <span className="art-read-time"><Clock size={12} /> {art.readTime}</span>
                    </div>
                    <h3 className="art-card-title" onClick={() => navigateTo(`#/insights/${art.id}`)}>
                      {art.title}
                    </h3>
                    <p className="art-card-summary">{art.summary}</p>
                    <div className="art-card-footer">
                      <div className="art-author-info">
                        <User size={14} className="gold-text" />
                        <span>By {art.author} • {art.date}</span>
                      </div>
                      <div className="art-actions">
                        <button
                          className="btn-text download-pub-btn"
                          onClick={() => handleDownload(art.downloadUrl)}
                          title="Download PDF"
                        >
                          <FileDown size={16} /> PDF
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => navigateTo(`#/insights/${art.id}`)}
                        >
                          Read <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar Newsletter & Publication Center */}
          <div className="detail-sidebar-col">
            {/* Newsletter form */}
            <div className="glass-card sidebar-newsletter-card">
              <BookOpen size={24} className="gold-text mb-2" />
              <h4>Subscribe to Briefings</h4>
              <p>Receive weekly updates detailing new legislation, supreme court judgments, and operational policies.</p>
              
              {subscribed ? (
                <div className="subscribed-box text-center animate-fade-in">
                  <span className="gold-text">✓ Subscribed Successfully</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="sidebar-news-form">
                  <input
                    type="email"
                    required
                    placeholder="Enter business email"
                    className="form-control"
                    value={newsEmail}
                    onChange={(e) => setNewsEmail(e.target.value)}
                    disabled={subscribing}
                  />
                  {subscribeError && (
                    <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.4rem', marginBottom: '0.4rem', fontWeight: 500 }}>
                      {subscribeError}
                    </p>
                  )}
                  <button type="submit" className="btn btn-primary btn-block" disabled={subscribing}>
                    {subscribing ? 'Subscribing...' : 'Subscribe'}
                  </button>
                </form>
              )}
            </div>

            {/* Publication center */}
            <div className="glass-card sidebar-downloads-card mt-3">
              <h4>Download Publications</h4>
              <p className="downloads-desc">Gated guides and legal digests compiled for corporate compliance offices.</p>
              <div className="downloads-list">
                <div className="download-row-item" onClick={() => handleDownload('DPDP_Compliance_Report_2026.pdf')}>
                  <FileDown size={16} className="gold-text" />
                  <div>
                    <h6>DPDP Compliance Report</h6>
                    <p>Size: 2.8 MB • PDF</p>
                  </div>
                </div>
                <div className="download-row-item" onClick={() => handleDownload('Indian_VC_Funding_Digest_2025.pdf')}>
                  <FileDown size={16} className="gold-text" />
                  <div>
                    <h6>Indian VC Funding Digest</h6>
                    <p>Size: 1.4 MB • PDF</p>
                  </div>
                </div>
                <div className="download-row-item" onClick={() => handleDownload('RERA_Judicial_Precedents.pdf')}>
                  <FileDown size={16} className="gold-text" />
                  <div>
                    <h6>RERA Judicial Precedents</h6>
                    <p>Size: 3.1 MB • PDF</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      
    </div>
  );
}
