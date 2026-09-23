import express from 'express';
import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js';
import Enquiry from '../models/Enquiry.js';
import JobApplication from '../models/JobApplication.js';
import Newsletter from '../models/Newsletter.js';
import User from '../models/User.js';
import LawyerProfile from '../models/LawyerProfile.js';
import Blog from '../models/Blog.js';
import PracticeArea from '../models/PracticeArea.js';
import { submissionLimiter } from '../middleware/security.js';
import { handleResumeUpload } from '../middleware/upload.js';
import { 
  sendBookingEmail, 
  sendEnquiryAdminEmail, 
  sendNewsletterWelcomeEmail, 
  sendNewsletterSubscriptionEmails,
  sendBriefingsSubscriptionEmails,
  sendAppointmentConfirmedEmail, 
  sendCareerApplicationEmail,
  escapeHtml 
} from '../utils/mailer.js';
import { escapeRegex } from '../utils/regex.js';

const router = express.Router();

// POST /api/public/bookings - Public visitor schedules consultation (Rate limited)
router.post('/bookings', submissionLimiter, async (req, res) => {
  const { name, email, phone, date, timeSlot, description, practiceArea, lawyer, lawyerName, lawyerId } = req.body;

  if (!name || typeof name !== 'string' || !phone || typeof phone !== 'string' || !date || !timeSlot || !practiceArea) {
    return res.status(400).json({ message: 'Valid name, phone number, date, time slot, and practice area are required' });
  }

  try {
    const selectedLawyerId = (lawyerId && mongoose.Types.ObjectId.isValid(lawyerId)) ? lawyerId : null;
    const selectedLawyerName = (lawyer || lawyerName || '').trim();

    // Prevent double booking: per lawyer if selected; per firm slot if none selected
    const collisionFilter = {
      date: String(date).trim(),
      timeSlot: String(timeSlot).trim(),
      status: { $ne: 'CANCELLED' }
    };
    if (selectedLawyerId) {
      collisionFilter.lawyerId = selectedLawyerId;
    } else if (selectedLawyerName) {
      collisionFilter.lawyerName = selectedLawyerName;
    } else {
      collisionFilter.$or = [
        { lawyerId: null, lawyerName: { $in: ['', null] } }
      ];
    }

    const existingBooking = await Appointment.findOne(collisionFilter);
    if (existingBooking) {
      return res.status(409).json({
        message: selectedLawyerName || selectedLawyerId
          ? `This time slot is already booked for Advocate ${selectedLawyerName || 'selected'}. Please choose a different time or date.`
          : 'This consultation time slot is already booked. Please choose a different time or date.'
      });
    }

    const zoomLink = `https://meet.google.com/law-${Math.random().toString(36).substring(2, 7)}-zunc`;

    const newBooking = await Appointment.create({
      name: name.trim().slice(0, 100),
      email: (email && typeof email === 'string') ? email.trim().toLowerCase() : 'no-email-provided@lawzunction.in',
      phone: phone.trim().slice(0, 30),
      date,
      timeSlot,
      description: description ? String(description).slice(0, 1000) : '',
      practiceArea: String(practiceArea).slice(0, 100),
      lawyerName: lawyer || lawyerName || '',
      lawyerId: (lawyerId && mongoose.Types.ObjectId.isValid(lawyerId)) ? lawyerId : null,
      zoomLink,
      status: 'PENDING'
    });

    const bookingObj = newBooking.toJSON();
    if (lawyer || lawyerName) {
      bookingObj.lawyer = lawyer || lawyerName;
    }

    // Send email to client AND compulsory notification to Lawzunction admin/lawyer
    try {
      const emailRes = await sendBookingEmail(bookingObj);
      if (!emailRes.success) {
        console.warn('⚠️ [Booking Dispatch Notice]:', emailRes.error || emailRes.reason || 'Email dispatch had warnings');
      }
    } catch (emailErr) {
      console.error('⚠️ Failed to dispatch booking email via Resend:', emailErr.message || emailErr);
    }

    return res.status(201).json({
      success: true,
      booking: bookingObj
    });
  } catch (error) {
    console.error('Public booking error:', error);
    return res.status(500).json({ message: 'Failed to record consultation slot' });
  }
});

// GET /api/public/appointments/:id/confirm - Direct link from Lawzunction email to confirm appointment
router.get('/appointments/:id/confirm', async (req, res) => {
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send(`
      <div style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h2 style="color: #e74c3c;">Invalid Booking Reference</h2>
        <p>The appointment confirmation link is malformed or invalid.</p>
      </div>
    `);
  }

  try {
    const appt = await Appointment.findById(id);
    if (!appt) {
      return res.status(404).send(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #e74c3c;">Appointment Not Found</h2>
          <p>The specified appointment reference could not be located.</p>
        </div>
      `);
    }

    const wasPending = appt.status === 'PENDING';
    if (wasPending) {
      appt.status = 'CONFIRMED';
      await appt.save();

      const bookingObj = appt.toJSON();
      // Send confirmation email to client
      sendAppointmentConfirmedEmail(bookingObj).catch(err => console.error('Failed sending client confirmation email:', err));
    }

    // Sanitize all values before HTML interpolation to completely eliminate XSS
    const safeName = escapeHtml(appt.name);
    const safeDate = escapeHtml(appt.date);
    const safeTimeSlot = escapeHtml(appt.timeSlot);
    const safeRef = escapeHtml(appt._id.toString());
    const safeEmail = escapeHtml(appt.email);
    const safePracticeArea = escapeHtml(appt.practiceArea);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(`
      <div style="font-family: sans-serif; max-width: 500px; margin: 60px auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; text-align: center; background: #ffffff; box-shadow: 0 10px 25px rgba(0,0,0,0.08);">
        <div style="font-size: 50px; color: #059669; margin-bottom: 10px;">✔</div>
        <h2 style="color: #07172e; margin: 0 0 10px 0;">Appointment Confirmed!</h2>
        <p style="color: #475569; line-height: 1.5;">You have confirmed the consultation for <strong>${safeName}</strong> scheduled on <strong>${safeDate} (${safeTimeSlot})</strong>.</p>
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: left; font-size: 0.9rem;">
          <p style="margin: 4px 0;"><strong>Booking Reference:</strong> ${safeRef}</p>
          <p style="margin: 4px 0;"><strong>Client Email:</strong> ${safeEmail}</p>
          <p style="margin: 4px 0;"><strong>Practice Specialization:</strong> ${safePracticeArea}</p>
          <p style="margin: 4px 0;"><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">CONFIRMED</span></p>
        </div>
        <p style="font-size: 0.85rem; color: #059669;">An automated email confirmation with the meeting link has been dispatched.</p>
        <a href="/#/portal" style="display: inline-block; margin-top: 15px; background: #07172e; color: #ffd700; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: bold;">Return to Lawzunction Portal</a>
      </div>
    `);
  } catch (error) {
    console.error('Appointment confirm link error:', error);
    return res.status(500).send('Server Error confirming appointment');
  }
});


// POST /api/public/leads - Contact Form Intake (Rate limited)
router.post('/leads', submissionLimiter, async (req, res) => {
  const { name, email, phone, subject, message, practiceArea, urgency, type } = req.body;

  if (!name || typeof name !== 'string' || !phone || typeof phone !== 'string') {
    return res.status(400).json({ message: 'Valid name and phone number strings are required' });
  }

  try {
    const newEnquiry = await Enquiry.create({
      name: name.trim().slice(0, 100),
      email: (email && typeof email === 'string') ? email.trim().toLowerCase() : 'no-email-provided@lawzunction.in',
      phone: phone.trim().slice(0, 30),
      subject: subject ? String(subject).slice(0, 200) : 'General Inquiry',
      message: message ? String(message).slice(0, 3000) : `Intake Inquiry for ${practiceArea || 'General Advocacy'}`,
      practiceArea: practiceArea ? String(practiceArea).slice(0, 100) : 'General Advocacy',
      urgency: urgency || 'Routine',
      type: type || 'Smart Intake Inquiry',
      status: 'NEW'
    });

    const enquiryObj = newEnquiry.toJSON();
    try {
      const emailRes = await sendEnquiryAdminEmail(enquiryObj);
      if (!emailRes.success) {
        console.warn(`⚠️ [${enquiryObj.type} Dispatch Notice]:`, emailRes.error || emailRes.reason || 'Email dispatch had warnings');
      }
    } catch (emailErr) {
      console.error('⚠️ Failed to dispatch enquiry email via Resend:', emailErr.message || emailErr);
    }

    return res.status(201).json({
      success: true,
      enquiry: enquiryObj
    });
  } catch (error) {
    console.error('Contact submission error:', error);
    return res.status(500).json({ message: 'Failed to submit contact enquiry' });
  }
});

// POST /api/public/jobs/apply (and alias /careers/apply) - Careers application form (Rate limited with file upload validation)
router.post(['/jobs/apply', '/careers/apply'], submissionLimiter, handleResumeUpload, async (req, res) => {
  let body = req.body || {};
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (_) {
      body = {};
    }
  }

  // Support nested body wrappers if present (e.g. body.data, body.applicant, body.formData)
  if (body.data && typeof body.data === 'object') {
    body = { ...body.data, ...body };
  }
  if (body.applicant && typeof body.applicant === 'object') {
    body = { ...body.applicant, ...body };
  }
  if (body.formData && typeof body.formData === 'object') {
    body = { ...body.formData, ...body };
  }

  const jobId = body.jobId || body.position || body.targetJob || req.query?.jobId || 'GEN-APP';
  const jobTitle = body.jobTitle || body.position || body.targetJob || req.query?.jobTitle || 'General Application';
  const name = body.name || body.fullName || body.appName || body.applicantName || body.candidateName || req.query?.name;
  const email = body.email || body.appEmail || body.applicantEmail || req.query?.email;
  const phone = body.phone || body.appPhone || body.phoneNumber || body.contactNumber || req.query?.phone;
  const note = body.coverLetter || body.coverNote || body.message || body.appCover || '';
  const resumeFile = req.file ? req.file.originalname : (body.fileName ? String(body.fileName).slice(0, 200) : '');
  const experience = body.experience ? String(body.experience).slice(0, 100) : '';
  const portfolioUrl = body.portfolioUrl ? String(body.portfolioUrl).slice(0, 250) : '';

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ message: 'Full name is required for career application' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    return res.status(400).json({ message: 'A valid email address is required for career application' });
  }

  if (!phone || typeof phone !== 'string' || !phone.trim()) {
    return res.status(400).json({ message: 'A valid phone number is required for career application' });
  }

  try {
    const hasUploadedResume = Boolean(req.file && req.file.buffer);

    const newApp = await JobApplication.create({
      jobId: String(jobId).slice(0, 50),
      jobTitle: String(jobTitle).slice(0, 100),
      name: name.trim().slice(0, 100),
      email: email.trim().toLowerCase(),
      phone: phone.trim().slice(0, 30),
      coverLetter: note ? String(note).slice(0, 4000) : '',
      fileName: resumeFile,
      resumeData: hasUploadedResume ? req.file.buffer : null,
      resumeContentType: hasUploadedResume ? (req.file.mimetype || 'application/pdf') : 'application/pdf',
      resumeSize: hasUploadedResume ? req.file.size : 0,
      hasResume: hasUploadedResume
    });

    const appObj = newApp.toJSON();
    if (resumeFile) {
      appObj.fileName = resumeFile;
    }
    if (experience) {
      appObj.experience = experience;
    }
    if (portfolioUrl) {
      appObj.portfolioUrl = portfolioUrl;
    }

    // Build attachment list for Resend admin email
    const attachments = [];
    if (hasUploadedResume) {
      attachments.push({
        filename: req.file.originalname || 'Resume.pdf',
        content: req.file.buffer
      });
    }

    // Dispatch career application email to lawzunction@gmail.com with actual resume attached, and confirmation to candidate
    try {
      const emailRes = await sendCareerApplicationEmail(appObj, attachments);
      if (!emailRes.success) {
        console.warn('⚠️ [Career Dispatch Notice]:', emailRes.error || emailRes.reason || 'Email dispatch had warnings');
      }
    } catch (emailErr) {
      console.error('⚠️ Failed to dispatch career application email via Resend:', emailErr.message || emailErr);
    }

    return res.status(201).json({
      success: true,
      application: appObj
    });
  } catch (error) {
    console.error('Job application error:', error);
    return res.status(500).json({ message: 'Failed to record application details' });
  }
});

// POST /api/public/newsletter/subscribe - Firm Newsletter Subscriptions (Rate limited)
router.post('/newsletter/subscribe', submissionLimiter, async (req, res) => {
  let { email, name, phone, type } = req.body;

  if (typeof email === 'object' && email !== null) {
    name = email.name || name;
    phone = email.phone || phone;
    type = email.type || type;
    email = email.email;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    return res.status(400).json({ success: false, message: 'A valid email address is required for newsletter subscription' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = (name && typeof name === 'string') ? name.trim() : '';
  const cleanPhone = (phone && typeof phone === 'string') ? phone.trim() : '';
  const subscriptionType = (type && String(type).toLowerCase().includes('brief')) ? 'Briefings' : 'Newsletter';

  try {
    let subscriber = await Newsletter.findOne({ email: cleanEmail });
    if (!subscriber && cleanPhone) {
      subscriber = await Newsletter.findOne({ phone: cleanPhone });
    }

    if (!subscriber) {
      subscriber = await Newsletter.create({
        email: cleanEmail,
        name: cleanName,
        phone: cleanPhone,
        type: subscriptionType,
        source: req.body.source || 'Website Footer'
      });
    } else {
      if (cleanName) subscriber.name = cleanName;
      if (cleanPhone) subscriber.phone = cleanPhone;
      subscriber.email = cleanEmail;
      subscriber.type = subscriptionType;
      await subscriber.save();
    }

    // Trigger dedicated subscription emails based on type
    let emailRes;
    if (subscriptionType === 'Briefings') {
      emailRes = await sendBriefingsSubscriptionEmails({ email: cleanEmail, name: cleanName, phone: cleanPhone });
    } else {
      emailRes = await sendNewsletterSubscriptionEmails({ email: cleanEmail, name: cleanName, phone: cleanPhone });
    }

    if (!emailRes.success) {
      console.error(`❌ [${subscriptionType} Subscription Error]:`, emailRes.error || 'Failed to dispatch email');
      return res.status(502).json({
        success: false,
        message: `Subscription recorded, but email confirmation failed: ${emailRes.error?.message || emailRes.error || 'Resend API error'}`,
        error: emailRes.error
      });
    }

    return res.status(200).json({
      success: true,
      message: `Subscribed to ${subscriptionType === 'Briefings' ? 'Legal Briefings' : 'Firm Newsletter'} successfully. Confirmation email sent.`,
      subscriber: subscriber.toJSON()
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return res.status(500).json({ success: false, message: 'Failed to record subscription details' });
  }
});

// POST /api/public/briefings/subscribe - Knowledge Center Legal Briefings Subscriptions (Rate limited)
router.post('/briefings/subscribe', submissionLimiter, async (req, res) => {
  let { email, name, phone } = req.body;

  if (typeof email === 'object' && email !== null) {
    name = email.name || name;
    phone = email.phone || phone;
    email = email.email;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    return res.status(400).json({ success: false, message: 'A valid email address is required to subscribe to Briefings' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = (name && typeof name === 'string') ? name.trim() : 'Legal Professional';
  const cleanPhone = (phone && typeof phone === 'string') ? phone.trim() : '';

  try {
    let subscriber = await Newsletter.findOne({ email: cleanEmail });
    if (!subscriber && cleanPhone) {
      subscriber = await Newsletter.findOne({ phone: cleanPhone });
    }

    if (!subscriber) {
      subscriber = await Newsletter.create({
        email: cleanEmail,
        name: cleanName,
        phone: cleanPhone,
        type: 'Briefings',
        source: 'Knowledge Center'
      });
    } else {
      if (cleanName && cleanName !== 'Legal Professional') subscriber.name = cleanName;
      if (cleanPhone) subscriber.phone = cleanPhone;
      subscriber.email = cleanEmail;
      subscriber.type = 'Briefings';
      await subscriber.save();
    }

    // Await dedicated briefings email
    const emailRes = await sendBriefingsSubscriptionEmails({ email: cleanEmail, name: cleanName, phone: cleanPhone });

    if (!emailRes.success) {
      console.error('❌ [Briefings Subscription Error]:', emailRes.error || 'Failed to dispatch email');
      return res.status(502).json({
        success: false,
        message: `Subscription recorded, but briefings welcome email failed: ${emailRes.error?.message || emailRes.error || 'Resend API error'}`,
        error: emailRes.error
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Subscribed to Legal Briefings successfully. Welcome dispatch sent.',
      subscriber: subscriber.toJSON()
    });
  } catch (error) {
    console.error('Briefings subscription error:', error);
    return res.status(500).json({ success: false, message: 'Failed to record briefings subscription' });
  }
});

// GET /api/public/lawyers - Retrieve published lawyer catalog profiles
router.get('/lawyers', async (req, res) => {
  try {
    const {
      search,
      specialization,
      city,
      language,
      minExp,
      maxExp,
      page,
      limit,
      format
    } = req.query;

    // Strict requirement: return ONLY lawyers with profileStatus = 'published'
    const profileFilter = { profileStatus: 'published' };

    // Sanitize and cap length of user-supplied filter inputs (max 100 chars)
    const cleanSpec = typeof specialization === 'string' ? specialization.trim().slice(0, 100) : '';
    const cleanCity = typeof city === 'string' ? city.trim().slice(0, 100) : '';
    const cleanLang = typeof language === 'string' ? language.trim().slice(0, 100) : '';
    const cleanSearch = typeof search === 'string' ? search.trim().slice(0, 100) : '';

    if (cleanSpec) {
      profileFilter.specializations = { $in: [new RegExp(`^${escapeRegex(cleanSpec)}$`, 'i')] };
    }

    if (cleanCity) {
      profileFilter.city = { $regex: escapeRegex(cleanCity), $options: 'i' };
    }

    if (cleanLang) {
      profileFilter.languages = { $in: [new RegExp(`^${escapeRegex(cleanLang)}$`, 'i')] };
    }

    if (minExp !== undefined || maxExp !== undefined) {
      profileFilter.experience = {};
      if (minExp !== undefined && !isNaN(Number(minExp))) {
        profileFilter.experience.$gte = Number(minExp);
      }
      if (maxExp !== undefined && !isNaN(Number(maxExp))) {
        profileFilter.experience.$lte = Number(maxExp);
      }
    }

    const profiles = await LawyerProfile.find(profileFilter)
      .populate('userId', 'name')
      .sort({ approvedAt: -1, createdAt: -1 });

    // Filter by lawyer name if search term provided
    let list = profiles
      .filter(p => p.userId && p.userId.name) // Ensure linked user exists
      .map(p => ({
        id: p._id.toString(),
        userId: p.userId._id.toString(),
        name: p.userId.name,
        slug: p.slug,
        title: p.title || 'Advocate',
        photo: p.photo || '',
        experience: p.experience || 0,
        specializations: p.specializations || [],
        languages: p.languages || [],
        courts: p.courts || '',
        city: p.city || '',
        education: p.education || '',
        barCouncilNumber: p.barCouncilNumber || '',
        bio: p.bio || '',
        consultationFee: p.consultationFee || ''
      }));

    if (cleanSearch) {
      const searchLower = cleanSearch.toLowerCase();
      list = list.filter(l => 
        l.name.toLowerCase().includes(searchLower) ||
        (l.title && l.title.toLowerCase().includes(searchLower)) ||
        (l.city && l.city.toLowerCase().includes(searchLower)) ||
        (l.courts && l.courts.toLowerCase().includes(searchLower)) ||
        l.specializations.some(s => s.toLowerCase().includes(searchLower))
      );
    }

    const total = list.length;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSize = limit ? Math.max(1, parseInt(limit)) : (page ? 12 : total);
    const totalPages = Math.ceil(total / pageSize) || 1;
    const startIndex = (pageNum - 1) * pageSize;
    const paginatedList = list.slice(startIndex, startIndex + pageSize);

    res.setHeader('X-Total-Count', String(total));
    res.setHeader('X-Page', String(pageNum));
    res.setHeader('X-Total-Pages', String(totalPages));

    if (page || limit || format === 'object') {
      return res.json({
        success: true,
        lawyers: paginatedList,
        total,
        page: pageNum,
        totalPages,
        limit: pageSize
      });
    }

    return res.json(paginatedList);
  } catch (error) {
    console.error('Load public lawyers error:', error);
    return res.status(500).json({ message: 'Failed to retrieve lawyers catalog' });
  }
});

// GET /api/public/lawyers/:slugOrId - Retrieve individual published lawyer by SEO slug or ID
router.get('/lawyers/:slugOrId', async (req, res) => {
  const { slugOrId } = req.params;

  try {
    const isObjectId = mongoose.Types.ObjectId.isValid(slugOrId);
    const query = {
      profileStatus: 'published',
      $or: [
        { slug: slugOrId }
      ]
    };

    if (isObjectId) {
      query.$or.push({ _id: slugOrId });
    }

    const profile = await LawyerProfile.findOne(query).populate('userId', 'name');

    if (!profile || !profile.userId) {
      return res.status(404).json({ message: 'Advocate profile not found or is currently not published.' });
    }

    return res.json({
      id: profile._id.toString(),
      userId: profile.userId._id.toString(),
      name: profile.userId.name,
      slug: profile.slug,
      title: profile.title || 'Advocate',
      photo: profile.photo || '',
      experience: profile.experience || 0,
      specializations: profile.specializations || [],
      languages: profile.languages || [],
      courts: profile.courts || '',
      city: profile.city || '',
      education: profile.education || '',
      barCouncilNumber: profile.barCouncilNumber || '',
      bio: profile.bio || '',
      consultationFee: profile.consultationFee || ''
    });
  } catch (error) {
    console.error('Fetch lawyer detail error:', error);
    return res.status(500).json({ message: 'Failed to retrieve lawyer profile' });
  }
});

// GET /api/public/blogs - Retrieve published articles
router.get('/blogs', async (req, res) => {
  try {
    const blogs = await Blog.find({ published: true }).sort({ createdAt: -1 });
    return res.json(blogs.map(b => b.toJSON()));
  } catch (error) {
    console.error('Load public blogs error:', error);
    return res.status(500).json({ message: 'Failed to retrieve blog articles' });
  }
});

// GET /api/public/practice-areas - Retrieve practice areas catalog
router.get('/practice-areas', async (req, res) => {
  try {
    const areas = await PracticeArea.find();
    return res.json(areas.map(a => a.toJSON()));
  } catch (error) {
    console.error('Load public practice areas error:', error);
    return res.status(500).json({ message: 'Failed to retrieve practice areas' });
  }
});

export default router;
