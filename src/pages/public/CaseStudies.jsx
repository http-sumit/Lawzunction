import { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { ArrowRight, Filter, Search } from 'lucide-react';
import './CaseStudies.css';

export default function CaseStudies() {
  const { caseStudies, practiceAreas, navigateTo } = useContext(AppContext);
  const [selectedPractice, setSelectedPractice] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCaseStudies = caseStudies.filter(study => {
    const matchesSearch = study.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          study.challenge.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPractice = selectedPractice ? study.practiceArea === selectedPractice : true;
    return matchesSearch && matchesPractice;
  });

  return (
    <div className="case-studies-page animate-fade-in">
      {/* Banner */}
      <section className="case-studies-hero">
        <div className="container text-center">
          <span className="section-tag">OUR SUCCESS STORIES</span>
          <h1 className="case-studies-hero-title">Case Studies</h1>
          <p className="case-studies-hero-subtitle">Proving capability through historical transaction resolutions and legal victories</p>
        </div>
      </section>

      {/* Filter ribbon */}
      <section className="case-studies-filters">
        <div className="container">
          <div className="filters-ribbon-card glass-card">
            <div className="filter-input-group search-bar">
              <Search size={16} className="gold-text" />
              <input
                type="text"
                placeholder="Search case studies..."
                className="filter-input-field"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-input-group">
              <Filter size={14} className="gold-text" />
              <select
                value={selectedPractice}
                onChange={(e) => setSelectedPractice(e.target.value)}
                className="filter-dropdown"
              >
                <option value="">All Practices</option>
                {practiceAreas.slice(0, 10).map(pa => (
                  <option key={pa.id} value={pa.name}>{pa.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Grid List */}
      <section className="section cases-grid-section">
        <div className="container">
          {filteredCaseStudies.length === 0 ? (
            <div className="text-center py-5">
              <h3 className="text-muted">No case studies matching your selection.</h3>
            </div>
          ) : (
            <div className="grid-3 cases-roster-grid">
              {filteredCaseStudies.map(study => (
                <div
                  key={study.id}
                  className="glass-card case-study-list-card"
                  onClick={() => navigateTo(`#/case-studies/${study.id}`)}
                >
                  <div className="case-study-list-header">
                    <span className="badge">{study.practiceArea}</span>
                    <span className="case-study-date">{study.date}</span>
                  </div>
                  <h3 className="case-study-list-title">{study.title}</h3>
                  <p className="case-study-list-desc">{study.challenge.slice(0, 150)}...</p>
                  <div className="case-study-list-footer">
                    <span className="case-study-sector-tag">{study.industry}</span>
                    <button className="btn-text">
                      Read Breakdown <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      
    </div>
  );
}
