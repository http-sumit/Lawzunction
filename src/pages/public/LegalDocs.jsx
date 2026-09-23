import './LegalDocs.css';

export default function LegalDocs({ type }) {
  const renderContent = () => {
    switch (type) {
      case 'privacy':
        return (
          <div className="legal-content animate-fade-in">
            <h1 className="legal-title">Privacy Policy</h1>
            <p className="legal-meta">Last Updated: June 21, 2026</p>
            
            <section className="legal-section">
              <h2>1. Introduction</h2>
              <p>
                Lawzunction Partners ("we," "our," or "the Firm") is committed to protecting the privacy and confidentiality of the personal data of our clients, website visitors, and users of our Secure Client Portal. This Privacy Policy outlines our practices regarding data collection, usage, sharing, and security in compliance with the Digital Personal Data Protection (DPDP) Act, 2023 of India, and other applicable global data standards.
              </p>
            </section>

            <section className="legal-section">
              <h2>2. Information We Collect</h2>
              <p>
                We collect personal information that you voluntarily provide to us when you request a consultation, fill out intake forms, register for our client portal, or communicate with us. This may include:
              </p>
              <ul>
                <li><strong>Identity Data:</strong> Full name, professional title, business name.</li>
                <li><strong>Contact Data:</strong> Email address, phone number, physical address.</li>
                <li><strong>Case & Matter Data:</strong> Confidential case backgrounds, legal documents, correspondence containing information protected under attorney-client privilege.</li>
                <li><strong>Transaction Data:</strong> Details of payments made through our secure billing partners.</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>3. How We Use Your Information</h2>
              <p>
                We process your personal data under legal bases specified under the law. We use your information to:
              </p>
              <ul>
                <li>Provide legal advisory, representation, and dispute resolution services.</li>
                <li>Operate the Secure Client Portal and enable privileged communications.</li>
                <li>Process billing, retainer payments, and tax invoices.</li>
                <li>Verify your identity and run conflict checks before onboarding you as a client.</li>
                <li>Comply with regulatory requirements established by the Bar Council of India (BCI).</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>4. Confidentiality and Privileged Communications</h2>
              <p>
                All communications and documents exchanged through our site, email channels, or client portal are subject to strict professional secrecy and attorney-client privilege under Indian Evidence Act guidelines. We do not disclose client data to third parties except as explicitly authorized by you or mandated by court orders.
              </p>
            </section>

            <section className="legal-section">
              <h2>5. Data Security</h2>
              <p>
                We employ high-end physical, administrative, and technical safeguards (including SSL encryption, secure servers, and portal authentication protocols) to prevent unauthorized access, alteration, or disclosure of your privileged files and data.
              </p>
            </section>

            <section className="legal-section">
              <h2>6. Your Rights</h2>
              <p>
                Under the DPDP Act, you have the right to request access to, correction of, or erasure of your personal data held by us. For any data query or grievance, please contact our designated coordinator at <a href="mailto:lawzunction@gmail.com" className="legal-link">lawzunction@gmail.com</a>.
              </p>
            </section>
          </div>
        );
      case 'terms':
        return (
          <div className="legal-content animate-fade-in">
            <h1 className="legal-title">Terms of Service</h1>
            <p className="legal-meta">Last Updated: June 21, 2026</p>

            <section className="legal-section">
              <h2>1. Acceptance of Terms</h2>
              <p>
                By accessing this website (https://lawzunction.in) or using our Secure Client Portal, you agree to comply with and be bound by these Terms of Service. If you do not agree, please discontinue use of this site immediately.
              </p>
            </section>

            <section className="legal-section">
              <h2>2. No Attorney-Client Relationship</h2>
              <p>
                Transmission of information from this website or request for consultation does not create an attorney-client relationship between you and Lawzunction. An attorney-client relationship is only established upon formal conflict check clearance, signing of a retainer engagement letter, and payment of the designated retainer fee.
              </p>
            </section>

            <section className="legal-section">
              <h2>3. Permitted Use & Security</h2>
              <p>
                You are granted a limited, non-exclusive license to view the informational resources on this site. If you use our Client Portal, you are solely responsible for maintaining the confidentiality of your secure credentials. Any unauthorized access to the portal must be reported to the Firm immediately.
              </p>
            </section>

            <section className="legal-section">
              <h2>4. Portal Payments & Refunds</h2>
              <p>
                Retainer payments, consulting fees, and filing fees made through the portal billing gateway are processed securely via authorized third-party gateways. Retainer terms, billing caps, and refund protocols are governed strictly by the formal Engagement Letter signed by the client and the Firm.
              </p>
            </section>

            <section className="legal-section">
              <h2>5. Limitation of Liability</h2>
              <p>
                The materials on this website are provided for general informational purposes only and do not constitute formal legal advice. While we endeavor to keep all statutory updates correct, the Firm is not liable for actions taken based on general information found on this website.
              </p>
            </section>

            <section className="legal-section">
              <h2>6. Jurisdiction</h2>
              <p>
                These terms are governed by and construed in accordance with the laws of India. Any disputes arising out of the use of this website shall be subject to the exclusive jurisdiction of the competent courts in Indore, Madhya Pradesh.
              </p>
            </section>
          </div>
        );
      case 'disclaimer':
        return (
          <div className="legal-content disclaimer-view animate-fade-in">
            <h1 className="legal-title">Bar Council of India Disclaimer</h1>
            <p className="legal-meta">Mandatory Regulatory Notification</p>

            <div className="disclaimer-alert-card">
              <p>
                <strong>Under the rules of the Bar Council of India (BCI)</strong>, Lawzunction Partners is prohibited from soliciting work and advertising in any form or manner.
              </p>
            </div>

            <section className="legal-section">
              <p>By clicking buttons on this site, visiting our pages, or registering on our portal, the user acknowledges the following:</p>
              <ul>
                <li>The user wishes to gain information about Lawzunction, its practice areas, and its advocate members for their own information and use.</li>
                <li>The information is provided to the user only on their specific request, and any transmission, receipt, or use of this site does not invite or establish an attorney-client relationship.</li>
                <li>None of the information, articles, newsletters, or publications available on this website constitute formal legal advice or an invitation to solicit legal representation.</li>
                <li>The Firm is not liable for any consequences of actions taken by the user relying on material or information provided on this website.</li>
              </ul>
            </section>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="legal-docs-page">
      <div className="container legal-container">
        <div className="legal-card-outer glass-card">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
