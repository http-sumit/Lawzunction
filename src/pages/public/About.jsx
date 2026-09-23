import { Scale, Heart, Shield, CheckCircle, Award, Landmark, Eye } from 'lucide-react';
import './About.css';

export default function About() {
  const values = [
    { title: 'Absolute Integrity', desc: 'Advocate ethics are at the center of our counsel. We deliver realistic legal assessments, avoiding exaggerated promises.', icon: <Scale className="gold-text" size={24} /> },
    { title: 'Ironclad Confidentiality', desc: 'Your business trade secrets, IP, and personal litigation cases are guarded under strict data governance and attorney-client privileges.', icon: <Shield className="gold-text" size={24} /> },
    { title: 'Technical Excellence', desc: 'We deliver meticulous legal drafting, exhaustive research, and sharp trial representation, setting industry precedents.', icon: <Award className="gold-text" size={24} /> },
    { title: 'Client-Centric Pragmatism', desc: 'We translate complex statutory provisions into commercial action steps, protecting your transaction timelines.', icon: <Heart className="gold-text" size={24} /> }
  ];

  return (
    <div className="about-page animate-fade-in">
      {/* Page Header */}
      <section className="about-hero">
        <div className="container text-center">
          <span className="section-tag">WHO WE ARE</span>
          <h1 className="about-hero-title">Justice Through Expertise. Excellence Through Integrity.</h1>
          <p className="about-hero-subtitle">Est. 2023 • Serving Clients Across India with Comprehensive Legal Advisory and Litigation Services.</p>
        </div>
      </section>

      {/* Firm Story */}
      <section className="section story-section">
        <div className="container grid-2 align-center">
          <div>
            <h2 className="section-title">Our Story & Mission</h2>
            <p className="story-para">
              Lawzunction was founded with a vision to provide accessible, reliable, and result-oriented legal services. We serve individuals, businesses, startups, and institutions across India, offering comprehensive legal advisory, dispute resolution, and representation before courts, tribunals, High Courts, the Supreme Court of India, and NCLT/NCLAT. Our mission is to deliver strategic legal solutions with professionalism, integrity, and excellence while helping clients navigate legal challenges with confidence and achieve the best possible outcomes.
            </p>
            <p className="story-para">
              Today, Lawzunction provides comprehensive legal and business advisory services across India. We combine strong advocacy with practical legal solutions, helping individuals, startups, businesses, and institutions navigate legal challenges with confidence, clarity, and professionalism.
            </p>
            <div className="story-mission-vision">
              <div className="m-v-item">
                <Eye size={20} className="gold-text" />
                <div>
                  <h5>Our Vision</h5>
                  <p>To remain India’s most trusted multi-office advocate partnership, setting benchmarks in ethical representation and corporate advisory.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="story-image-box">
            <div className="law-library-mock glass-card">
              <div className="library-spine-strip">
                <span>CONSTITUTION OF INDIA</span>
                <span>COMPANIES ACT 2013</span>
                <span>ARBITRATION LAW</span>
                <span>DPDP ACT GUIDE</span>
              </div>
              <div className="library-seal">⚖️</div>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Message */}
      <section className="section leadership-message-section">
        <div className="container">
          <div className="message-container glass-card">
            <h3 className="message-title">Message from the Founder of Lawzunction</h3>
            <p className="message-text">
              “I always believed that the law should not be a barrier but a facilitator of growth. With Lawzunction, we are building a modern, transparent, and client-first legal practice where every solution is practical and every relationship is built on trust. I am grateful to our team and clients for making this journey meaningful.”
            </p>
            <div className="leadership-signature">
              <div className="sig-line"></div>
              <h4>Madhav Raghuwanshi</h4>
              <p>Founder of Lawzunction</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="section values-section">
        <div className="container">
          <div className="text-center">
            <span className="section-tag">OUR FOUNDATIONAL PILLARS</span>
            <h2 className="section-title">Core Corporate Values</h2>
            <p className="section-subtitle">The principles that govern our advocacy and define our partnerships with clients.</p>
          </div>

          <div className="grid-2 values-grid">
            {values.map((v, idx) => (
              <div key={idx} className="glass-card value-card">
                <div className="value-card-header">
                  <div className="value-icon-wrapper">{v.icon}</div>
                  <h4>{v.title}</h4>
                </div>
                <p className="value-card-desc">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Awards & Recognition */}
      <section className="section awards-section">
        <div className="container text-center">
          <span className="section-tag">OUR COMMITMENT TO EXCELLENCE</span>
          <h2 className="section-title">Trusted Legal Solutions For Individuals & Businesses</h2>
          <p className="section-subtitle">With our team of experienced lawyers and legal professionals, we provide reliable legal solutions to individuals and businesses across India.</p>

          <div className="awards-grid grid-4">
            <div className="award-item-card glass-card">

              <h5>Litigation Excellence</h5>
              <p>Representing clients before District Courts, High Courts, Tribunals & Consumer Forums.</p>
            </div>
            <div className="award-item-card glass-card">

              <h5>Corporate & Commercial Advisory</h5>
              <p>Business agreements, legal compliance, contracts, due diligence & corporate governance.</p>
            </div>
            <div className="award-item-card glass-card">

              <h5>Client-Centric Approach</h5>
              <p>Personalized legal strategies with transparent communication and dedicated support.</p>
            </div>
            <div className="award-item-card glass-card">

              <h5>Research & Knowledge Driven</h5>
              <p>Strong legal research, drafting expertise, and up-to-date regulatory insights.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Memberships & Affiliations */}
      <section className="section memberships-section">
        <div className="container">
          <div className="text-center">
            <span className="section-tag">PROFESSIONAL NETWORKS</span>
            <h2 className="section-title">Bar Memberships & Global Footprint</h2>
            <p className="section-subtitle">Connecting local trial expertise with international commercial networks.</p>
          </div>

          <div className="memberships-list-grid grid-3">
            <div className="membership-badge-card glass-card">
              <Landmark size={24} className="gold-text" />
              <h4>Bar Council of India</h4>
              <p>All senior partners are licensed advocates registered with state bar councils and Supreme Court Bar Associations.</p>
            </div>
            <div className="membership-badge-card glass-card">
              <Scale size={24} className="gold-text" />
              <h4>International Bar Association</h4>
              <p>Active participants in corporate M&A committees and transnational litigation exchange protocols.</p>
            </div>
            <div className="membership-badge-card glass-card">
              <CheckCircle size={24} className="gold-text" />
              <h4>Global Legal Network</h4>
              <p>We partner with law firms worldwide to provide seamless cross-border legal support to our clients.</p>
            </div>
          </div>
        </div>
      </section>

      
    </div>
  );
}
