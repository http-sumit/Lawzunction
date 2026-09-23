import { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { Search, MapPin, Globe, Filter, ArrowRight } from 'lucide-react';
import Avatar from '../../components/common/Avatar';
import './LawyerDirectory.css';

export default function LawyerDirectory() {
  const { lawyers, practiceAreas, navigateTo } = useContext(AppContext);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPractice, setSelectedPractice] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');

  // Extract unique locations from mock lawyer properties (using locations mapped to their profile titles/bios)
  const locationsList = ['208 Indore Centre M.G. Road'];
  
  // Extract unique languages
  const languagesList = ['English', 'Hindi'];

  const filteredLawyers = lawyers.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          l.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPractice = selectedPractice ? l.specializations.includes(selectedPractice) : true;
    
    // Check location match using bio/matters or static assign
    let locationMatch = true;
    if (selectedLocation) {
      locationMatch = selectedLocation === '208 Indore Centre M.G. Road';
    }

    const matchesLanguage = selectedLanguage ? l.languages.includes(selectedLanguage) : true;

    return matchesSearch && matchesPractice && locationMatch && matchesLanguage;
  });

  const getOfficeLocationName = () => {
    return '208 Indore Centre M.G. Road';
  };

  return (
    <div className="lawyer-directory-page animate-fade-in">
      {/* Header Banner */}
      <section className="directory-hero">
        <div className="container text-center">
          <span className="section-tag">ATTORNEY DIRECTORY</span>
          <h1 className="directory-hero-title">Meet Our Attorneys</h1>
          <p className="directory-hero-subtitle">Elite Pedigree advocate partners providing client-centric corporate defense and advisory</p>
        </div>
      </section>

      {/* Filter Ribbon */}
      <section className="directory-filters-section">
        <div className="container">
          <div className="filters-ribbon-card glass-card">
            <div className="filter-input-group search-bar">
              <Search size={16} className="gold-text" />
              <input
                type="text"
                placeholder="Search lawyer by name..."
                className="filter-input-field"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-select-row">
              {/* Practice Select */}
              <div className="filter-input-group">
                <Filter size={14} className="gold-text" />
                <select
                  value={selectedPractice}
                  onChange={(e) => setSelectedPractice(e.target.value)}
                  className="filter-dropdown"
                >
                  <option value="">All Practices</option>
                  {practiceAreas.map(pa => (
                    <option key={pa.id} value={pa.name}>{pa.name}</option>
                  ))}
                </select>
              </div>

              {/* Location Select */}
              <div className="filter-input-group">
                <MapPin size={14} className="gold-text" />
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="filter-dropdown"
                >
                  <option value="">All Office Locations</option>
                  {locationsList.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Language Select */}
              <div className="filter-input-group">
                <Globe size={14} className="gold-text" />
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="filter-dropdown"
                >
                  <option value="">All Languages</option>
                  {languagesList.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roster Grid */}
      <section className="section roster-grid-section">
        <div className="container">
          {filteredLawyers.length === 0 ? (
            <div className="text-center py-5">
              <h3 className="text-muted">No lawyers match the selected filters.</h3>
              <button
                className="btn btn-secondary mt-3"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedPractice('');
                  setSelectedLocation('');
                  setSelectedLanguage('');
                }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid-3 roster-cards-grid">
              {filteredLawyers.map(l => (
                <div
                  key={l.id || l.slug}
                  className="glass-card lawyer-profile-card"
                  onClick={() => navigateTo(`#/lawyers/${l.slug || l.id}`)}
                >
                  <Avatar name={l.name} src={l.photo} size={90} className="lawyer-avatar-circle" />
                  <h3 className="lawyer-card-name">{l.name}</h3>
                  <span className="lawyer-card-title">{l.title}</span>
                  
                  <div className="lawyer-card-meta">
                    <p className="lawyer-meta-item"><MapPin size={12} className="gold-text" /> {l.city || getOfficeLocationName(l.id)}</p>
                    <p className="lawyer-meta-item"><Globe size={12} className="gold-text" /> {Array.isArray(l.languages) ? l.languages.join(', ') : 'English, Hindi'}</p>
                  </div>

                  <hr className="divider" />
                  
                  <div className="lawyer-card-specializations">
                    {l.specializations.map((spec, index) => (
                      <span key={index} className="spec-label-badge">{spec}</span>
                    ))}
                  </div>

                  <div className="lawyer-card-footer">
                    <button className="btn-text">
                      View Biography <ArrowRight size={14} />
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
