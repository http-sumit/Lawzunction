import { useContext, useState, useEffect, useRef } from 'react';
import { AppContext } from '../../context/AppContext';
import { Menu, X, User, LogOut, Key, ChevronDown, Shield, LayoutDashboard } from 'lucide-react';
import ProfileModal from './ProfileModal';
import Avatar from './Avatar';
import './Navbar.css';

export default function Navbar({ onOpenBooking }) {
  const { currentRoute, navigateTo, currentUser, logoutClient } = useContext(AppContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Ensure data-theme is cleared so site uses default light theme
    document.documentElement.removeAttribute('data-theme');
    localStorage.removeItem('lawz_theme');
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { name: 'Home', path: '#/' },
    { name: 'About', path: '#/about' },
    { name: 'Practice Areas', path: '#/practice-areas' },
    { name: 'Lawyers', path: '#/lawyers' },
    { name: 'Case Studies', path: '#/case-studies' },
    { name: 'Knowledge Center', path: '#/insights' },
    { name: 'Careers', path: '#/careers' },
    { name: 'Contact', path: '#/contact' }
  ];

  const handleNavClick = (path) => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    navigateTo(path);
  };

  const isActive = (path) => {
    if (path === '#/') {
      return currentRoute === '#/' || currentRoute === '';
    }
    return currentRoute.startsWith(path);
  };

  return (
    <>
      <header className="navbar-header">
        <div className="navbar-container">
          <div className="nav-logo" onClick={() => handleNavClick('#/')}>
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
                className="logo-img"
                width="237"
                height="91"
                loading="eager"
                fetchpriority="high"
              />
            </picture>
          </div>

          <nav className="nav-desktop">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.path}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.path);
                }}
                className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
              >
                {item.name}
              </a>
            ))}
          </nav>

          <div className="nav-actions">
            {currentUser ? (
              <div className="user-badge-wrapper" ref={dropdownRef}>
                <div 
                  className="portal-user-badge" 
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  style={{ cursor: 'pointer' }}
                  title="Account Options & Profile"
                >
                  <span className="user-icon-btn">
                    <Avatar name={currentUser.name} src={currentUser.photo} size={26} />
                    <span className="user-name-label">{(currentUser.name || 'User').split(' ')[0]}</span>
                    <ChevronDown size={14} style={{ color: '#c5a880', transition: 'transform 0.2s', transform: userDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
                  </span>
                </div>

                {userDropdownOpen && (
                  <div className="user-nav-dropdown animate-scale-up">
                    <div className="user-dropdown-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Avatar name={currentUser.name} src={currentUser.photo} size={36} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="user-dropdown-name">
                          <span>{currentUser.name}</span>
                          <span className="portal-role-badge" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>{currentUser.role}</span>
                        </div>
                        <div className="user-dropdown-email">{currentUser.email}</div>
                      </div>
                    </div>

                    <button
                      className="user-dropdown-item"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setProfileModalOpen(true);
                      }}
                    >
                      <Key size={14} className="gold-text" /> Change Password & Profile
                    </button>

                    <button
                      className="user-dropdown-item"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        handleNavClick('#/portal');
                      }}
                    >
                      <LayoutDashboard size={14} className="gold-text" /> Portal Workspace
                    </button>

                    <div className="user-dropdown-divider" />

                    <button
                      className="user-dropdown-item"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logoutClient();
                      }}
                      style={{ color: '#fc8181' }}
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <a
                href="#/portal"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick('#/portal');
                }}
                className={`portal-link-btn ${isActive('#/portal') ? 'active' : ''}`}
              >
                Portal Access
              </a>
            )}
            
            <button className="btn btn-primary nav-cta" onClick={onOpenBooking}>
              Book Consultation
            </button>

            <button className="mobile-toggle-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle Navigation Menu">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <div className={`mobile-nav-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-drawer-content">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.path}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(item.path);
              }}
              className={`mobile-nav-link ${isActive(item.path) ? 'active' : ''}`}
            >
              {item.name}
            </a>
          ))}
          <div className="mobile-drawer-actions">
            {currentUser ? (
              <>
                <div style={{ padding: '8px 12px', background: 'rgba(197, 168, 128, 0.12)', borderRadius: '6px', border: '1px solid rgba(197, 168, 128, 0.3)' }}>
                  <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{currentUser.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#c5a880', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <Shield size={12} /> {currentUser.role} • {currentUser.email}
                  </div>
                </div>

                <button
                  className="mobile-drawer-portal-btn logged-in"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setProfileModalOpen(true);
                  }}
                  style={{ gap: '8px' }}
                >
                  <Key size={16} className="gold-text" /> Change Password / Profile
                </button>

                <button
                  className="mobile-drawer-portal-btn"
                  onClick={() => handleNavClick('#/portal')}
                >
                  <User size={18} /> Open Portal Workspace
                </button>

                <button className="mobile-drawer-logout-btn" onClick={() => {
                  setMobileMenuOpen(false);
                  logoutClient();
                }}>
                  <LogOut size={16} /> Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  className="mobile-drawer-portal-btn"
                  onClick={() => handleNavClick('#/portal')}
                >
                  Portal Sign In
                </button>
                <button
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#c5a880',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: '4px'
                  }}
                  onClick={() => handleNavClick('#/forgot-password')}
                >
                  Forgot Password?
                </button>
              </>
            )}
            <button
              className="btn btn-primary btn-block"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBooking();
              }}
            >
              Book Consultation
            </button>
          </div>
        </div>
      </div>

      {/* Global Profile & Security Modal (Accessible anywhere across the site) */}
      <ProfileModal 
        isOpen={profileModalOpen} 
        onClose={() => setProfileModalOpen(false)} 
      />
    </>
  );
}
