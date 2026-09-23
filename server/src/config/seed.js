import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import LawyerProfile from '../models/LawyerProfile.js';
import PracticeArea from '../models/PracticeArea.js';
import Blog from '../models/Blog.js';

export const seedInitialData = async () => {
  try {
    // 1. Seed & Enforce Authorized Administrative Leadership
    const adminInitialPass = process.env.INITIAL_ADMIN_PASSWORD || 'Admin@Lawzunction2026!';
    const adminHashedPassword = await bcrypt.hash(adminInitialPass, 10);

    // Super Admin 1: Lawzunction (SUPER_ADMIN)
    let admin1 = await User.findOne({ email: 'lawzunction@gmail.com' });
    if (!admin1) {
      admin1 = await User.create({
        name: 'Lawzunction',
        email: 'lawzunction@gmail.com',
        phone: '+91 6263262661',
        password: adminHashedPassword,
        role: 'SUPER_ADMIN',
        mustChangePassword: true
      });
      console.log('✅ Super Admin (Lawzunction - lawzunction@gmail.com) initialized');
    } else {
      let updated = false;
      if (admin1.role !== 'SUPER_ADMIN') {
        admin1.role = 'SUPER_ADMIN';
        updated = true;
      }
      if (admin1.name !== 'Lawzunction') {
        admin1.name = 'Lawzunction';
        updated = true;
      }
      if (updated) {
        await admin1.save();
        console.log('✅ Updated Lawzunction role to SUPER_ADMIN');
      }
    }

    // Super Admin 2: Sumit Ransurma (SUPER_ADMIN)
    let admin2 = await User.findOne({ email: 'ransurmasumit@gmail.com' });
    if (!admin2) {
      admin2 = await User.create({
        name: 'Sumit Ransurma',
        email: 'ransurmasumit@gmail.com',
        phone: '+91 6263262661',
        password: adminHashedPassword,
        role: 'SUPER_ADMIN',
        mustChangePassword: true
      });
      console.log('✅ Super Admin (Sumit Ransurma - ransurmasumit@gmail.com) initialized');
    } else {
      let updated = false;
      if (admin2.role !== 'SUPER_ADMIN') {
        admin2.role = 'SUPER_ADMIN';
        updated = true;
      }
      if (admin2.name !== 'Sumit Ransurma') {
        admin2.name = 'Sumit Ransurma';
        updated = true;
      }
      if (updated) {
        await admin2.save();
        console.log('✅ Updated Sumit Ransurma role to SUPER_ADMIN');
      }
    }

    // Admin 3: Madhav Raghuwanshi (ADMIN)
    let admin3 = await User.findOne({ email: 'madhavraghuwanshi5@gmail.com' });
    if (!admin3) {
      admin3 = await User.create({
        name: 'Madhav Raghuwanshi',
        email: 'madhavraghuwanshi5@gmail.com',
        phone: '+91 9826012345',
        password: adminHashedPassword,
        role: 'ADMIN',
        mustChangePassword: true
      });
      console.log('✅ Admin (Madhav Raghuwanshi - madhavraghuwanshi5@gmail.com) initialized');
    } else {
      let updated = false;
      if (admin3.role !== 'ADMIN') {
        admin3.role = 'ADMIN';
        updated = true;
      }
      if (admin3.name !== 'Madhav Raghuwanshi') {
        admin3.name = 'Madhav Raghuwanshi';
        updated = true;
      }
      if (updated) {
        await admin3.save();
        console.log('✅ Updated Madhav Raghuwanshi role to ADMIN');
      }
    }

    // 2. Link Madhav Raghuwanshi's Lawyer Profile to his account if not already created
    if (admin3) {
      const existingMadhavProfile = await LawyerProfile.findOne({ userId: admin3._id });
      if (!existingMadhavProfile) {
        await LawyerProfile.create({
          userId: admin3._id,
          title: 'Senior Managing Partner',
          experience: 16,
          specializations: ['Corporate & M&A', 'Intellectual Property', 'Commercial Arbitration'],
          bio: 'Senior Counsel specializing in cross-border acquisitions, IP litigation, and corporate restructuring.',
          education: 'B.A. LL.B. (Hons.) - NLSIU Bangalore, LL.M. - Harvard Law School',
          linkedin: 'https://linkedin.com/in/madhav-raghuwanshi',
          slug: 'madhav-raghuwanshi',
          profileStatus: 'published',
          mustChangePassword: false,
          approvedAt: new Date()
        });
      } else {
        if (!existingMadhavProfile.slug) {
          existingMadhavProfile.slug = 'madhav-raghuwanshi';
        }
        if (!existingMadhavProfile.profileStatus) {
          existingMadhavProfile.profileStatus = 'published';
          existingMadhavProfile.mustChangePassword = false;
          existingMadhavProfile.approvedAt = existingMadhavProfile.approvedAt || new Date();
        }
        await existingMadhavProfile.save();
      }
    }

    // 4. Seed Practice Areas if empty
    const practiceCount = await PracticeArea.countDocuments();
    if (practiceCount === 0) {
      await PracticeArea.insertMany([
        {
          name: 'Corporate & M&A',
          icon: 'Briefcase',
          description: 'Strategic advisory on mergers, acquisitions, corporate structuring, and cross-border commercial transactions.',
          overview: 'Our Corporate practice offers end-to-end legal support for enterprise acquisitions, joint ventures, regulatory compliance, and governance.',
          services: ['Cross-Border M&A Structuring', 'Share Purchase Agreements (SPA)', 'Due Diligence Reports', 'Corporate Governance Advisory'],
          faqs: [
            { q: 'What is involved in legal due diligence?', a: 'Due diligence assesses target company liabilities, tax compliance, material contracts, IP holdings, and litigation risk.' }
          ]
        },
        {
          name: 'Intellectual Property (IP)',
          icon: 'ShieldCheck',
          description: 'Protection and litigation for trademarks, patents, copyright, and trade secret assets.',
          overview: 'Comprehensive brand and asset portfolio management for startups, tech firms, and enterprise corporations.',
          services: ['Trademark Filing & Prosecution', 'Patent Drafting & Opposition', 'IP Infringement Litigation', 'Licensing & Franchise Agreements'],
          faqs: [
            { q: 'How long does a trademark registration take in India?', a: 'Typically 6 to 12 months assuming no opposition from third parties or registry objections.' }
          ]
        },
        {
          name: 'Litigation & Dispute Resolution',
          icon: 'Scale',
          description: 'Representation across Supreme Court, High Courts, NCLT, and international arbitration tribunals.',
          overview: 'Robust courtroom defense and strategic alternative dispute resolution (ADR) for high-stakes commercial disputes.',
          services: ['Civil & Commercial Litigation', 'National Company Law Tribunal (NCLT)', 'Arbitration & Mediation', 'Writ Petitions'],
          faqs: [
            { q: 'What is the benefit of Commercial Arbitration?', a: 'Arbitration offers confidential, faster, and specialized resolution compared to traditional civil court trials.' }
          ]
        },
        {
          name: 'Taxation & Regulatory',
          icon: 'FileText',
          description: 'Direct & indirect tax advisory, GST compliance, income tax appeals, and cross-border transfer pricing.',
          overview: 'Strategic tax optimization and representation before appellate tribunals and tax authorities.',
          services: ['Direct Tax Litigation', 'GST Audit & Advisory', 'Transfer Pricing Documentation', 'FEMA Compliance'],
          faqs: [
            { q: 'Can tax penalties be appealed?', a: 'Yes, tax assessment orders can be challenged before the Commissioner (Appeals) and ITAT tribunal.' }
          ]
        }
      ]);
      console.log('✅ Default Practice Areas seeded.');
    }

    // 4. Seed Blogs if empty
    const blogCount = await Blog.countDocuments();
    if (blogCount === 0) {
      await Blog.insertMany([
        {
          title: 'Key Regulatory Changes in Cross-Border M&A Transactions for 2026',
          summary: 'An analysis of updated RBI Foreign Exchange Management regulations and NCLT approval timelines for cross-border mergers.',
          category: 'Corporate Law',
          authorName: 'Madhav Raghuwanshi',
          date: 'May 28, 2026',
          readTime: '6 min read',
          published: true,
          content: 'Cross-border M&A in India has seen significant procedural streamlining under recent RBI notification updates. This article breaks down mandatory filing benchmarks...'
        },
        {
          title: 'Protecting Artificial Intelligence Trade Secrets & IP in SaaS Platforms',
          summary: 'Essential contractual safeguards, source code licensing models, and trademark defense strategies for modern tech companies.',
          category: 'Intellectual Property',
          authorName: 'Madhav Raghuwanshi',
          date: 'May 14, 2026',
          readTime: '4 min read',
          published: true,
          content: 'As proprietary AI algorithms become central to software platforms, protecting trade secrets requires robust Non-Disclosure Agreements (NDAs) and clean IP assignment clauses...'
        }
      ]);
      console.log('✅ Default Legal Articles seeded.');
    }

  } catch (error) {
    console.error('Error during initial DB seeding:', error.message);
  }
};
