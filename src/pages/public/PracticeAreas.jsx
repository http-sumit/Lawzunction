import { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { ArrowRight, Search } from 'lucide-react';
import './PracticeAreas.css';

export default function PracticeAreas() {
  const { practiceAreas, navigateTo } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter practices
  const filteredPractices = practiceAreas.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Groupings
  const categories = [
    {
      name: 'Corporate & Transactions',
      ids: ['corporate-commercial', 'm-and-a', 'startup-advisory', 'banking-finance', 'taxation', 'data-privacy', 'employment-law']
    },
    {
      name: 'Disputes & Insolvency',
      ids: ['litigation-arbitration', 'insolvency-bankruptcy', 'white-collar-crime']
    },
    {
      name: 'Property & Special Rights',
      ids: ['intellectual-property', 'real-estate', 'family-law', 'criminal-law']
    }
  ];

  return (
    <div className="practice-areas-page animate-fade-in">
      {/* Hero */}
      <section className="practices-hero">
        <div className="container text-center">
          <span className="section-tag">LEGAL CAPABILITIES</span>
          <h1 className="practices-hero-title">Practice Areas</h1>
          <p className="practices-hero-subtitle">Comprehensive Corporate, Transactional, and Litigation Solutions Across India</p>

          <div className="practices-search-wrapper glass-card">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search practices (e.g. corporate, trademark, compliance, litigation)..."
              className="practices-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Main Grid */}
      <section className="section practices-list-section">
        <div className="container">
          {searchTerm ? (
            // Search Results Grid
            <div className="search-results-area">
              <h3 className="category-title">Search Results ({filteredPractices.length})</h3>
              {filteredPractices.length === 0 ? (
                <p className="text-muted text-center py-5">No practice groups match your query. Try searching for "corporate", "IP", "tax", or "litigation".</p>
              ) : (
                <div className="grid-3 practice-cards-grid">
                  {filteredPractices.map(p => (
                    <div key={p.id} className="glass-card practice-listing-card" onClick={() => navigateTo(`#/practice-areas/${p.id}`)}>
                      <h4 className="practice-name-title">{p.name}</h4>
                      <p className="practice-name-desc">{p.description}</p>
                      <span className="practice-card-link">
                        Read Specializations <ArrowRight size={14} />
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Categorized List
            <div className="categorized-practices-container">
              {categories.map((cat, catIdx) => {
                const catPractices = practiceAreas.filter(p => cat.ids.includes(p.id));
                if (catPractices.length === 0) return null;
                
                return (
                  <div key={catIdx} className="practice-category-group">
                    <h3 className="category-title gradient-text">{cat.name}</h3>
                    <div className="grid-3 practice-cards-grid">
                      {catPractices.map(p => (
                        <div key={p.id} className="glass-card practice-listing-card" onClick={() => navigateTo(`#/practice-areas/${p.id}`)}>
                          <h4 className="practice-name-title">{p.name}</h4>
                          <p className="practice-name-desc">{p.description}</p>
                          <span className="practice-card-link">
                            Explore Services <ArrowRight size={14} />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      
    </div>
  );
}
