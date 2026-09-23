import { createContext, useState, useEffect } from 'react';
import { uploadFile } from '../config/storage.js';

/* eslint-disable react-refresh/only-export-components */
export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // --- HASH ROUTING STATE ---
  const resolveCurrentRoute = () => {
    if (window.location.hash) return window.location.hash;
    const path = window.location.pathname;
    if (path && path !== '/') return '#' + path;
    return '#/';
  };

  const [currentRoute, setCurrentRoute] = useState(resolveCurrentRoute());
  const [routeParams, setRouteParams] = useState({});

  useEffect(() => {
    const handleHashChange = () => {
      let hash = window.location.hash;
      if (!hash && window.location.pathname && window.location.pathname !== '/') {
        hash = '#' + window.location.pathname;
      }
      if (!hash) hash = '#/';

      // Parse params for routes like #/practice-areas/corporate-law
      if (hash.startsWith('#/practice-areas/')) {
        const id = hash.replace('#/practice-areas/', '');
        setRouteParams({ practiceId: id });
        setCurrentRoute('#/practice-area-detail');
      } else if (hash.startsWith('#/lawyers/')) {
        const id = hash.replace('#/lawyers/', '');
        setRouteParams({ lawyerId: id });
        setCurrentRoute('#/lawyer-detail');
      } else if (hash.startsWith('#/insights/')) {
        const id = hash.replace('#/insights/', '');
        setRouteParams({ articleId: id });
        setCurrentRoute('#/insight-detail');
      } else if (hash.startsWith('#/industries/')) {
        const id = hash.replace('#/industries/', '');
        setRouteParams({ industryId: id });
        setCurrentRoute('#/industry-detail');
      } else if (hash.startsWith('#/case-studies/')) {
        const id = hash.replace('#/case-studies/', '');
        setRouteParams({ caseStudyId: id });
        setCurrentRoute('#/case-study-detail');
      } else {
        setRouteParams({});
        setCurrentRoute(hash);
      }
      window.scrollTo(0, 0);
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    // Initial call
    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const navigateTo = (hash) => {
    window.location.hash = hash;
  };

  // --- MOCK DATABASE & FALLBACK ROSTER ---

  // 1. Practice Areas (17 categories)
  const initialPracticeAreas = [
    {
      id: 'corporate-commercial',
      name: 'Corporate & Commercial',
      icon: 'Briefcase',
      description: 'Comprehensive legal advisory on corporate structures, corporate governance, joint ventures, and drafting complex commercial contracts.',
      overview: 'Our Corporate & Commercial practice is the cornerstone of our firm. We counsel boards of directors, senior executives, and in-house legal teams of large conglomerates, mid-sized firms, and dynamic startups on standard operational advisory to heavy regulatory compliance.',
      services: ['Corporate Governance & Board Advisory', 'Joint Ventures & Strategic Alliances', 'Commercial Contracts Drafting & Review', 'Regulatory & Statutory Compliance', 'Foreign Direct Investment (FDI) & Exchange Control Guidelines'],
      faqs: [
        { q: 'What is your compliance retainer model?', a: 'We offer modular compliance retainer agreements billed monthly or quarterly, customized to your business sector and geographical footprint.' },
        { q: 'Can you assist with setting up foreign subsidiaries in India?', a: 'Yes, we specialize in cross-border corporate structure setups, RBI filings, FEMA regulations compliance, and local incorporating tasks.' }
      ],
      lawyerIds: ['madhav_raghuwanshi', 'Mayank_verma'],
      articleTags: ['Corporate', 'Compliance'],
      industries: ['Technology', 'Manufacturing', 'E-Commerce']
    },
    {
      id: 'm-and-a',
      name: 'M&A and Private Equity',
      icon: 'TrendingUp',
      description: 'End-to-end support for mergers, acquisitions, takeovers, joint ventures, venture capital deals, and general private equity transactions.',
      overview: 'We represent buyers, sellers, financial sponsors, and investment banks in complex corporate transactions. Our M&A and Private Equity practice provides strategic guidance on structuring, due diligence, negotiation, and integration.',
      services: ['Public and Private Mergers & Acquisitions', 'Cross-Border Transactions', 'Legal & Financial Due Diligence Reporting', 'Share Purchase Agreements (SPA) & Shareholders Agreements (SHA)', 'Venture Capital & Early-stage Fundings'],
      faqs: [
        { q: 'How long does a typical legal due diligence audit take?', a: 'Depending on company size and data room availability, due diligence typically takes between 2 to 6 weeks.' }
      ],
      lawyerIds: ['madhav_raghuwanshi'],
      articleTags: ['M&A', 'Venture Capital'],
      industries: ['Technology', 'FinTech', 'Energy']
    },
    {
      id: 'startup-advisory',
      name: 'Startup Advisory',
      icon: 'Rocket',
      description: 'Legal counseling for early-stage and high-growth startups from incorporation, funding cycles, ESOP design, to regulatory clearances.',
      overview: 'We support founders through the lifecycle of their venture. Our team assists with foundational legal documents, intellectual property protection, founder vesting, option pool allocations, and negotiating seed/series investment cycles.',
      services: ['Company Incorporation & Founder Agreements', 'ESOP (Employee Stock Ownership Plan) Designing', 'Seed and Venture Funding Transactions', 'Intellectual Property Strategy & Protection', 'General Regulatory Shield Audit'],
      faqs: [
        { q: 'What are key terms to look out for in a Term Sheet?', a: 'Founders must look closely at Liquidation Preferences, Anti-dilution clauses, Board seats, Right of First Refusal, and Protective provisions.' }
      ],
      lawyerIds: ['madhav_raghuwanshi'],
      articleTags: ['Startups', 'Intellectual Property'],
      industries: ['Technology', 'FinTech', 'E-Commerce']
    },
    {
      id: 'litigation-arbitration',
      name: 'Litigation & Arbitration',
      icon: 'Scale',
      description: 'Robust legal representation in high-stakes commercial disputes across tribunals, high courts, and supreme court litigation/arbitration.',
      overview: 'When disputes arise, we defend our clients with absolute commitment and tactical strategy. We handle commercial litigations, shareholder disputes, contract breaches, and domestic/international arbitrations under leading institutional rules.',
      services: ['Commercial Litigations & Writ Petitions', 'Domestic and International Arbitration', 'Insolvency Disputes before NCLT', 'Intellectual Property Infringement Suits', 'Contractual Breach Defense & Recovery Actions'],
      faqs: [
        { q: 'What is the duration of an arbitration case in India?', a: 'Under the Arbitration & Conciliation Act, arbitrations are mandated to be completed within 12 months (extendable by 6 months with consent) from pleadings completion.' }
      ],
      lawyerIds: ['Mayank_verma'],
      articleTags: ['Litigation', 'Arbitration'],
      industries: ['Real Estate', 'Infrastructure', 'Insurance']
    },
    {
      id: 'intellectual-property',
      name: 'Intellectual Property (IP)',
      icon: 'Shield',
      description: 'End-to-end IP protection strategies including trademark filing, copyright filings, patent drafting, and IP enforcement/infringement litigation.',
      overview: 'We safeguard our clients\' most valuable intangible assets. Our IP group covers registration, prosecution, maintenance, licensing, and enforcement of trademarks, copyrights, patents, and trade secrets globally.',
      services: ['Trademark Filing, Prosecution & Opposition', 'Copyright Registration & Content Protection', 'Patent Drafting, Filing & Analysis', 'IP Audits, Structuring & Licensing Agreements', 'Anti-Counterfeiting Actions & Enforcement'],
      faqs: [
        { q: 'How long does a trademark registration process take?', a: 'In India, a trademark application can take 8 to 18 months to progress to registration, depending on whether there are office actions, examination objections, or third-party oppositions.' }
      ],
      lawyerIds: ['madhav_raghuwanshi'],
      articleTags: ['Intellectual Property', 'Copyright'],
      industries: ['Technology', 'Healthcare', 'Pharma', 'E-Commerce']
    },
    {
      id: 'banking-finance',
      name: 'Banking & Finance',
      icon: 'ShieldCheck',
      description: 'Structuring and advisory on corporate debt, project finance, consortium lending, regulatory compliance with RBI, and debt capital markets.',
      overview: 'Our Banking & Finance team represents domestic and international lenders, syndicates, and borrowers in structuring, negotiating, and documenting financial transactions.',
      services: ['Project Finance and Structured Debt', 'Consortium Lending Arrangements', 'Securitization & Assets Restructuring', 'RBI Compliance, Audits & Regulatory Filings', 'External Commercial Borrowings (ECB) Advisory'],
      faqs: [
        { q: 'What is RBI\'s position on External Commercial Borrowings (ECB)?', a: 'ECBs are permitted under automatic or approval routes depending on quantum, end-use restrictions, minimum average maturity period, and borrowing entity caps.' }
      ],
      lawyerIds: ['madhav_raghuwanshi', 'Mayank_verma'],
      articleTags: ['Finance', 'Regulatory'],
      industries: ['Insurance', 'Infrastructure', 'FinTech']
    },
    {
      id: 'employment-law',
      name: 'Employment Law',
      icon: 'Users',
      description: 'Guidance on labor disputes, HR policies, drafting employment agreements, POSH compliance, and structural layoffs.',
      overview: 'We advise employers on navigating complex labor laws, creating healthy workspaces, and mitigating employee disputes. We also represent corporations in trade union issues, industrial disputes, and collective bargaining.',
      services: ['Employment Agreements & Restrictive Covenants', 'POSH (Prevention of Sexual Harassment) Policy & Training', 'Labor Audits & General Factory Acts Compliance', 'Layoffs, Redundancies & Workplace Restructuring', 'Representation in Labor Courts & Tribunals'],
      faqs: [
        { q: 'Is a POSH committee mandatory for all offices?', a: 'Yes, any organization with 10 or more employees must form an Internal Committee (IC) to address sexual harassment complaints.' }
      ],
      lawyerIds: ['Mayank_verma'],
      articleTags: ['Employment', 'POSH'],
      industries: ['Technology', 'Manufacturing', 'Education']
    },
    {
      id: 'real-estate',
      name: 'Real Estate & Property',
      icon: 'Home',
      description: 'Title due diligence, RERA filings, property acquisition documentation, lease structures, and construction dispute litigation.',
      overview: 'We support real estate developers, investors, and buyers through commercial and residential transactions. We analyze title histories, register projects, draft construction contracts, and represent parties before RERA authorities.',
      services: ['Title Verification & Due Diligence Reports', 'RERA Registrations & Compliance Audits', 'Lease Agreements, Joint Development Agreements (JDA)', 'Land Acquisitions & Zoning Advisory', 'Real Estate Dispute Representation'],
      faqs: [
        { q: 'What are the main consequences of RERA non-registration?', a: 'Non-registration of a project under RERA can attract heavy penalties up to 10% of the estimated cost of the project, or imprisonment.' }
      ],
      lawyerIds: ['Mayank_verma'],
      articleTags: ['Real Estate', 'RERA'],
      industries: ['Real Estate', 'Hospitality', 'Infrastructure']
    },
    {
      id: 'taxation',
      name: 'Taxation (Direct & Indirect)',
      icon: 'Percent',
      description: 'Strategic planning, corporate tax returns, GST audits, transfer pricing documentation, and tax dispute litigation.',
      overview: 'Our tax experts help corporate groups optimize tax structures, comply with transfer pricing rules, and navigate GST and direct tax litigations before authorities and courts.',
      services: ['Corporate Direct Tax Planning & Structuring', 'GST Compliance, Filing & Auditing Services', 'Transfer Pricing Advisory & Study Documentation', 'Representation before Income Tax Appellate Tribunal (ITAT)', 'Indirect Tax Disputes & Customs Advisory'],
      faqs: [
        { q: 'What is the impact of transfer pricing rules on multinational subsidiaries?', a: 'Transactions between associated enterprises must meet the Arm\'s Length Principle, verified through mandatory Transfer Pricing audits and documentation.' }
      ],
      lawyerIds: ['madhav_raghuwanshi'],
      articleTags: ['Tax', 'GST'],
      industries: ['Manufacturing', 'E-Commerce', 'Pharma']
    },
    {
      id: 'data-privacy',
      name: 'Data Privacy & Cybersecurity',
      icon: 'Lock',
      description: 'Compliance strategy for digital data protection regulations (DPDP, GDPR), privacy policies, and security breach responses.',
      overview: 'With the arrival of strict data protection laws, we advise organizations on personal data collection, user rights, processing protocols, cross-border transfers, and security response planning.',
      services: ['Digital Personal Data Protection (DPDP) Audits', 'GDPR Compliance & International Data Flows', 'Privacy Policies & User Consent Architecture', 'Data Processing Agreements (DPA)', 'Cybersecurity Breach Incident Advice & Defense'],
      faqs: [
        { q: 'How does the DPDP Act impact start-ups in India?', a: 'Start-ups must implement consent managers, secure user approval for data processing, notify breaches, and assign data protection officers unless exempted.' }
      ],
      lawyerIds: ['madhav_raghuwanshi'],
      articleTags: ['Data Privacy', 'DPDP'],
      industries: ['Technology', 'FinTech', 'Healthcare', 'E-Commerce']
    },
    {
      id: 'white-collar-crime',
      name: 'White Collar Crime Defense',
      icon: 'EyeOff',
      description: 'Counseling and criminal defense representation in financial fraud, money laundering, bribe investigations, and ED actions.',
      overview: 'We offer discrete counseling and defense services to corporations, directors, and executives facing investigations by Enforcement Directorate (ED), CBI, SFIO, and police departments.',
      services: ['Anti-Money Laundering (PMLA) Defense', 'Bribery and Corruption Investigations (PCA)', 'Corporate Fraud, Insider Trading & Embezzlement Cases', 'Bail Representation & quashing petitions in High Court', 'Internal Fraud Audits & Compliance Reviews'],
      faqs: [
        { q: 'What are standard precautions during a search and seizure operation?', a: 'Ensure you demand the search warrant, verify officer credentials, request legal counsel presence immediately, and inspect the panchnama document before signing.' }
      ],
      lawyerIds: ['Mayank_verma'],
      articleTags: ['White Collar', 'Defense'],
      industries: ['Insurance', 'Banking', 'Manufacturing']
    },
    {
      id: 'insolvency-bankruptcy',
      name: 'Insolvency & Bankruptcy (IBC)',
      icon: 'FileText',
      description: 'Debt recovery, representing creditors and debtors in NCLT, Insolvency Resolution Process (CIRP), and liquidations.',
      overview: 'We support financial creditors, operational creditors, and corporate debtors in insolvency proceedings. We draft resolution plans, participate in committee of creditors (CoC) sessions, and guide liquidators.',
      services: ['Corporate Insolvency Resolution Process (CIRP) filings', 'Asset Debt Restructuring & IBC Settlement Negotiations', 'Representation of Resolution Professionals (RP) & Liquidators', 'Advisory for Committee of Creditors (CoC)', 'Defense under Section 7, 9, and 10 of IBC'],
      faqs: [
        { q: 'What triggers insolvency proceedings for a corporate debtor?', a: 'A default of at least 1 Crore INR (10 Million INR) by a corporate debtor triggers filing under the Insolvency and Bankruptcy Code.' }
      ],
      lawyerIds: ['Mayank_verma'],
      articleTags: ['IBC', 'Insolvency'],
      industries: ['Real Estate', 'Manufacturing', 'Infrastructure']
    },
    {
      id: 'family-law',
      name: 'Family & Matrimonial Law',
      icon: 'Heart',
      description: 'Discreet and empathetic handling of divorces, alimony negotiations, child custody, estate distribution, and domestic disputes.',
      overview: 'We offer supportive and pragmatic counsel on personal issues, protecting your emotional and financial stability through mediation or litigation.',
      services: ['Mutual & Contested Divorces', 'Alimony and Maintenance Settlements', 'Child Custody and Guardianship Petitions', 'Domestic Violence (DV) Case Representation', 'Family Asset Division & Settlement Deeds'],
      faqs: [
        { q: 'What is the lock-in period for mutual consent divorce?', a: 'Couples must live separately for at least 1 year before filing, followed by a statutory 6-month cooling period (which courts can waive under special circumstances).' }
      ],
      lawyerIds: ['Mayank_verma'],
      articleTags: ['Family Law', 'Estate Planning'],
      industries: ['Hospitality', 'Education']
    },
    {
      id: 'criminal-law',
      name: 'Criminal Law & Trial Defense',
      icon: 'ShieldAlert',
      description: 'Defense representation in police stations, bail petitions, trial courts, appellate litigation, and private complaint filings.',
      overview: 'We provide prompt defense services for individuals and corporate officers caught in criminal proceedings. From securing anticipatory bail to conducting complex trial cross-examinations.',
      services: ['Anticipatory and Regular Bail Applications', 'FIR Quashing Petitions (Sec 482 CrPC / Sec 528 BNSS)', 'Defense Representation in Sessions Trials & Appeal Hearings', 'Private Complaints & Defamation Prosecutions', 'Negotiable Instruments Act (Cheque Bounce) Cases'],
      faqs: [
        { q: 'What is the main requirement to obtain Anticipatory Bail?', a: 'The applicant must establish a reasonable apprehension of arrest on accusation of a non-bailable offense, demonstrating cooperation with investigation protocols.' }
      ],
      lawyerIds: ['Mayank_verma'],
      articleTags: ['Criminal', 'Bail'],
      industries: ['Real Estate', 'Insurance']
    }
  ];

  // 2. Industries List
  const industries = [
    { id: 'technology', name: 'Technology & AI', icon: 'Cpu', description: 'Tech giants, SaaS developers, AI firms, and global outsourcing entities navigating licensing, privacy, and operations.' },
    { id: 'fintech', name: 'FinTech & Digital Payments', icon: 'DollarSign', description: 'Crypto platforms, neobanks, payment aggregators, and lending startups complying with RBI and financial frameworks.' },
    { id: 'healthcare', name: 'Healthcare & Lifesciences', icon: 'Activity', description: 'Hospitals, clinical networks, diagnostics centers, and telemedicine portals addressing liability and licenses.' },
    { id: 'pharma', name: 'Pharmaceuticals', icon: 'PlusSquare', description: 'Drug manufacturers, generic developers, and global distributors addressing patent protection and drug approvals.' },
    { id: 'manufacturing', name: 'Manufacturing & Heavy Industry', icon: 'Tool', description: 'Factories, assembly lines, and supply-chain logistics managing labor laws, zoning, contracts, and safety.' },
    { id: 'real-estate', name: 'Real Estate & Infrastructure', icon: 'Layers', description: 'Residential developers, SEZs, and commercial office owners implementing RERA, land acquisition, and leasing.' },
    { id: 'education', name: 'Education & EdTech', icon: 'BookOpen', description: 'Schools, universities, and online tutoring portals managing content licensing, privacy, and structure.' },
    { id: 'e-commerce', name: 'E-Commerce & Retail', icon: 'ShoppingBag', description: 'Online marketplaces, D2C brands, and logistics partners dealing with consumer protection and vendor contracts.' },
    { id: 'insurance', name: 'Insurance & Reinsurance', icon: 'Shield', description: 'Underwriters, brokers, and insurtech intermediaries addressing IRDAI directives and liability suits.' },
    { id: 'hospitality', name: 'Hospitality & Entertainment', icon: 'Coffee', description: 'Hotels, dining chains, and event aggregators executing franchise deals and operating licenses.' },
    { id: 'energy', name: 'Energy & Natural Resources', icon: 'Sun', description: 'Solar farms, wind networks, and resource mining corporations setting up greenfield plants and acquisitions.' },
    { id: 'infrastructure', name: 'Infrastructure & Projects', icon: 'Compass', description: 'Highway builders, port developers, and PPP project syndicates managing bidding and dispute arbitrations.' }
  ];

  // 3. Lawyer Directory (Initial fallback roster)
  const initialLawyers = [
    {
      id: 'madhav_raghuwanshi',
      slug: 'madhav-raghuwanshi',
      name: 'Madhav Raghuwanshi',
      title: 'Founder Of Lawzunction',
      experience: 4,
      specializations: ['Corporate & Commercial', 'M&A and Private Equity', 'Startup Advisory', 'Intellectual Property (IP)', 'Taxation'],
      languages: ['English', 'Hindi'],
      education: "B.B.A. LL.B. (Hons.), Institute of Law and Legal Studies, SAGE University, Indore; Judicial Intern, Madhya Pradesh High Court",
      bio: "Madhav Raghuwanshi is the Founder of lawzunction and a legal professional with experience in legal research, drafting, litigation support, and dispute resolution. He has worked on a diverse range of matters involving constitutional law, civil litigation, consumer disputes, corporate advisory, and regulatory compliance. Through his legal practice and leadership at lawzunction, he is committed to delivering practical legal solutions and advancing legal awareness.",
      litigationExpertise: [
        'Constitutional Law: Writs, Public Interest Litigations (PILs), Judicial Review, Writs before High Courts & Supreme Court',
        'Civil Litigation: Property Disputes, Contractual Disputes, Partition Suits, Declaratory Decrees, Injunctions, Suit for Recovery, Specific Performance of Contract',
        'Consumer Disputes: Consumer Protection Act, 2019, Consumer Forum & Commission Litigation, Product Liability Claims',
        'Corporate & Commercial Litigation: Company Law Matters, Director Disputes,Shareholder Disputes, Winding Up Proceedings',
        'Family Law: Divorce, Maintenance, Child Custody, Domestic Violence, Guardianship & Adoption',
        'Criminal Law: Bail Applications, FIR Quashing, Criminal Trials & Appeals, Private Complaints',
        'Arbitration & ADR: Arbitration Act, 1996, Arbitration Agreement Enforcement, Arbitral Award Challenges, Conciliation & Mediation'
      ],
      publications: [
        'Regular author of legal insights, case notes, and statutory analyses published through lawzunction.',
        'Contributor on constitutional law, civil and criminal litigation, consumer protection, and regulatory developments.',
        'Published commentary on judicial decisions, legislative reforms, and contemporary legal issues.',
        'Thought leadership focused on legal awareness, access to justice, and practical legal solutions.'
      ],
      awards: ["Founder, lawzunction | President, Institutional Innovation Council (IIC) | Judicial Intern, Madhya Pradesh High Court & Supreme Court Of India"],
      linkedin: 'https://www.linkedin.com/in/madhav-raghuwanshi/',
      photo: '/madhav_raghuwanshi.jpg'
    },
    {
      id: 'Mayank_verma',
      slug: 'mayank-verma',
      name: 'Adv. Mayank Verma',
      title: 'Union Of India Counsel / Madhya Pradesh Panel Advocate',
      experience: 13,
      specializations: ['Litigation & Arbitration', 'Real Estate & Property', 'Civil Matters', 'Company Law Matters', 'Criminal Law & Trial Defense'],
      languages: ['English', 'Hindi'],
      education: "Β.Β.Α. LL.B | L.L.M (Constitutional Law) | C.S. (Company Secretary Prof.) | M.A. (Corporate Law)",
      bio: 'Advocate Mayank Verma is a qualified legal professional holding B.B.A. LL.B. (Hons.) and Company Secretary (CS) qualifications. He has been dedicated to providing comprehensive legal services across Constitutional, Civil, Criminal, Family, Corporate (NCLT/NCLAT), MSME, Arbitration, IPR, Consumer, Motor Accident Claims, Recovery Matters, and Contract Law. He specializes in litigation, legal drafting, advisory services, agreements, notices, and client counselling. With a commitment to professional excellence, he delivers practical, strategic, and result-oriented legal solutions tailored to protect the rights and interests of his clients.',
      matters: [
        'Civil, Criminal, Family, Corporate (NCLT/NCLAT), MSME, Arbitration, IPR, Consumer, Motor Accident Claims, Recovery Matters, and Contract Law. He specializes in litigation, legal drafting, advisory services, agreements, notices, and client counselling.'
      ],
      linkedin: 'https://www.linkedin.com/in/mayank-verma-advocate-8566a3137/',
      photo: ''
    }
  ];

  const [lawyers, setLawyers] = useState(initialLawyers);

  const fetchPublicLawyers = async () => {
    try {
      const res = await fetch('/api/public/lawyers');
      if (res.ok) {
        const data = await res.json();
        const publishedArray = Array.isArray(data) ? data : (data.lawyers || []);
        if (publishedArray.length > 0) {
          setLawyers(prev => {
            const map = new Map();
            // Retain existing rich mock data if present
            initialLawyers.forEach(l => {
              const k = (l.slug || l.id || l.name).toLowerCase().replace(/[^a-z0-9]/g, '-');
              map.set(k, l);
            });
            // Overlay and append published database profiles
            publishedArray.forEach(p => {
              const key = (p.slug || p.id || p.name).toLowerCase().replace(/[^a-z0-9]/g, '-');
              const existing = map.get(key) || {};
              map.set(key, {
                ...existing,
                ...p,
                id: p.slug || p.id,
                title: p.title || existing.title || 'Advocate',
                photo: p.photo || existing.photo || '',
                specializations: (p.specializations && p.specializations.length > 0) ? p.specializations : (existing.specializations || []),
                languages: (p.languages && p.languages.length > 0) ? p.languages : (existing.languages || ['English', 'Hindi']),
                courts: p.courts || existing.courts || '',
                city: p.city || existing.city || '',
                education: p.education || existing.education || '',
                bio: p.bio || existing.bio || '',
                consultationFee: p.consultationFee || existing.consultationFee || ''
              });
            });
            return Array.from(map.values());
          });
        }
      }
    } catch (err) {
      console.warn('Failed to load published lawyers roster:', err);
    }
  };

  const fetchPublicPracticeAreas = async () => {
    try {
      const res = await fetch('/api/public/practice-areas');
      if (res.ok) {
        const data = await res.json();
        const areasArray = Array.isArray(data) ? data : (data.practiceAreas || []);
        if (areasArray.length > 0) {
          setPracticeAreas(() => {
            const map = new Map();
            initialPracticeAreas.forEach(a => map.set(a.id, a));
            areasArray.forEach(p => {
              const key = p.id || p.slug || p._id || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              const existing = map.get(key) || {};
              map.set(key, {
                ...existing,
                ...p,
                id: p.id || existing.id || key,
                name: p.name || existing.name,
                icon: p.icon || existing.icon || 'Briefcase',
                description: p.description || existing.description,
                overview: p.overview || existing.overview || p.description,
                services: (p.services && p.services.length > 0) ? p.services : (existing.services || []),
                faqs: (p.faqs && p.faqs.length > 0) ? p.faqs : (existing.faqs || [])
              });
            });
            return Array.from(map.values());
          });
        }
      }
    } catch (err) {
      console.warn('Failed to load dynamic practice areas, using defaults:', err);
    }
  };

  const fetchPublicBlogs = async () => {
    try {
      const res = await fetch('/api/public/blogs');
      if (res.ok) {
        const data = await res.json();
        const blogsArray = Array.isArray(data) ? data : (data.blogs || []);
        if (blogsArray.length > 0) {
          setArticles(() => {
            const map = new Map();
            initialArticles.forEach(a => map.set(a.id, a));
            blogsArray.forEach(b => {
              const key = b.id || b.slug || b._id || b.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              const existing = map.get(key) || {};
              map.set(key, {
                ...existing,
                ...b,
                id: b.id || existing.id || key,
                title: b.title || existing.title,
                summary: b.summary || b.excerpt || existing.summary || '',
                content: b.content || existing.content || '',
                category: b.category || existing.category || 'Legal Insights',
                author: b.authorName || b.author || existing.author || 'Madhav Raghuwanshi',
                authorName: b.authorName || b.author || existing.authorName || 'Madhav Raghuwanshi',
                date: b.date || existing.date || new Date().toLocaleDateString(),
                readTime: b.readTime || existing.readTime || '5 min read'
              });
            });
            return Array.from(map.values());
          });
        }
      }
    } catch (err) {
      console.warn('Failed to load dynamic blogs, using defaults:', err);
    }
  };

  // 4. Case Studies (5 Detailed stories)
  const caseStudies = [
    {
      id: 'tech-merger-380m',
      title: 'Structuring a USD 380 Million Cross-Border Acquisition',
      practiceArea: 'M&A and Private Equity',
      industry: 'Technology & AI',
      challenge: 'A global tech giant intended to acquire a high-performance Indian SaaS firm. The transaction faced hurdles: multiple regulatory layers (RBI regulations, FEMA, competition clearances), complex intellectual property transfers across three jurisdictions, and restructuring employee stock options (ESOPs) for Indian staff.',
      strategy: 'Our legal division designed a multi-step restructuring plan. We established an offshore escrow mechanism to secure compliance, drafted the comprehensive Share Purchase Agreement containing indemnity terms, resolved trademark licensing issues, and reconstructed the ESOP options pool in coordination with local tax laws.',
      outcome: 'The acquisition was successfully completed in 4 months with zero regulatory objections. The foreign buyer acquired 100% equity stake, the IP transfer was successfully finalized, and 120 key employees retained their options seamlessly.',
      takeaways: ['Early planning of tax consequences prevents transaction friction.', 'Synchronizing IP transfers across foreign registries demands early coordination.', 'Transparent escrow setups build transaction trust.'],
      lawyers: ['Madhav Raghuwanshi'],
      date: 'November 2025'
    },
    {
      id: 'rera-developer-defense',
      title: 'RERA Class Action Suit Defense for Infrastructure Developer',
      practiceArea: 'Real Estate & Property',
      industry: 'Real Estate & Infrastructure',
      challenge: 'A large residential real estate developer faced a class-action lawsuit from 150 home buyers demanding full refunds with 18% interest due to a two-year construction delay caused by supply chain challenges and municipal zoning approvals.',
      strategy: 'Our dispute resolution counsel Adv. Mayank Verma defended the developer. We presented documentation showing force majeure events (municipal delay in issuing road connectivity permits), proved that 90% of the project was complete, and proposed a structured layout offering delayed possession payouts with reasonable compensation instead of complete project refunds.',
      outcome: 'The RERA authority rejected the refund demand, ruling in favor of the developer. The buyers accepted the alternate delayed compensation package, preventing the developer from declaring insolvency and ensuring project delivery.',
      takeaways: ['Detailed correspondence tracking is critical for force majeure defenses.', 'Proposing structural settlement solutions protects companies from bankruptcy.', 'Early mediation with buyer committees reduces litigation friction.'],
      lawyers: ['Adv. Mayank Verma'],
      date: 'February 2026'
    },
    {
      id: 'dpdp-app-audit',
      title: 'Comprehensive DPDP Act Compliance Audit for FinTech App',
      practiceArea: 'Data Privacy & Cybersecurity',
      industry: 'FinTech & Digital Payments',
      challenge: 'A growing digital payment application with 5 Million active users needed to align their data architecture with the newly enacted Digital Personal Data Protection (DPDP) Act to avoid heavy compliance penalties (up to 250 Crore INR).',
      strategy: 'Our corporate legal team conducted a thorough data-mapping audit. We redesigned the app\'s user sign-up flow to integrate affirmative, language-specific consent prompts, formulated a data deletion and user grievance response portal, drafted Data Processing Agreements (DPAs) for cloud partners, and conducted cybersecurity security response training.',
      outcome: 'The client achieved full compliance within 3 months, creating a robust secure database environment. They successfully passed an external regulatory audit, strengthening client brand credibility.',
      takeaways: ['Affirmative consent requires clean UI/UX integration.', 'Data minimisation policies lower data storage risks.', 'Third-party vendor data-processing contracts must be reviewed carefully.'],
      lawyers: ['Madhav Raghuwanshi'],
      date: 'April 2026'
    },
    {
      id: 'transfer-pricing-victory',
      title: 'Securing a 45 Crore Tax Dispute Victory before ITAT',
      practiceArea: 'Taxation (Direct & Indirect)',
      industry: 'Manufacturing & Heavy Industry',
      challenge: 'The Income Tax Department raised an objection against a manufacturing multinational subsidiary, claiming their international raw material transactions with the parent company did not meet the arm\'s length test. They proposed an upward transfer pricing adjustment of 45 Crore INR, adding significant tax liabilities.',
      strategy: 'Our tax defense team analyzed global transaction benchmarks, conducted database studies, and proved that the department\'s transactional method was flawed and ignored specific logistics costs. The case was argued in detail before the Income Tax Appellate Tribunal (ITAT).',
      outcome: 'The ITAT ruled fully in favor of our client, deleting the entire 45 Crore tax adjustment and affirming our benchmark study and accounting methodology.',
      takeaways: ['Accounting benchmarking must reflect local transactional realities.', 'Detailed transfer pricing documentation acts as a vital shield.', 'Oral advocacy must be supported by clean comparative spreadsheets.'],
      lawyers: ['Madhav Raghuwanshi'],
      date: 'January 2026'
    },
    {
      id: 'quashing-ceo-investigation',
      title: 'Quashing Vexatious Criminal Allegations against Biotech CEO',
      practiceArea: 'White Collar Crime Defense',
      industry: 'Healthcare & Lifesciences',
      challenge: 'A prominent biotechnology startup CEO was falsely accused of criminal breach of trust, cheating, and embezzlement in a private complaint filed by a disgruntled former distributor attempting to extort settlement payouts.',
      strategy: 'We immediately filed a quashing petition under Section 482 of the CrPC before the High Court, establishing that the dispute was civil in nature (relating to unpaid invoices and contract terms) and that criminal charges were a clear abuse of the legal process.',
      outcome: 'The High Court stayed the investigation and subsequently quashed the FIR, completely exonerating the CEO and preventing arrest or media damage.',
      takeaways: ['Vexatious criminal charges in civil disputes must be challenged immediately.', 'Section 482 quashing actions protect client reputations.', 'Gathering complete email and chat histories is vital to show absence of criminal intent.'],
      lawyers: ['Adv. Mayank Verma'],
      date: 'March 2026'
    }
  ];

  // 5. Knowledge Center Articles (10 articles)
  const initialArticles = [
    {
      id: 'dpdp-act-2023-guide',
      title: 'Navigating India’s Digital Personal Data Protection (DPDP) Act: A Compliance Guide',
      category: 'Regulatory Updates',
      summary: 'An in-depth analysis of the key obligations, user rights, and penalties under the DPDP Act for corporations.',
      content: 'The Digital Personal Data Protection Act represents a seismic shift in data privacy rules. Consent must now be free, specific, informed, unconditional, and unambiguous. Corporations acting as Data Fiduciaries must implement Consent Managers, establish clean grievance response channels, and ensure secure database protocols. Failing to prevent personal data breaches can attract penalties up to INR 250 Crores.',
      author: 'Madhav Raghuwanshi',
      authorId: 'madhav_raghuwanshi',
      date: 'June 10, 2026',
      readTime: '6 min read',
      practiceArea: 'Data Privacy & Cybersecurity',
      downloadUrl: 'dpdp_compliance_guide_2026.pdf'
    },
    {
      id: 'startup-funding-term-sheets',
      title: 'Decoding Venture Capital Term Sheets: Founder Tips',
      category: 'Articles',
      summary: 'A practical legal checklist for startup founders negotiating seed and series financing term sheets.',
      content: 'A term sheet outlines the financial and governance framework of an investment. While valuation and dilution are primary focuses, founders must watch clauses like Liquidation Preferences (1x non-participating is standard), Right of First Refusal, Co-Sale rights, Board Composition, and Drag-Along rights that impact ultimate control.',
      author: 'Madhav Raghuwanshi',
      authorId: 'madhav_raghuwanshi',
      date: 'May 28, 2026',
      readTime: '8 min read',
      practiceArea: 'Startup Advisory',
      downloadUrl: 'vc_term_sheets_guide.pdf'
    },
    {
      id: 'arbitration-amendments-impact',
      title: 'Fast-Track Arbitration in India: Review of Recent Judgments',
      category: 'Case Law Analysis',
      summary: 'Analyzing recent Supreme Court judgments upholding timelines and limiting court interventions in arbitrations.',
      content: 'The Supreme Court of India has reiterated its pro-arbitration stance. In recent rulings, the court limited the scope of challenging arbitration awards under Section 34. The court stressed that arbitration tribunals are the ultimate judges of evidence, and patent illegality does not warrant re-appreciating evidence, speeding up enforcement.',
      author: 'Adv. Mayank Verma',
      authorId: 'Mayank_verma',
      date: 'May 14, 2026',
      readTime: '5 min read',
      practiceArea: 'Litigation & Arbitration',
      downloadUrl: 'fast_track_arbitration_case_study.pdf'
    },
    {
      id: 'posh-compliance-workplace',
      title: 'POSH Act Compliance Checklist for HR Managers',
      category: 'Newsletters',
      summary: 'A step-by-step checklist to ensure your workspace meets POSH guidelines, avoiding heavy corporate fines.',
      content: 'Every organization with 10+ employees is required to constitute an Internal Committee (IC) led by a senior female employee. The organization must display POSH committee contact details, host regular workshops, submit annual reports to the district officer, and execute unbiased inquiry hearings in a timely manner.',
      author: 'Adv. Mayank Verma',
      authorId: 'Mayank_verma',
      date: 'April 30, 2026',
      readTime: '4 min read',
      practiceArea: 'Employment Law',
      downloadUrl: 'posh_compliance_checklist.pdf'
    },
    {
      id: 'insolvency-code-developments',
      title: 'Key Insolvency Code Developments: Treatment of Operational Creditors',
      category: 'Regulatory Updates',
      summary: 'Examining recent IBC amendments and judgments establishing priority rankings for operational creditor distributions.',
      content: 'Under the Insolvency and Bankruptcy Code (IBC), the distribution waterfall prioritizes secured financial creditors over operational creditors. Recent rulings clarify that while resolution plans can propose different payment distributions, they must cover operational creditors with at least the liquidation value of their claims.',
      author: 'Adv. Mayank Verma',
      authorId: 'Mayank_verma',
      date: 'March 22, 2026',
      readTime: '7 min read',
      practiceArea: 'Insolvency & Bankruptcy (IBC)',
      downloadUrl: 'operational_creditor_rights_ibc.pdf'
    },
    {
      id: 'cross-border-mergers-fema',
      title: 'FEMA Cross-Border Merger Guidelines: Inbound vs Outbound Transactions',
      category: 'White Papers',
      summary: 'A comprehensive regulatory breakdown of foreign exchange regulations governing inbound and outbound mergers.',
      content: 'Cross-border mergers are governed by the RBI and FEMA regulations. Under the automatic route, mergers are deemed approved if they comply with foreign borrowing caps, investment regulations, and asset classification standards. Transactions failing to meet these guidelines require prior approval from the RBI.',
      author: 'Madhav Raghuwanshi',
      authorId: 'madhav_raghuwanshi',
      date: 'Feb 18, 2026',
      readTime: '10 min read',
      practiceArea: 'M&A and Private Equity',
      downloadUrl: 'fema_cross_border_mergers.pdf'
    },
    {
      id: 'anticipatory-bail-guidelines',
      title: 'Anticipatory Bail Jurisprudence in White-Collar Offences',
      category: 'Case Law Analysis',
      summary: 'A review of judicial standards for granting pre-arrest bail in investigations involving corporate frauds.',
      content: 'Courts consider several criteria when granting anticipatory bail in economic offences: gravity of the offense, potential flight risk, threat of tampering with evidence, and likelihood of cooperation with officers. High Courts emphasize that custody should not be used as pre-trial punishment if the accused cooperates.',
      author: 'Adv. Mayank Verma',
      authorId: 'Mayank_verma',
      date: 'Jan 10, 2026',
      readTime: '9 min read',
      practiceArea: 'Criminal Law & Trial Defense',
      downloadUrl: 'anticipatory_bail_corporate_defense.pdf'
    }
  ];

  // 6. Career Listings
  const jobListings = [
    { id: 'corp-assoc', title: 'Associate - Corporate & M&A', location: 'Indore (M.G. Road)', department: 'Corporate Law', type: 'Full-time', experience: '3-5 years', description: 'We are seeking an associate with solid experience in corporate drafting, M&A structuring, and due diligence checks. Strong academic credentials and NLSU background preferred.' },
    { id: 'ip-spec', title: 'Specialist - IP Prosecution & Trademark', location: 'Timarni (M.P)', department: 'Intellectual Property', type: 'Full-time', experience: '2-4 years', description: 'Looking for a specialist to manage international trademark filings under the Madrid Protocol, drafting patent applications, and arguing opposition proceedings.' },
    { id: 'dispute-intern', title: 'Litigation & Arbitration Intern', location: 'Indore (Galaxy Homes)', department: 'Dispute Resolution', type: 'Internship', experience: 'Final year law students', description: 'Opportunity to assist partners in case law research, drafting writ petitions, preparing case files, and attending hearings across courts and tribunals.' },
    { id: 'tax-consultant', title: 'Consultant - GST & Indirect Tax', location: 'Delhi NCR', department: 'Taxation', type: 'Contract', experience: '5+ years', description: 'Seeking a dual qualified CA-Lawyer to support clients during complex GST audit inquiries and draft representations for the appellate tribunal.' }
  ];

  // Dynamic CMS collections with fallback defaults
  const [practiceAreas, setPracticeAreas] = useState(initialPracticeAreas);
  const [articles, setArticles] = useState(initialArticles);

  // --- INTERACTIVE SYSTEM STATE (Persisted/Stored on DB via API) ---
  const [bookings, setBookings] = useState([]);
  const [leads, setLeads] = useState([]);
  const [jobApplications, setJobApplications] = useState([]);
  const [newsletterSubscribers, setNewsletterSubscribers] = useState([]);

  // --- CLIENT PORTAL SECURE STATE ---
  const [currentUser, setCurrentUser] = useState(null);
  const [portalCases, setPortalCases] = useState([]);
  const [portalInvoices, setPortalInvoices] = useState([]);
  const [portalDocuments, setPortalDocuments] = useState([]);
  const [portalMessages, setPortalMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // --- LAWYER SECURE STATE ---
  const [lawyerCases, setLawyerCases] = useState([]);
  const [lawyerAppointments, setLawyerAppointments] = useState([]);

  // --- ADMIN SECURE STATE ---
  const [adminStats, setAdminStats] = useState({});
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminLawyers, setAdminLawyers] = useState([]);
  const [adminCases, setAdminCases] = useState([]);
  const [adminEnquiries, setAdminEnquiries] = useState([]);
  const [adminJobApplications, setAdminJobApplications] = useState([]);

  // Master helper to load private dashboard details based on role
  const loadPortalData = async (token, role, userObj = null) => {
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      if (role === 'CLIENT') {
        const casesRes = await fetch('/api/client/cases', { headers });
        if (casesRes.ok) {
          const casesData = await casesRes.json();
          setPortalCases(Array.isArray(casesData) ? casesData : (casesData.data || []));
        }

        const apptsRes = await fetch('/api/client/appointments', { headers });
        if (apptsRes.ok) setBookings(await apptsRes.json());

        const invoicesRes = await fetch('/api/client/invoices', { headers });
        if (invoicesRes.ok) setPortalInvoices(await invoicesRes.json());

        const docsRes = await fetch('/api/client/documents', { headers });
        if (docsRes.ok) {
          const docsData = await docsRes.json();
          setPortalDocuments(Array.isArray(docsData) ? docsData : (docsData.data || []));
        }

        const msgsRes = await fetch('/api/client/messages', { headers });
        if (msgsRes.ok) setPortalMessages(await msgsRes.json());

        const noticeRes = await fetch('/api/client/notifications', { headers });
        if (noticeRes.ok) setNotifications(await noticeRes.json());
      } 
      
      else if (role === 'LAWYER') {
        const casesRes = await fetch('/api/lawyer/cases', { headers });
        if (casesRes.ok) {
          const casesData = await casesRes.json();
          setLawyerCases(Array.isArray(casesData) ? casesData : (casesData.data || []));
        }

        const apptsRes = await fetch('/api/lawyer/appointments', { headers });
        if (apptsRes.ok) setLawyerAppointments(await apptsRes.json());
      } 
      
      else if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        const statsRes = await fetch('/api/admin/dashboard-stats', { headers });
        if (statsRes.ok) setAdminStats(await statsRes.json());

        const usersRes = await fetch('/api/admin/users', { headers });
        if (usersRes.ok) setAdminUsers(await usersRes.json());

        const lawyersRes = await fetch('/api/admin/lawyers', { headers });
        if (lawyersRes.ok) setAdminLawyers(await lawyersRes.json());

        const casesRes = await fetch('/api/admin/cases', { headers });
        if (casesRes.ok) {
          const casesData = await casesRes.json();
          setAdminCases(Array.isArray(casesData) ? casesData : (casesData.data || []));
        }

        const enquiriesRes = await fetch('/api/admin/enquiries', { headers });
        if (enquiriesRes.ok) setAdminEnquiries(await enquiriesRes.json());

        const jobsRes = await fetch('/api/admin/job-applications', { headers });
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          setAdminJobApplications(Array.isArray(jobsData) ? jobsData : (jobsData.data || []));
        }

        // If this admin also has a linked lawyer profile, fetch their assigned cases and consultations
        const hasLawyerProfile = Boolean(
          (userObj && (userObj.lawyerProfile || userObj.lawyerProfileId)) ||
          (currentUser && (currentUser.lawyerProfile || currentUser.lawyerProfileId))
        );
        if (hasLawyerProfile) {
          const lawyerCasesRes = await fetch('/api/lawyer/cases', { headers });
          if (lawyerCasesRes.ok) {
            const lawyerCasesData = await lawyerCasesRes.json();
            setLawyerCases(Array.isArray(lawyerCasesData) ? lawyerCasesData : (lawyerCasesData.data || []));
          }

          const lawyerApptsRes = await fetch('/api/lawyer/appointments', { headers });
          if (lawyerApptsRes.ok) setLawyerAppointments(await lawyerApptsRes.json());
        }
      }
    } catch (error) {
      console.error(`Error loading database dashboard for ${role}:`, error);
    }
  };

  // Centralized API request helper with 401 handling
  const apiRequest = async (url, options = {}) => {
    const token = localStorage.getItem('lawz_jwt_token') || localStorage.getItem('lawzunction_token');
    const headers = {
      ...(options.headers || {})
    };
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(url, { ...options, headers });
      if (res.status === 401) {
        // 401 Unauthorized: clear storage, reset auth state exactly once, navigate to login view
        const hadToken = Boolean(localStorage.getItem('lawz_jwt_token') || localStorage.getItem('lawzunction_token'));
        localStorage.removeItem('lawz_jwt_token');
        localStorage.removeItem('lawzunction_token');
        if (currentUser || hadToken) {
          setCurrentUser(null);
          if (window.location.hash !== '#/portal') {
            window.location.hash = '#/portal';
          }
        }
      }
      // Note: For 403 (e.g. PASSWORD_CHANGE_REQUIRED), token is NOT removed
      return res;
    } catch (err) {
      console.error(`API request error on ${url}:`, err);
      throw err;
    }
  };

  // Auth session startup check
  useEffect(() => {
    const token = localStorage.getItem('lawz_jwt_token') || localStorage.getItem('lawzunction_token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(async res => {
          if (res.status === 401) {
            localStorage.removeItem('lawz_jwt_token');
            localStorage.removeItem('lawzunction_token');
            setCurrentUser(null);
            if (window.location.hash !== '#/portal') {
              window.location.hash = '#/portal';
            }
            throw new Error('Unauthorized session');
          }
          const data = await res.json().catch(() => ({}));
          // If 403 PASSWORD_CHANGE_REQUIRED, keep session and set mustChangePassword state
          if (res.status === 403 && data.code === 'PASSWORD_CHANGE_REQUIRED') {
            return { success: true, user: { ...data, mustChangePassword: true } };
          }
          if (res.ok && data.success) {
            return data;
          }
          throw new Error(data.message || 'Invalid session');
        })
        .then(data => {
          if (data?.success && data?.user) {
            setCurrentUser(data.user);
            loadPortalData(token, data.user.role, data.user);
          }
        })
        .catch(err => {
          if (err.message !== 'Unauthorized session') {
            console.warn('Session startup notice:', err.message || err);
          }
        });
    }
    fetchPublicLawyers();
    fetchPublicPracticeAreas();
    fetchPublicBlogs();
  }, []);

  // Poll secure chat message log (CLIENT only) every 4 seconds
  useEffect(() => {
    const token = localStorage.getItem('lawz_jwt_token');
    if (!currentUser || currentUser.role !== 'CLIENT' || !token) return;

    const interval = setInterval(() => {
      fetch('/api/client/messages', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => {
          if (res.ok) return res.json();
        })
        .then(data => {
          if (data) setPortalMessages(data);
        })
        .catch(err => console.error('Secure messages polling error:', err));
    }, 4000);

    return () => clearInterval(interval);
  }, [currentUser]);

  // --- ACTIONS ---

  // 1. Consultation Booking (Support guest booking vs logged-in client booking)
  const addBooking = async (bookingData) => {
    const token = localStorage.getItem('lawz_jwt_token');
    const isLoggedInClient = currentUser && currentUser.role === 'CLIENT';
    
    const url = isLoggedInClient ? '/api/client/appointments/book' : '/api/public/bookings';
    const headers = { 'Content-Type': 'application/json' };
    if (isLoggedInClient) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(bookingData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBookings(prev => [data.booking, ...prev]);
        return data.booking;
      }
    } catch (error) {
      console.error('Booking submission error:', error);
    }
  };

  // 2. Submit Contact Intake Enquiry
  const addLead = async (leadData) => {
    const token = localStorage.getItem('lawz_jwt_token');
    const isLoggedInClient = currentUser && currentUser.role === 'CLIENT';

    const url = isLoggedInClient ? '/api/client/enquiries/submit' : '/api/public/leads';
    const headers = { 'Content-Type': 'application/json' };
    if (isLoggedInClient) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(leadData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const leadRecord = data.lead || data.enquiry;
        setLeads(prev => [leadRecord, ...prev]);
        return leadRecord;
      }
    } catch (error) {
      console.error('Contact lead submission error:', error);
    }
  };

  // 3. Submit Career Job Application (Supports JSON and FormData with file upload)
  const addJobApplication = async (appData) => {
    try {
      const isFormData = Boolean(
        appData && (
          (typeof FormData !== 'undefined' && appData instanceof FormData) ||
          typeof appData.append === 'function' ||
          (typeof appData.entries === 'function' && typeof appData.get === 'function') ||
          Object.prototype.toString.call(appData) === '[object FormData]' ||
          (appData.constructor && appData.constructor.name === 'FormData')
        )
      );

      let body;
      const headers = {};

      if (isFormData) {
        body = appData;
        // Do NOT set Content-Type header for FormData; fetch will automatically set multipart/form-data with proper boundary
      } else if (appData && typeof appData === 'object') {
        if (typeof appData.entries === 'function') {
          // If duck-typed FormData object, clone into a clean browser FormData instance
          const fd = new FormData();
          for (const [k, v] of appData.entries()) {
            fd.append(k, v);
          }
          body = fd;
        } else {
          headers['Content-Type'] = 'application/json';
          body = JSON.stringify(appData);
        }
      } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(appData || {});
      }

      const res = await fetch('/api/public/jobs/apply', {
        method: 'POST',
        headers,
        body
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setJobApplications(prev => [data.application, ...prev]);
        setAdminJobApplications(prev => [data.application, ...prev]);
        return { success: true, application: data.application };
      }
      return { success: false, message: data.message || 'Failed to submit application details' };
    } catch (error) {
      console.error('Job application submission error:', error);
      return { success: false, message: error.message || 'Network error occurred while submitting application' };
    }
  };

  const deleteJobApplication = async (applicationId) => {
    const token = localStorage.getItem('lawz_jwt_token');
    if (!token) return { success: false, message: 'Authentication required' };

    try {
      const res = await fetch(`/api/admin/job-applications/${applicationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminJobApplications(prev => prev.filter(app => (app.id || app._id) !== applicationId));
        return { success: true };
      }
      return { success: false, message: data.message || 'Failed to delete application' };
    } catch (error) {
      console.error('Delete job application error:', error);
      return { success: false, message: error.message || 'Network error' };
    }
  };

  // 4. Newsletter subscription list
  const addNewsletterSubscriber = async (input) => {
    try {
      const payload = typeof input === 'string' ? { email: input } : input;
      const emailStr = typeof input === 'string' ? input : input?.email;

      const res = await fetch('/api/public/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (emailStr && !newsletterSubscribers.includes(emailStr)) {
          setNewsletterSubscribers(prev => [...prev, emailStr]);
        }
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Newsletter subscription failed' };
    } catch (error) {
      console.error('Newsletter subscribe error:', error);
      return { success: false, message: error.message };
    }
  };

  // 4b. Knowledge Center Legal Briefings subscription
  const subscribeToBriefings = async (email) => {
    try {
      const cleanEmail = typeof email === 'string' ? email : email?.email;
      const res = await fetch('/api/public/briefings/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (cleanEmail && !newsletterSubscribers.includes(cleanEmail)) {
          setNewsletterSubscribers(prev => [...prev, cleanEmail]);
        }
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Briefings subscription failed' };
    } catch (error) {
      console.error('Briefings subscribe error:', error);
      return { success: false, message: error.message };
    }
  };

  // 5. Client Self-Registration
  const registerClient = async (name, company, email, phone, password) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, company, email, phone, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('lawz_jwt_token', data.token);
        setCurrentUser(data.user);
        loadPortalData(data.token, data.user.role, data.user);
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('Self registration connection error:', error);
      return { success: false, message: 'Server database connection failed' };
    }
  };

  // 6. User Login (Supports Clients, Lawyers, Admins, Super Admins)
  const loginClient = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('lawz_jwt_token', data.token);
        setCurrentUser(data.user);
        loadPortalData(data.token, data.user.role, data.user);
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message || 'Invalid email or password' };
      }
    } catch (error) {
      console.error('Login connection error:', error);
      return { success: false, message: 'Server database connection failed' };
    }
  };

  // 7. Sign Out / Clear local sessions
  const logoutClient = () => {
    localStorage.removeItem('lawz_jwt_token');
    setCurrentUser(null);
    setPortalCases([]);
    setPortalInvoices([]);
    setPortalDocuments([]);
    setPortalMessages([]);
    setNotifications([]);
    setLawyerCases([]);
    setLawyerAppointments([]);
    setAdminStats({});
    setAdminUsers([]);
    setAdminEnquiries([]);
    navigateTo('#/portal');
  };

  // 8. Self-Service Account & Personal Data Deletion (Right to Erasure)
  const deleteAccount = async () => {
    const token = localStorage.getItem('lawz_jwt_token');
    if (!token) return { success: false, message: 'Not authenticated' };
    try {
      const res = await fetch('/api/auth/me', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        logoutClient();
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Failed to delete account' };
    } catch (error) {
      console.error('Delete account error:', error.message || error);
      return { success: false, message: 'Network error processing account deletion' };
    }
  };

  // 8. Client Portal file uploads (Document storage upload + MongoDB API registration)
  const uploadPortalDocument = async (file, caseId = null) => {
    const token = localStorage.getItem('lawz_jwt_token');
    if (!token) return;

    try {
      // 1. Trigger Document Vault Upload
      const uploadRes = await uploadFile(file);
      
      // 2. Post file metadata link to MongoDB API
      const res = await fetch('/api/client/documents/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: uploadRes.name,
          fileUrl: uploadRes.publicUrl,
          size: uploadRes.size,
          caseId
        })
      });

      if (res.ok) {
        const newDoc = await res.json();
        setPortalDocuments(prev => [newDoc, ...prev]);
        return newDoc;
      }
    } catch (error) {
      console.error('Document vault upload failed:', error);
    }
  };

  // 9. Client Chat messages send
  const sendPortalMessage = async (text) => {
    const token = localStorage.getItem('lawz_jwt_token');
    if (!token) return;

    try {
      const res = await fetch('/api/client/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      });

      if (res.ok) {
        const newMsg = await res.json();
        setPortalMessages(prev => [...prev, newMsg]);
      }
    } catch (error) {
      console.error('Client chat send error:', error);
    }
  };

  // 10. Pay Invoice
  const payPortalInvoice = async (invoiceId) => {
    const token = localStorage.getItem('lawz_jwt_token');
    if (!token) return;

    try {
      const res = await fetch(`/api/client/invoices/${invoiceId}/pay`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        setPortalInvoices(prev => prev.map(inv => {
          if (inv.id === invoiceId) {
            return { ...inv, status: 'Paid' };
          }
          return inv;
        }));
      }
    } catch (error) {
      console.error('Pay invoice error:', error);
    }
  };

  // --- LAWYER ACTIONS ---
  const updateCaseStatus = async (caseId, status, progress, lastUpdate) => {
    const token = localStorage.getItem('lawz_jwt_token');
    if (!token) return;

    try {
      const res = await fetch(`/api/lawyer/cases/${caseId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, progress, lastUpdate })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLawyerCases(prev => prev.map(c => {
          if (c.id === caseId) {
            return { ...c, status, progress, lastUpdate };
          }
          return c;
        }));
        return true;
      }
    } catch (error) {
      console.error('Lawyer status update error:', error);
    }
    return false;
  };

  // --- ADMIN ACTIONS ---
  const assignLawyerToCase = async (caseId, lawyerProfileId) => {
    const token = localStorage.getItem('lawz_jwt_token');
    if (!token) return;

    try {
      const res = await fetch(`/api/admin/cases/${caseId}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ lawyerProfileId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Re-load stats & users
        loadPortalData(token, currentUser.role, currentUser);
        return true;
      }
    } catch (error) {
      console.error('Case allocation assignment failed:', error);
    }
    return false;
  };

  const createAdminUser = async (userData) => {
    const token = localStorage.getItem('lawz_jwt_token');
    if (!token) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Refresh users list
        const usersRes = await fetch('/api/admin/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (usersRes.ok) setAdminUsers(await usersRes.json());
        return { success: true };
      }
      return { success: false, message: data.message || 'Creation failed' };
    } catch (error) {
      console.error('Create user error:', error);
      return { success: false, message: 'Server database connection failed' };
    }
  };

  const updateAdminUser = async (userId, updateData) => {
    const token = localStorage.getItem('lawz_jwt_token');
    if (!token) return { success: false, message: 'Authentication required' };

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const usersRes = await fetch('/api/admin/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (usersRes.ok) setAdminUsers(await usersRes.json());

        return { success: true, message: data.message, user: data.user };
      }
      return { success: false, message: data.message || 'Update failed' };
    } catch (error) {
      console.error('Update user error:', error);
      return { success: false, message: 'Server connection failed' };
    }
  };

  const deleteAdminUser = async (userId) => {
    const token = localStorage.getItem('lawz_jwt_token');
    if (!token) return { success: false, message: 'Authentication required' };

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const usersRes = await fetch('/api/admin/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (usersRes.ok) setAdminUsers(await usersRes.json());

        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Deletion failed' };
    } catch (error) {
      console.error('Delete user error:', error);
      return { success: false, message: 'Server connection failed' };
    }
  };

  const updateAdminLawyer = async (lawyerId, lawyerData) => {
    const token = localStorage.getItem('lawz_jwt_token');
    if (!token) return { success: false, message: 'Authentication required' };

    try {
      const res = await fetch(`/api/admin/lawyers/${lawyerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(lawyerData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const usersRes = await fetch('/api/admin/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (usersRes.ok) setAdminUsers(await usersRes.json());

        const lawyersRes = await fetch('/api/admin/lawyers', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (lawyersRes.ok) setAdminLawyers(await lawyersRes.json());

        return { success: true, message: data.message, lawyer: data.lawyer };
      }
      return { success: false, message: data.message || 'Failed to update advocate' };
    } catch (error) {
      console.error('Update lawyer error:', error);
      return { success: false, message: error.message || 'Server connection failed' };
    }
  };

  const deleteAdminLawyer = async (lawyerId) => {
    const token = localStorage.getItem('lawz_jwt_token');
    if (!token) return { success: false, message: 'Authentication required' };

    try {
      const res = await fetch(`/api/admin/lawyers/${lawyerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const usersRes = await fetch('/api/admin/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (usersRes.ok) setAdminUsers(await usersRes.json());

        const lawyersRes = await fetch('/api/admin/lawyers', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (lawyersRes.ok) setAdminLawyers(await lawyersRes.json());

        const statsRes = await fetch('/api/admin/dashboard-stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (statsRes.ok) setAdminStats(await statsRes.json());

        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Failed to delete advocate' };
    } catch (error) {
      console.error('Delete lawyer error:', error);
      return { success: false, message: error.message || 'Server connection failed' };
    }
  };

  const approveAdminLawyer = async (lawyerId) => {
    const token = localStorage.getItem('lawz_jwt_token');
    if (!token) return { success: false, message: 'Authentication required' };

    try {
      const res = await fetch(`/api/admin/lawyers/${lawyerId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const lawyersRes = await fetch('/api/admin/lawyers', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (lawyersRes.ok) setAdminLawyers(await lawyersRes.json());
        fetchPublicLawyers();
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Failed to approve advocate' };
    } catch (error) {
      console.error('Approve lawyer error:', error);
      return { success: false, message: error.message || 'Server connection failed' };
    }
  };

  const rejectAdminLawyer = async (lawyerId, reason) => {
    const token = localStorage.getItem('lawz_jwt_token');
    if (!token) return { success: false, message: 'Authentication required' };

    try {
      const res = await fetch(`/api/admin/lawyers/${lawyerId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const lawyersRes = await fetch('/api/admin/lawyers', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (lawyersRes.ok) setAdminLawyers(await lawyersRes.json());
        fetchPublicLawyers();
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Failed to reject advocate' };
    } catch (error) {
      console.error('Reject lawyer error:', error);
      return { success: false, message: error.message || 'Server connection failed' };
    }
  };

  const unpublishAdminLawyer = async (lawyerId) => {
    const token = localStorage.getItem('lawz_jwt_token');
    if (!token) return { success: false, message: 'Authentication required' };

    try {
      const res = await fetch(`/api/admin/lawyers/${lawyerId}/unpublish`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const lawyersRes = await fetch('/api/admin/lawyers', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (lawyersRes.ok) setAdminLawyers(await lawyersRes.json());
        fetchPublicLawyers();
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Failed to unpublish advocate' };
    } catch (error) {
      console.error('Unpublish lawyer error:', error);
      return { success: false, message: error.message || 'Server connection failed' };
    }
  };

  // Lawyer self-service profile methods
  const fetchLawyerProfile = async () => {
    const token = localStorage.getItem('lawz_jwt_token');
    if (!token) return { success: false, message: 'Authentication required' };

    try {
      const res = await fetch('/api/lawyer/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        return { success: true, profile: data };
      }
      return { success: false, message: data.message || 'Failed to load lawyer profile' };
    } catch (error) {
      console.error('Fetch lawyer profile error:', error);
      return { success: false, message: error.message || 'Server connection failed' };
    }
  };

  const updateLawyerProfile = async (profileData) => {
    const token = localStorage.getItem('lawz_jwt_token');
    if (!token) return { success: false, message: 'Authentication required' };

    try {
      const res = await fetch('/api/lawyer/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (currentUser && data.profile) {
          setCurrentUser(prev => ({
            ...prev,
            name: data.profile.name,
            phone: data.profile.phone,
            photo: data.profile.photo
          }));
        }
        return { 
          success: true, 
          message: data.message, 
          profile: data.profile,
          sensitiveFieldChanged: data.sensitiveFieldChanged 
        };
      }
      return { success: false, message: data.message || 'Failed to update lawyer profile' };
    } catch (error) {
      console.error('Update lawyer profile error:', error);
      return { success: false, message: error.message || 'Server connection failed' };
    }
  };

  const submitLawyerProfileForReview = async () => {
    const token = localStorage.getItem('lawz_jwt_token');
    if (!token) return { success: false, message: 'Authentication required' };

    try {
      const res = await fetch('/api/lawyer/profile/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, message: data.message, profileStatus: data.profileStatus };
      }
      return { 
        success: false, 
        message: data.message || 'Failed to submit profile for review',
        missingFields: data.missingFields 
      };
    } catch (error) {
      console.error('Submit lawyer profile error:', error);
      return { success: false, message: error.message || 'Server connection failed' };
    }
  };

  const updateAdminCase = async (caseId, caseData) => {
    const token = localStorage.getItem('lawz_jwt_token');
    if (!token) return { success: false, message: 'Authentication required' };

    try {
      const res = await fetch(`/api/admin/cases/${caseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(caseData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminCases(prev => prev.map(c => ((c.id || c._id) === caseId ? data.case : c)));
        return { success: true, case: data.case };
      }
      return { success: false, message: data.message || 'Failed to update case' };
    } catch (error) {
      console.error('Update case error:', error);
      return { success: false, message: error.message || 'Server connection failed' };
    }
  };

  const deleteAdminCase = async (caseId) => {
    const token = localStorage.getItem('lawz_jwt_token');
    if (!token) return { success: false, message: 'Authentication required' };

    try {
      const res = await fetch(`/api/admin/cases/${caseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminCases(prev => prev.filter(c => (c.id || c._id) !== caseId));
        return { success: true };
      }
      return { success: false, message: data.message || 'Failed to delete case' };
    } catch (error) {
      console.error('Delete case error:', error);
      return { success: false, message: error.message || 'Server connection failed' };
    }
  };

  const deleteEnquiry = async (enquiryId) => {
    const token = localStorage.getItem('lawz_jwt_token');
    if (!token) return { success: false, message: 'Authentication required' };

    try {
      const res = await fetch(`/api/admin/enquiries/${enquiryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminEnquiries(prev => prev.filter(e => (e.id || e._id) !== enquiryId));
        return { success: true };
      }
      return { success: false, message: data.message || 'Failed to delete enquiry' };
    } catch (error) {
      console.error('Delete enquiry error:', error);
      return { success: false, message: error.message || 'Server connection failed' };
    }
  };

  const deleteAllEnquiries = async () => {
    const token = localStorage.getItem('lawz_jwt_token');
    if (!token) return { success: false, message: 'Authentication required' };

    try {
      const res = await fetch('/api/admin/enquiries/all', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminEnquiries([]);
        return { success: true, count: data.deletedCount };
      }
      return { success: false, message: data.message || 'Failed to delete all enquiries' };
    } catch (error) {
      console.error('Delete all enquiries error:', error);
      return { success: false, message: error.message || 'Server connection failed' };
    }
  };

  const updateEnquiryStatus = async (enquiryId, status) => {
    const token = localStorage.getItem('lawz_jwt_token');
    if (!token) return;

    try {
      const res = await fetch(`/api/admin/enquiries/${enquiryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminEnquiries(prev => prev.map(eq => {
          if (eq.id === enquiryId) {
            return { ...eq, status };
          }
          return eq;
        }));
        return true;
      }
    } catch (error) {
      console.error('Enquiry state modify failed:', error);
    }
    return false;
  };

  // --- AI CHATBOT SYSTEM ---
  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'bot',
      text: 'Welcome to Lawzunction AI legal assistant. How can I support your legal requirements today?',
      time: 'Just now'
    }
  ]);
  const [isBotTyping, setIsBotTyping] = useState(false);

  const handleChatSend = (userText) => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { sender: 'user', text: userText, time: timeNow };
    setChatHistory(prev => [...prev, userMsg]);
    setIsBotTyping(true);

    // Simulated AI response with typing delay
    setTimeout(() => {
      const text = userText.toLowerCase();
      let botResponse = '';

      if (text.includes('booking') || text.includes('schedule') || text.includes('consultation') || text.includes('appointment')) {
        botResponse = 'I can help you book a consultation. Click the "Book Consultation" button on the screen or I can guide you through our online form.';
      } else if (text.includes('portal') || text.includes('client') || text.includes('login') || text.includes('invoice')) {
        botResponse = 'For active legal matters, documents, and invoicing, you can access our secure Client Portal. Click the Client Portal link in the navigation menu to sign in to your client account or register a new one.';
      } else if (text.includes('corporate') || text.includes('m&a') || text.includes('contract') || text.includes('company')) {
        botResponse = 'Our Corporate & M&A practice is led by Founder Of Lawzunction Madhav Raghuwanshi. We counsel corporations, startups, and boards on transactional compliance and structuring. Would you like to check out our corporate practice section?';
      } else if (text.includes('trademark') || text.includes('copyright') || text.includes('patent') || text.includes('ip')) {
        botResponse = 'Our Intellectual Property group assists companies in registering, prosecuting, and defending trademarks and copyrights under the Madrid Protocol. You can find more detail in our IP practice sub-pages.';
      } else if (text.includes('litigation') || text.includes('arbitration') || text.includes('court') || text.includes('dispute')) {
        botResponse = 'Our dispute resolution counsel Adv. Mayank Verma represents clients before tribunals and high courts. We coordinate domestic and international arbitrations.';
      } else if (text.includes('career') || text.includes('job') || text.includes('intern')) {
        botResponse = 'We are always looking for stellar legal talent. You can check open listings and submit your resume directly in our Careers Portal.';
      } else if (text.includes('location') || text.includes('office') || text.includes('address') || text.includes('indore') || text.includes('timarni')) {
        botResponse = 'Lawzunction has offices in Indore (M.G. Road), Timarni (M.P), and Indore (Galaxy Homes). Check our Contact Us page for maps, directions, and phone numbers.';
      } else if (text.includes('fees') || text.includes('price') || text.includes('charge')) {
        botResponse = 'Consultations at Lawzunction can be booked online directly without any upfront payments. We also offer customized retainer models for ongoing corporate advisory.';
      } else {
        botResponse = 'I can help guide you through our legal solutions. You can ask me about: corporate law, trademark filing, dispute resolution, client portal logins, scheduling, or office locations.';
      }

      const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setChatHistory(prev => [...prev, { sender: 'bot', text: botResponse, time: botTime }]);
      setIsBotTyping(false);
    }, 850);
  };

  const changeUserPassword = async (currentPassword, newPassword) => {
    const token = localStorage.getItem('lawz_jwt_token');
    if (!token) return { success: false, message: 'Session expired' };

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentUser(prev => prev ? { ...prev, mustChangePassword: false } : null);
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || 'Failed to change password' };
      }
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, message: 'Server connection error' };
    }
  };

  const resetUserPassword = async (userId, temporaryPassword) => {
    const token = localStorage.getItem('lawz_jwt_token');
    if (!token) return { success: false, message: 'Session expired' };

    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ temporaryPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminUsers(prev => prev.map(u => u.id === userId ? { ...u, mustChangePassword: true } : u));
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || 'Failed to reset password' };
      }
    } catch (error) {
      console.error('Reset user password error:', error);
      return { success: false, message: 'Server connection error' };
    }
  };

  const requestForgotPassword = async (email) => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, message: data.message || 'Password reset link sent to your email.' };
      } else {
        return { success: false, message: data.message || 'Failed to send reset link.' };
      }
    } catch (error) {
      console.error('Forgot password request error:', error);
      return { success: true, message: 'If this email is registered, password reset instructions have been sent.' };
    }
  };

  return (
    <AppContext.Provider value={{
      // Routing
      currentRoute,
      routeParams,
      navigateTo,

      // Database lists
      practiceAreas,
      industries,
      lawyers,
      caseStudies,
      articles,
      jobListings,

      // Dynamic states
      bookings,
      leads,
      jobApplications,
      newsletterSubscribers,

      // Portal context
      currentUser,
      portalCases,
      portalInvoices,
      portalDocuments,
      portalMessages,
      notifications,

      // Lawyer context
      lawyerCases,
      lawyerAppointments,

      // Admin context
      adminStats,
      adminUsers,
      adminLawyers,
      adminCases,
      adminEnquiries,
      adminJobApplications,

      // Chat state
      chatHistory,
      isBotTyping,

      // Actions
      addBooking,
      addLead,
      addJobApplication,
      deleteJobApplication,
      addNewsletterSubscriber,
      subscribeToBriefings,
      registerClient,
      loginClient,
      logoutClient,
      deleteAccount,
      uploadPortalDocument,
      sendPortalMessage,
      payPortalInvoice,
      updateCaseStatus,
      assignLawyerToCase,
      updateAdminCase,
      deleteAdminCase,
      deleteEnquiry,
      deleteAllEnquiries,
      createAdminUser,
      updateAdminUser,
      deleteAdminUser,
      updateAdminLawyer,
      deleteAdminLawyer,
      approveAdminLawyer,
      rejectAdminLawyer,
      unpublishAdminLawyer,
      fetchLawyerProfile,
      updateLawyerProfile,
      submitLawyerProfileForReview,
      fetchPublicLawyers,
      fetchPublicPracticeAreas,
      fetchPublicBlogs,
      blogs: articles,
      updateEnquiryStatus,
      changeUserPassword,
      resetUserPassword,
      requestForgotPassword,
      handleChatSend,
      apiRequest
    }}>
      {children}
    </AppContext.Provider>
  );
};


