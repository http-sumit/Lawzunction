import express from 'express';
import Case from '../models/Case.js';
import Appointment from '../models/Appointment.js';
import Enquiry from '../models/Enquiry.js';
import Document from '../models/Document.js';
import Notification from '../models/Notification.js';
import Invoice from '../models/Invoice.js';
import Message from '../models/Message.js';
import { verifyJWT } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roles.js';
import { messageLimiter, uploadLimiter, submissionLimiter } from '../middleware/security.js';
import { sendBookingEmail, sendEnquiryAdminEmail } from '../utils/mailer.js';
import { logActivity } from '../utils/logger.js';


const router = express.Router();

router.use(verifyJWT);
router.use((req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized access' });
  }
  if (['CLIENT', 'ADMIN', 'SUPER_ADMIN', 'LAWYER'].includes(req.user.role)) {
    return next();
  }
  return res.status(403).json({ message: 'Forbidden: Access restricted' });
});

/**
 * Verifies whether the authenticated user has authorization to access the target case.
 * - CLIENT: Only if case.clientId matches user's ClientProfile id
 * - LAWYER / ADMIN-LAWYER: Only if case.lawyerId matches user's LawyerProfile id
 * - ADMIN / SUPER_ADMIN: Unrestricted access
 */
const canAccessCase = (user, caseDoc) => {
  if (!user || !caseDoc) return false;
  if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') return true;
  if (user.role === 'CLIENT' && user.clientProfile) {
    const userClientProfileId = String(user.clientProfile.id || user.clientProfile._id);
    const caseClientId = String(caseDoc.clientId?._id || caseDoc.clientId || '');
    return userClientProfileId === caseClientId;
  }
  if ((user.role === 'LAWYER' || user.lawyerProfile) && user.lawyerProfile) {
    const userLawyerProfileId = String(user.lawyerProfile.id || user.lawyerProfile._id);
    const caseLawyerId = String(caseDoc.lawyerId?._id || caseDoc.lawyerId || '');
    return userLawyerProfileId === caseLawyerId;
  }
  return false;
};

// GET /api/client/cases - Retrieve cases accessible to current user
router.get('/cases', async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'CLIENT') {
      if (!req.user.clientProfile) {
        return res.status(404).json({ message: 'No client profile found for your account' });
      }
      filter.clientId = req.user.clientProfile.id || req.user.clientProfile._id;
    } else if (req.user.role === 'LAWYER') {
      if (!req.user.lawyerProfile) {
        return res.status(404).json({ message: 'No lawyer profile found for your account' });
      }
      filter.lawyerId = req.user.lawyerProfile.id || req.user.lawyerProfile._id;
    } else if (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN') {
      if (req.query.clientId) filter.clientId = req.query.clientId;
    } else {
      return res.status(404).json({ message: 'Cases not found' });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const total = await Case.countDocuments(filter);
    const cases = await Case.find(filter)
      .populate({
        path: 'lawyerId',
        populate: { path: 'userId', select: 'name email' }
      })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const formattedCases = await Promise.all(cases.map(async (c) => {
      const caseObj = c.toJSON();
      const docs = await Document.find({ caseId: c._id });
      caseObj.documents = docs.map(d => d.toJSON());
      if (c.lawyerId) {
        caseObj.lawyer = c.lawyerId.toJSON();
        if (c.lawyerId.userId) {
          caseObj.lawyer.user = c.lawyerId.userId.toJSON();
        }
      }
      return caseObj;
    }));

    return res.json({
      success: true,
      data: formattedCases,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (error) {
    console.error('Client cases load error:', error);
    return res.status(500).json({ message: 'Failed to retrieve cases' });
  }
});

// GET /api/client/cases/:id - Retrieve single case detail (Ownership protected)
router.get('/cases/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const caseRecord = await Case.findById(id)
      .populate({
        path: 'lawyerId',
        populate: { path: 'userId', select: 'name email' }
      })
      .populate({
        path: 'clientId',
        populate: { path: 'userId', select: 'name email phone' }
      });

    if (!caseRecord || !canAccessCase(req.user, caseRecord)) {
      return res.status(404).json({ message: 'Case not found' });
    }

    const caseObj = caseRecord.toJSON();
    const docs = await Document.find({ caseId: caseRecord._id });
    caseObj.documents = docs.map(d => d.toJSON());
    return res.json(caseObj);
  } catch (error) {
    console.error('Get case detail error:', error);
    return res.status(500).json({ message: 'Failed to retrieve case details' });
  }
});

// GET /api/client/appointments - Fetch client appointments
router.get('/appointments', async (req, res) => {
  const clientProfile = req.user.clientProfile;

  if (!clientProfile) {
    return res.status(403).json({ message: 'Client profile missing' });
  }

  try {
    const appts = await Appointment.find({ clientId: clientProfile.id })
      .sort({ date: -1 });
    return res.json(appts.map(a => a.toJSON()));
  } catch (error) {
    console.error('Client appointments load error:', error);
    return res.status(500).json({ message: 'Failed to load bookings' });
  }
});

// POST /api/client/appointments/book - Book consultation linked to client account (Rate limited)
router.post('/appointments/book', submissionLimiter, async (req, res) => {
  const { name, email, phone, date, timeSlot, description, practiceArea, lawyer, lawyerName, lawyerId } = req.body;
  const clientProfile = req.user.clientProfile;

  if (!clientProfile) {
    return res.status(403).json({ message: 'Client profile missing' });
  }

  const clientEmail = (email && typeof email === 'string') ? email.trim() : (req.user.email || 'no-email-provided@lawzunction.in');
  const clientPhone = (phone && typeof phone === 'string') ? phone.trim() : (req.user.phone || 'N/A');
  const clientName = (name && typeof name === 'string') ? name.trim() : (req.user.name || 'Client');

  if (!clientName || !clientPhone || !date || !timeSlot || !practiceArea) {
    return res.status(400).json({ message: 'Required appointment parameters missing (name, phone, date, timeSlot, practiceArea)' });
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
      clientId: clientProfile.id,
      name: clientName,
      email: clientEmail,
      phone: clientPhone,
      date,
      timeSlot,
      description: description || '',
      practiceArea,
      lawyerName: lawyer || lawyerName || '',
      lawyerId: (lawyerId && mongoose.Types.ObjectId.isValid(lawyerId)) ? lawyerId : null,
      zoomLink,
      status: 'PENDING'
    });

    const bookingObj = newBooking.toJSON();
    if (lawyer || lawyerName) {
      bookingObj.lawyer = lawyer || lawyerName;
    }

    // Send confirmation email to client AND compulsory notification to Lawzunction
    try {
      const emailRes = await sendBookingEmail(bookingObj);
      if (!emailRes.success) {
        console.warn('⚠️ [Client Booking Dispatch Notice]:', emailRes.error || emailRes.reason || 'Email dispatch had warnings');
      }
    } catch (emailErr) {
      console.error('⚠️ Failed to dispatch client booking email via Resend:', emailErr.message || emailErr);
    }

    await logActivity(req.user.id, 'Book Appointment', `Scheduled consultation for ${date}`);

    return res.status(201).json({ success: true, booking: bookingObj });
  } catch (error) {
    console.error('Book appointment error:', error);
    return res.status(500).json({ message: 'Failed to schedule consultation' });
  }
});

// POST /api/client/enquiries/submit - Submit case enquiry linked to client (Rate limited)
router.post('/enquiries/submit', submissionLimiter, async (req, res) => {

  const { name, email, phone, subject, message, practiceArea, urgency, type } = req.body;
  const clientProfile = req.user.clientProfile;

  if (!clientProfile) {
    return res.status(403).json({ message: 'Client profile missing' });
  }

  const clientName = (name && typeof name === 'string' && name.trim()) ? name.trim() : (req.user.name || 'Client');
  const clientEmail = (email && typeof email === 'string' && email.trim()) ? email.trim() : (req.user.email || 'no-email-provided@lawzunction.in');
  const clientPhone = (phone && typeof phone === 'string' && phone.trim()) ? phone.trim() : (req.user.phone || 'N/A');

  const inquiryType = type || 'Smart Intake Inquiry';
  const enquiryMessage = message || (inquiryType === 'Callback Request' ? 'Strategic Callback requested via client account' : `Intake Inquiry for ${practiceArea || 'General Advocacy'}`);

  try {
    const newEnquiry = await Enquiry.create({
      clientId: clientProfile.id,
      name: clientName,
      email: clientEmail,
      phone: clientPhone,
      subject: subject || (inquiryType === 'Callback Request' ? 'Callback Request' : 'Legal Inquiry'),
      message: enquiryMessage,
      practiceArea: practiceArea || 'General Advocacy',
      urgency: urgency || 'Routine',
      type: inquiryType
    });

    const enquiryObj = newEnquiry.toJSON();
    try {
      const emailRes = await sendEnquiryAdminEmail(enquiryObj);
      if (!emailRes.success) {
        console.warn(`⚠️ [Client ${inquiryType} Dispatch Notice]:`, emailRes.error || emailRes.reason || 'Email dispatch had warnings');
      }
    } catch (emailErr) {
      console.error('⚠️ Failed to dispatch client enquiry email via Resend:', emailErr.message || emailErr);
    }
    await logActivity(req.user.id, 'Submit Client Enquiry', `Sent message: ${subject}`);

    return res.status(201).json({ success: true, enquiry: enquiryObj });
  } catch (error) {
    console.error('Submit enquiry error:', error);
    return res.status(500).json({ message: 'Failed to record legal enquiry' });
  }
});

// GET /api/client/documents - Retrieve files accessible to the caller
router.get('/documents', async (req, res) => {
  try {
    const { caseId } = req.query;

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    if (caseId) {
      const targetCase = await Case.findById(caseId);
      if (!targetCase || !canAccessCase(req.user, targetCase)) {
        return res.status(404).json({ message: 'Case not found' });
      }
      const total = await Document.countDocuments({ caseId });
      const docs = await Document.find({ caseId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      return res.json({
        success: true,
        data: docs.map(d => d.toJSON()),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1
        }
      });
    }

    let filter = {};
    if (req.user.role === 'CLIENT') {
      if (!req.user.clientProfile) {
        return res.status(404).json({ message: 'Client profile missing' });
      }
      filter = { clientId: req.user.clientProfile.id || req.user.clientProfile._id };
    } else if (req.user.role === 'LAWYER') {
      if (!req.user.lawyerProfile) {
        return res.status(404).json({ message: 'Lawyer profile missing' });
      }
      const lawyerCases = await Case.find({ lawyerId: req.user.lawyerProfile.id || req.user.lawyerProfile._id }).select('_id');
      const caseIds = lawyerCases.map(c => c._id);
      filter = { caseId: { $in: caseIds } };
    } else if (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN') {
      filter = {};
    } else {
      return res.status(404).json({ message: 'Documents not found' });
    }

    const total = await Document.countDocuments(filter);
    const docs = await Document.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.json({
      success: true,
      data: docs.map(d => d.toJSON()),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (error) {
    console.error('Client documents error:', error);
    return res.status(500).json({ message: 'Failed to load document library' });
  }
});

// GET /api/client/documents/:id/download - Secure document download with ownership verification
router.get('/documents/:id/download', async (req, res) => {
  const { id } = req.params;
  try {
    const doc = await Document.findById(id);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Verify ownership
    if (doc.caseId) {
      const caseRecord = await Case.findById(doc.caseId);
      if (!caseRecord || !canAccessCase(req.user, caseRecord)) {
        return res.status(404).json({ message: 'Document not found' });
      }
    } else if (doc.clientId) {
      if (req.user.role === 'CLIENT') {
        const clientProfileId = String(req.user.clientProfile?.id || req.user.clientProfile?._id || '');
        if (String(doc.clientId) !== clientProfileId) {
          return res.status(404).json({ message: 'Document not found' });
        }
      } else if (req.user.role === 'LAWYER') {
        const lawyerProfileId = req.user.lawyerProfile?.id || req.user.lawyerProfile?._id;
        const activeMatter = await Case.findOne({ clientId: doc.clientId, lawyerId: lawyerProfileId });
        if (!activeMatter) {
          return res.status(404).json({ message: 'Document not found' });
        }
      }
    }

    return res.json({
      success: true,
      id: doc._id.toString(),
      name: doc.name,
      fileUrl: doc.fileUrl,
      size: doc.size,
      caseId: doc.caseId
    });
  } catch (error) {
    console.error('Download document error:', error);
    return res.status(500).json({ message: 'Failed to process document request' });
  }
});

// POST /api/client/documents/upload - Record document vault file metadata (Rate limited & ownership checked)
router.post('/documents/upload', uploadLimiter, async (req, res) => {
  const { name, fileUrl, size, caseId } = req.body;
  const clientProfile = req.user.clientProfile;

  if (!clientProfile) {
    return res.status(404).json({ message: 'Client profile missing' });
  }

  if (!name || typeof name !== 'string' || !fileUrl || typeof fileUrl !== 'string' || !size) {
    return res.status(400).json({ message: 'Valid name, file URL, and size are required' });
  }

  // Validate allowed file extensions (prevent executable or dangerous script uploads)
  const fileExt = name.split('.').pop().toLowerCase();
  const allowedExtensions = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'txt', 'rtf', 'odt'];
  if (!allowedExtensions.includes(fileExt)) {
    return res.status(400).json({ message: `File type .${fileExt} is not permitted. Allowed: ${allowedExtensions.join(', ')}` });
  }

  // Protocol validation: ensure fileUrl is HTTPS or safe HTTP
  if (!fileUrl.startsWith('https://') && !fileUrl.startsWith('http://')) {
    return res.status(400).json({ message: 'Invalid or unsafe file URL protocol' });
  }

  try {
    // IDOR Prevention: Verify client owns the case if caseId is provided (return 404 to avoid leak)
    if (caseId) {
      const ownedCase = await Case.findById(caseId);
      if (!ownedCase || !canAccessCase(req.user, ownedCase)) {
        return res.status(404).json({ message: 'Case not found' });
      }
    }

    const sanitizedFileName = name.replace(/[^\w\s.-]/gi, '_');

    const newDoc = await Document.create({
      clientId: clientProfile.id,
      name: sanitizedFileName,
      fileUrl,
      size: String(size),
      uploadedBy: 'Client (You)',
      caseId: caseId || null
    });

    await logActivity(req.user.id, 'Document Upload', `Uploaded file: ${sanitizedFileName}`);

    return res.status(201).json(newDoc.toJSON());
  } catch (error) {
    console.error('Record document error:', error.message || error);
    return res.status(500).json({ message: 'Failed to save document metadata link' });
  }
});

// GET /api/client/notifications - Fetch user notices
router.get('/notifications', async (req, res) => {
  try {
    const notices = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    return res.json(notices.map(n => n.toJSON()));
  } catch (error) {
    console.error('Notifications fetch error:', error.message || error);
    return res.status(500).json({ message: 'Failed to load notifications' });
  }
});

// PUT /api/client/notifications/read - Mark notices read
router.put('/notifications/read', async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { $set: { read: true } }
    );
    return res.json({ success: true });
  } catch (error) {
    console.error('Notifications read error:', error.message || error);
    return res.status(500).json({ message: 'Failed to update notifications' });
  }
});

// GET /api/client/invoices - Fetch client invoices
router.get('/invoices', async (req, res) => {
  try {
    const filter = (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN')
      ? (req.query.userId ? { userId: req.query.userId } : {})
      : { userId: req.user.id };
    const invoices = await Invoice.find(filter)
      .sort({ createdAt: -1 });
    return res.json(invoices.map(i => i.toJSON()));
  } catch (error) {
    console.error('Client invoices error:', error.message || error);
    return res.status(500).json({ message: 'Failed to fetch invoices' });
  }
});

// GET /api/client/invoices/:id - Fetch single invoice with ownership verification
router.get('/invoices/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN' && String(invoice.userId) !== String(req.user.id)) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    return res.json(invoice.toJSON());
  } catch (error) {
    console.error('Fetch invoice detail error:', error.message || error);
    return res.status(500).json({ message: 'Failed to retrieve invoice' });
  }
});

// PUT /api/client/invoices/:id/pay - Pay invoice (Server-side status and ownership verification)
router.put('/invoices/:id/pay', async (req, res) => {
  const { id } = req.params;
  try {
    const invoice = await Invoice.findOne({ _id: id, userId: req.user.id });
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (invoice.status === 'Paid') {
      return res.status(400).json({ message: 'Invoice is already settled' });
    }

    invoice.status = 'Paid';
    await invoice.save();

    await logActivity(req.user.id, 'Invoice Settlement', `Settled invoice #${id} for ${invoice.amount}`);

    return res.json({ success: true, invoice: invoice.toJSON() });
  } catch (error) {
    console.error('Pay invoice error:', error.message || error);
    return res.status(500).json({ message: 'Failed to process invoice settlement' });
  }
});

// GET /api/client/messages - Fetch chat history
router.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find({ userId: req.user.id })
      .sort({ createdAt: 1 });
    return res.json(messages.map(m => m.toJSON()));
  } catch (error) {
    console.error('Fetch messages error:', error);
    return res.status(500).json({ message: 'Failed to load messages' });
  }
});

// POST /api/client/messages - Send client message and auto-trigger response (Rate limited)
router.post('/messages', messageLimiter, async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ message: 'Valid message text is required' });
  }

  const cleanText = text.trim();
  if (cleanText.length > 2000) {
    return res.status(400).json({ message: 'Message text cannot exceed 2000 characters' });
  }

  try {
    const timeStr = new Date().toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const newMsg = await Message.create({
      userId: req.user.id,
      sender: 'Client (You)',
      text: cleanText,
      time: timeStr
    });


    // Background auto-reply timeout on server
    setTimeout(async () => {
      try {
        const responses = [
          "Thank you for the message. I will review this draft and get back to you by tomorrow morning.",
          "Got it, our team is already working on drafting the reply petition.",
          "Understood. Let's schedule a brief call at 4:00 PM today to discuss this.",
          "Received. I will look over the upload and confirm if any details are missing."
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];

        await Message.create({
          userId: req.user.id,
          sender: 'Madhav Raghuwanshi',
          text: randomResponse,
          time: new Date().toLocaleString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        });
      } catch (err) {
        console.error('Error inserting auto message:', err);
      }
    }, 2000);

    return res.status(201).json(newMsg.toJSON());
  } catch (error) {
    console.error('Post message error:', error);
    return res.status(500).json({ message: 'Failed to send message' });
  }
});

// GET /api/client/cases/:caseId/messages - Fetch messages for a specific case with access control
router.get('/cases/:caseId/messages', async (req, res) => {
  const { caseId } = req.params;
  try {
    const caseRecord = await Case.findById(caseId);
    if (!caseRecord || !canAccessCase(req.user, caseRecord)) {
      return res.status(404).json({ message: 'Case not found' });
    }

    const messages = await Message.find({ caseId })
      .sort({ createdAt: 1 });
    return res.json(messages.map(m => m.toJSON()));
  } catch (error) {
    console.error('Fetch case messages error:', error);
    return res.status(500).json({ message: 'Failed to load case messages' });
  }
});

// POST /api/client/cases/:caseId/messages - Post message to a specific case with access control
router.post('/cases/:caseId/messages', messageLimiter, async (req, res) => {
  const { caseId } = req.params;
  const { text } = req.body;

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ message: 'Valid message text is required' });
  }

  const cleanText = text.trim();
  if (cleanText.length > 2000) {
    return res.status(400).json({ message: 'Message text cannot exceed 2000 characters' });
  }

  try {
    const caseRecord = await Case.findById(caseId);
    if (!caseRecord || !canAccessCase(req.user, caseRecord)) {
      return res.status(404).json({ message: 'Case not found' });
    }

    const timeStr = new Date().toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const senderRoleLabel = req.user.role === 'CLIENT' ? 'Client (You)' : (req.user.name || 'Advocate');

    const newMsg = await Message.create({
      userId: req.user.id,
      caseId: caseRecord._id,
      sender: senderRoleLabel,
      text: cleanText,
      time: timeStr
    });

    return res.status(201).json(newMsg.toJSON());
  } catch (error) {
    console.error('Post case message error:', error);
    return res.status(500).json({ message: 'Failed to send message' });
  }
});

export default router;
