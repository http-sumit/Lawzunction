import { useContext, useState, useEffect, lazy, Suspense } from 'react';
import { AppContext, AppProvider } from './context/AppContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import FloatingContactWidget from './components/common/FloatingContactWidget';
import Home from './pages/public/Home';

// Lazy-loaded pages and secondary components (code-split for fast initial paint)
const About = lazy(() => import('./pages/public/About'));
const PracticeAreas = lazy(() => import('./pages/public/PracticeAreas'));
const PracticeAreaDetail = lazy(() => import('./pages/public/PracticeAreaDetail'));
const LawyerDirectory = lazy(() => import('./pages/public/LawyerDirectory'));
const LawyerDetail = lazy(() => import('./pages/public/LawyerDetail'));
const CaseStudies = lazy(() => import('./pages/public/CaseStudies'));
const CaseStudyDetail = lazy(() => import('./pages/public/CaseStudyDetail'));
const KnowledgeCenter = lazy(() => import('./pages/public/KnowledgeCenter'));
const ArticleDetail = lazy(() => import('./pages/public/ArticleDetail'));
const Careers = lazy(() => import('./pages/public/Careers'));
const Contact = lazy(() => import('./pages/public/Contact'));
const LegalDocs = lazy(() => import('./pages/public/LegalDocs'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ClientPortal = lazy(() => import('./pages/client/ClientPortal'));
const BookingModal = lazy(() => import('./components/common/BookingModal'));

import './App.css';

function AppContent() {
  const { currentRoute, isServerWaking } = useContext(AppContext);

  useEffect(() => {
    let title = "Lawzunction | Strategic Corporate Law Firm & Advocacy";
    let description = "Lawzunction is a premier multi-practice corporate law firm in India, specializing in M&A, startups advisory, IP prosecution, tax optimization, and litigation defense.";
    let path = '/';

    if (currentRoute.startsWith('#/reset-password')) {
      title = "Reset Password | Lawzunction";
      description = "Reset your Lawzunction user account password securely.";
      path = '/reset-password';
    } else if (currentRoute.startsWith('#/forgot-password')) {
      title = "Forgot Password | Lawzunction";
      description = "Recover access to your Lawzunction client, advocate, or administrative account.";
      path = '/forgot-password';
    } else {
      switch (currentRoute) {
      case '#/':
      case '':
        break;
      case '#/about':
        title = "About Us | Lawzunction";
        description = "Learn about Lawzunction, our heritage, legal mission, advocacy ethics, and our commitment to premium client advocacy across India.";
        path = '/about';
        break;
      case '#/practice-areas':
        title = "Practice Areas & Specializations | Lawzunction";
        description = "Explore our multi-practice corporate law services including M&A, taxation, startup advisory, intellectual property, litigation, and data privacy.";
        path = '/practice-areas';
        break;
      case '#/practice-area-detail':
        title = "Practice Area Detail | Lawzunction";
        description = "In-depth overview of our specialized legal services, matters, FAQs, and specialized legal advocates.";
        path = '/practice-area-detail';
        break;
      case '#/lawyers':
        title = "Our Advocates & Partners | Lawzunction";
        description = "Meet our legal team of experienced partners, managing attorneys, and corporate advocates at Lawzunction.";
        path = '/lawyers';
        break;
      case '#/lawyer-detail':
        title = "Advocate Profile | Lawzunction";
        description = "Detailed profile, representative matters, publications, and professional achievements of our counsel.";
        path = '/lawyer-detail';
        break;
      case '#/case-studies':
        title = "Case Studies & Transactions | Lawzunction";
        description = "Review our proven legal track record in multi-million dollar cross-border acquisitions, tax arbitrations, and high-stakes litigation defense.";
        path = '/case-studies';
        break;
      case '#/case-study-detail':
        title = "Case Study Detail | Lawzunction";
        description = "Detailed breakdown of the legal challenges, strategic counsel, and successful client outcomes in our key matters.";
        path = '/case-study-detail';
        break;
      case '#/insights':
        title = "Knowledge Center & Insights | Lawzunction";
        description = "Read recent legal regulatory updates, newsletters, white papers, and case law analyses published by Lawzunction.";
        path = '/insights';
        break;
      case '#/insight-detail':
        title = "Legal Analysis | Lawzunction";
        description = "Comprehensive legal analysis and compliance advisory on recent regulatory shifts in India.";
        path = '/insight-detail';
        break;
      case '#/careers':
        title = "Careers & Internships | Lawzunction";
        description = "Join our legal network. View open associate positions, paralegal roles, and internship opportunities at Lawzunction.";
        path = '/careers';
        break;
      case '#/contact':
        title = "Contact Offices | Lawzunction";
        description = "Get in touch with our Indore and Timarni offices. Submit a privilege-shielded intake inquiry to speak with our advocates.";
        path = '/contact';
        break;
      case '#/portal':
        title = "Secure Client Portal | Lawzunction";
        description = "Securely manage your active legal matters, share confidential files, communicate with your lead counsel, and pay retainer invoices.";
        path = '/portal';
        break;
      case '#/privacy-policy':
        title = "Privacy Policy | Lawzunction";
        description = "Privacy policy, data collection parameters, and customer security policies at Lawzunction.";
        path = '/privacy-policy';
        break;
      case '#/terms':
        title = "Terms of Service | Lawzunction";
        description = "Terms of service, usage conditions, and client agreements at Lawzunction.";
        path = '/terms';
        break;
      case '#/disclaimer':
        title = "BCI Disclaimer | Lawzunction";
        description = "Bar Council of India mandatory disclaimer regarding legal services and solicitation.";
        path = '/disclaimer';
        break;
      default:
        break;
      }
    }

    // Update document title
    document.title = title;
    
    // Update or create meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", description);
    } else {
      const meta = document.createElement('meta');
      meta.name = "description";
      meta.content = description;
      document.head.appendChild(meta);
    }

    // Update canonical URL
    const fullUrl = `https://www.lawzunction.in${path === '/' ? '/' : path}`;
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', fullUrl);
    }

    // Update Open Graph meta tags
    const ogUpdates = { 'og:title': title, 'og:description': description, 'og:url': fullUrl };
    for (const [prop, content] of Object.entries(ogUpdates)) {
      const el = document.querySelector(`meta[property="${prop}"]`);
      if (el) el.setAttribute('content', content);
    }

    // Update Twitter Card meta tags
    const twUpdates = { 'twitter:title': title, 'twitter:description': description };
    for (const [name, content] of Object.entries(twUpdates)) {
      const el = document.querySelector(`meta[name="${name}"]`);
      if (el) el.setAttribute('content', content);
    }
  }, [currentRoute]);
  const [bookingOpen, setBookingOpen] = useState(false);

  const renderPage = () => {
    if (currentRoute.startsWith('#/reset-password')) {
      return <ResetPassword />;
    }
    if (currentRoute.startsWith('#/forgot-password')) {
      return <ForgotPassword />;
    }

    switch (currentRoute) {
      case '#/':
      case '':
        return <Home onOpenBooking={() => setBookingOpen(true)} />;
      case '#/about':
        return <About />;
      case '#/practice-areas':
        return <PracticeAreas />;
      case '#/practice-area-detail':
        return <PracticeAreaDetail onOpenBooking={() => setBookingOpen(true)} />;
      case '#/lawyers':
        return <LawyerDirectory />;
      case '#/lawyer-detail':
        return <LawyerDetail onOpenBooking={() => setBookingOpen(true)} />;
      case '#/case-studies':
        return <CaseStudies />;
      case '#/case-study-detail':
        return <CaseStudyDetail onOpenBooking={() => setBookingOpen(true)} />;
      case '#/insights':
        return <KnowledgeCenter />;
      case '#/insight-detail':
        return <ArticleDetail />;
      case '#/careers':
        return <Careers />;
      case '#/contact':
        return <Contact />;
      case '#/portal':
        return <ClientPortal />;
      case '#/privacy-policy':
        return <LegalDocs type="privacy" />;
      case '#/terms':
        return <LegalDocs type="terms" />;
      case '#/disclaimer':
        return <LegalDocs type="disclaimer" />;
      default:
        return <Home onOpenBooking={() => setBookingOpen(true)} />;
    }
  };


  return (
    <div className="app-layout">
      {/* Sticky Header */}
      <Navbar onOpenBooking={() => setBookingOpen(true)} />

      {/* Render instance wake-up notification banner */}
      {isServerWaking && (
        <aside 
          aria-live="polite"
          style={{
            background: 'linear-gradient(90deg, #07172e 0%, #1e3a8a 100%)',
            color: '#fbbf24',
            fontSize: '0.85rem',
            padding: '8px 16px',
            textAlign: 'center',
            borderBottom: '1px solid rgba(251, 191, 36, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            zIndex: 99999
          }}
        >
          <span 
            aria-hidden="true"
            style={{ 
              width: '14px', 
              height: '14px', 
              borderRadius: '50%', 
              border: '2px solid #fbbf24', 
              borderTopColor: 'transparent', 
              display: 'inline-block',
              animation: 'spin 1s linear infinite' 
            }} 
          />
          <span>Connecting to secure server... Initializing backend instance.</span>
        </aside>
      )}
      
      {/* Main Pages Flow with Lazy Loading Boundary */}
      <main className="main-content-flow">
        <Suspense fallback={<div className="route-loading-fallback" style={{ minHeight: '50vh' }} />}>
          {renderPage()}
        </Suspense>
      </main>

      {/* Corporate Footer */}
      <Footer />

      {/* Unified Floating Contact Widget (Call, WhatsApp, AI Chatbot) */}
      <FloatingContactWidget />

      {/* Booking Wizard (Loaded only when opened) */}
      {bookingOpen && (
        <Suspense fallback={null}>
          <BookingModal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} />
        </Suspense>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
