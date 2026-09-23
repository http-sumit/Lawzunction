import express from 'express';
import User from '../models/User.js';
import LawyerProfile from '../models/LawyerProfile.js';
import Case from '../models/Case.js';
import Notification from '../models/Notification.js';
import Document from '../models/Document.js';
import Appointment from '../models/Appointment.js';
import { verifyJWT } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roles.js';
import { uploadLimiter } from '../middleware/security.js';
import { sendCaseUpdateEmail, sendLawyerProfileSubmittedAdminEmail } from '../utils/mailer.js';
import { logActivity } from '../utils/logger.js';
import { generateUniqueSlug } from '../utils/slug.js';


const router = express.Router();

router.use(verifyJWT);
router.use((req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized access' });
  }
  // Allow LAWYER or any ADMIN / SUPER_ADMIN who has a lawyer profile
  if (req.user.role === 'LAWYER' || req.user.lawyerProfile || req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN') {
    return next();
  }
  return res.status(403).json({ message: 'Forbidden: Access restricted to lawyers' });
});

// GET /api/lawyer/cases - Retrieve cases assigned to the authenticated lawyer
router.get('/cases', async (req, res) => {
  const lawyerProfile = req.user.lawyerProfile;

  if (!lawyerProfile) {
    return res.status(403).json({ message: 'No associated lawyer profile found' });
  }

  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const filter = { lawyerId: lawyerProfile.id };
    const total = await Case.countDocuments(filter);

    const cases = await Case.find(filter)
      .populate({
        path: 'clientId',
        populate: { path: 'userId', select: 'name email phone' }
      })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const formattedCases = await Promise.all(cases.map(async (c) => {
      const caseObj = c.toJSON();
      const docs = await Document.find({ caseId: c._id });
      caseObj.documents = docs.map(d => d.toJSON());
      if (c.clientId) {
        caseObj.client = c.clientId.toJSON();
        if (c.clientId.userId) {
          caseObj.client.user = c.clientId.userId.toJSON();
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
    console.error('Lawyer cases error:', error);
    return res.status(500).json({ message: 'Failed to retrieve assigned cases' });
  }
});

// PUT /api/lawyer/cases/:caseId/status - Update case milestone and progress percentage
router.put('/cases/:caseId/status', async (req, res) => {
  const { caseId } = req.params;
  const { status, progress, lastUpdate } = req.body;
  const lawyerProfile = req.user.lawyerProfile;

  if (!lawyerProfile) {
    return res.status(403).json({ message: 'No associated lawyer profile found' });
  }

  try {
    const caseRecord = await Case.findOne({ _id: caseId, lawyerId: lawyerProfile.id })
      .populate({
        path: 'clientId',
        populate: { path: 'userId' }
      });

    if (!caseRecord) {
      return res.status(404).json({ message: 'Assigned case not found' });
    }

    if (status) caseRecord.status = status;
    if (progress !== undefined) caseRecord.progress = parseInt(progress);
    if (lastUpdate) caseRecord.lastUpdate = lastUpdate;
    await caseRecord.save();

    const clientUser = caseRecord.clientId && caseRecord.clientId.userId;
    if (clientUser) {
      await Notification.create({
        userId: clientUser._id,
        message: `Your active case "${caseRecord.title}" was updated to: ${caseRecord.status} (${caseRecord.progress}% completed).`
      });

      try {
        await sendCaseUpdateEmail(
          clientUser.email,
          clientUser.name,
          caseRecord.title,
          caseRecord.status,
          caseRecord.progress,
          lastUpdate
        );
      } catch (emailErr) {
        console.error('⚠️ Failed to dispatch case update email via Resend:', emailErr.message || emailErr);
      }
    }

    await logActivity(req.user.id, 'Update Case Status', `Updated progress of case ${caseId} to ${progress}%`);

    return res.json({ success: true, case: caseRecord.toJSON() });
  } catch (error) {
    console.error('Case update error:', error);
    return res.status(500).json({ message: 'Failed to update case progress details' });
  }
});

// POST /api/lawyer/documents/upload - Lawyer uploads case file (Rate limited & IDOR protected)
router.post('/documents/upload', uploadLimiter, async (req, res) => {
  const { name, fileUrl, size, caseId, clientId } = req.body;
  const lawyerProfile = req.user.lawyerProfile;

  if (!lawyerProfile) {
    return res.status(403).json({ message: 'No associated lawyer profile found' });
  }

  if (!name || typeof name !== 'string' || !fileUrl || typeof fileUrl !== 'string' || !size) {
    return res.status(400).json({ message: 'Valid name, file URL, and size are required' });
  }

  // Validate allowed extensions
  const fileExt = name.split('.').pop().toLowerCase();
  const allowedExtensions = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'txt', 'rtf', 'odt'];
  if (!allowedExtensions.includes(fileExt)) {
    return res.status(400).json({ message: `File type .${fileExt} is not permitted.` });
  }

  if (!fileUrl.startsWith('https://') && !fileUrl.startsWith('http://')) {
    return res.status(400).json({ message: 'Invalid or unsafe file URL protocol' });
  }

  try {
    let targetClientId = null;

    // IDOR Prevention: Verify lawyer assignment to case and enforce client linkage
    if (caseId) {
      const assignedCase = await Case.findOne({ _id: caseId, lawyerId: lawyerProfile.id });
      if (!assignedCase) {
        return res.status(403).json({ message: 'Access denied: You are not assigned to this case file' });
      }
      targetClientId = assignedCase.clientId;
    } else if (clientId) {
      // If uploading directly to a client without caseId, verify the lawyer represents this client
      const activeMatter = await Case.findOne({ clientId, lawyerId: lawyerProfile.id });
      if (!activeMatter) {
        return res.status(403).json({ message: 'Access denied: You do not represent this client in any active legal matter' });
      }
      targetClientId = clientId;
    }

    const sanitizedFileName = name.replace(/[^\w\s.-]/gi, '_');

    const newDoc = await Document.create({
      name: sanitizedFileName,
      fileUrl,
      size: String(size),
      uploadedBy: `Lawyer - ${req.user.name}`,
      caseId: caseId || null,
      clientId: targetClientId
    });

    await logActivity(req.user.id, 'Lawyer Document Upload', `Uploaded file: ${sanitizedFileName}`);
    return res.status(201).json(newDoc.toJSON());
  } catch (error) {
    console.error('Lawyer document upload error:', error.message || error);
    return res.status(500).json({ message: 'Failed to upload case document' });
  }
});


// GET /api/lawyer/clients - View clients linked to this lawyer's cases
router.get('/clients', async (req, res) => {
  const lawyerProfile = req.user.lawyerProfile;

  if (!lawyerProfile) {
    return res.status(403).json({ message: 'No associated lawyer profile found' });
  }

  try {
    const cases = await Case.find({ lawyerId: lawyerProfile.id })
      .populate({
        path: 'clientId',
        populate: { path: 'userId', select: 'name email phone' }
      });

    const clientsMap = {};
    cases.forEach(c => {
      if (c.clientId && c.clientId.userId) {
        const cId = c.clientId._id.toString();
        clientsMap[cId] = {
          id: cId,
          company: c.clientId.company,
          address: c.clientId.address,
          name: c.clientId.userId.name,
          email: c.clientId.userId.email,
          phone: c.clientId.userId.phone
        };
      }
    });

    return res.json(Object.values(clientsMap));
  } catch (error) {
    console.error('Lawyer clients error:', error);
    return res.status(500).json({ message: 'Failed to load client details' });
  }
});

// GET /api/lawyer/appointments - View appointments booked with this lawyer
router.get('/appointments', async (req, res) => {
  const lawyerProfile = req.user.lawyerProfile;

  if (!lawyerProfile) {
    return res.status(403).json({ message: 'No associated lawyer profile found' });
  }

  try {
    const appointments = await Appointment.find({ lawyerId: lawyerProfile.id })
      .sort({ date: 1 });
    return res.json(appointments.map(a => a.toJSON()));
  } catch (error) {
    console.error('Lawyer appointments error:', error);
    return res.status(500).json({ message: 'Failed to load appointments list' });
  }
});

// Helper to validate Base64 / image URL (JPG, PNG, WEBP, max 2MB)
const validateLawyerPhoto = (photoStr) => {
  if (!photoStr || typeof photoStr !== 'string') return { valid: true };
  const trimmed = photoStr.trim();
  if (trimmed === '' || trimmed.startsWith('/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return { valid: true };
  }

  const dataUriMatch = trimmed.match(/^data:(image\/(jpeg|jpg|png|webp));base64,(.+)$/i);
  if (!dataUriMatch) {
    return { valid: false, message: 'Invalid image format. Allowed formats: JPG, JPEG, PNG, WEBP.' };
  }

  const base64Data = dataUriMatch[3];
  const sizeInBytes = (base64Data.length * 3) / 4;
  const maxBytes = 2 * 1024 * 1024; // 2MB
  if (sizeInBytes > maxBytes) {
    return { valid: false, message: 'Profile picture exceeds maximum allowed size of 2 MB.' };
  }

  return { valid: true };
};

// GET /api/lawyer/profile - Retrieve authenticated lawyer's profile
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User record not found' });
    }

    let profile = await LawyerProfile.findOne({ userId: req.user.id });
    if (!profile) {
      const slug = await generateUniqueSlug(user.name);
      profile = await LawyerProfile.create({
        userId: user._id,
        title: user.designation || 'Advocate',
        slug,
        profileStatus: 'incomplete',
        mustChangePassword: user.mustChangePassword
      });
    }

    return res.json({
      id: profile._id.toString(),
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      photo: profile.photo || '',
      title: profile.title || 'Advocate',
      experience: profile.experience || 0,
      specializations: profile.specializations || [],
      languages: profile.languages || [],
      courts: profile.courts || '',
      city: profile.city || '',
      education: profile.education || '',
      barCouncilNumber: profile.barCouncilNumber || '',
      bio: profile.bio || '',
      consultationFee: profile.consultationFee || '',
      slug: profile.slug,
      profileStatus: profile.profileStatus || 'incomplete',
      rejectionReason: profile.rejectionReason || '',
      submittedAt: profile.submittedAt || null,
      approvedAt: profile.approvedAt || null,
      mustChangePassword: user.mustChangePassword
    });
  } catch (error) {
    console.error('Fetch lawyer profile error:', error);
    return res.status(500).json({ message: 'Failed to retrieve profile details' });
  }
});

// PUT /api/lawyer/profile - Update authenticated lawyer's self-service profile
router.put('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User record not found' });
    }

    let profile = await LawyerProfile.findOne({ userId: req.user.id });
    if (!profile) {
      const slug = await generateUniqueSlug(user.name);
      profile = new LawyerProfile({
        userId: user._id,
        title: user.designation || 'Advocate',
        slug,
        profileStatus: 'incomplete'
      });
    }

    // SECURITY: Explicit allowlist of editable fields.
    // Strictly do NOT accept slug, status, profileStatus, verifiedAt, verifiedBy, user, userId, assignedCases from req.body.
    const {
      name,
      phone,
      photo,
      specializations,
      experience,
      languages,
      courts,
      city,
      education,
      barCouncilNumber,
      bio,
      consultationFee
    } = req.body;

    // Validate photo if provided
    if (photo !== undefined && photo !== null) {
      const photoCheck = validateLawyerPhoto(photo);
      if (!photoCheck.valid) {
        return res.status(400).json({ message: photoCheck.message });
      }
    }

    // Validate experience if provided
    if (experience !== undefined) {
      const expNum = Number(experience);
      if (isNaN(expNum) || expNum < 0) {
        return res.status(400).json({ message: 'Years of experience must be a non-negative number.' });
      }
    }

    // SENSITIVE FIELD DETECTION:
    // If a published lawyer edits sensitive fields (name, Bar Council number, specialization),
    // set profileStatus back to pending_review automatically.
    // Non-sensitive fields (photo, bio, phone, languages, courts, city, education, fee) update immediately.
    let sensitiveFieldChanged = false;

    if (profile.profileStatus === 'published' && user.role === 'LAWYER') {
      const isNameChanged = name !== undefined && name.trim() && name.trim() !== user.name;
      const isBarChanged = barCouncilNumber !== undefined && barCouncilNumber.trim() !== (profile.barCouncilNumber || '');
      
      let isSpecsChanged = false;
      if (specializations !== undefined) {
        const newSpecs = Array.isArray(specializations)
          ? specializations.map(s => String(s).trim()).filter(Boolean).sort()
          : String(specializations).split(',').map(s => s.trim()).filter(Boolean).sort();
        const oldSpecs = (profile.specializations || []).map(s => String(s).trim()).filter(Boolean).sort();
        isSpecsChanged = JSON.stringify(newSpecs) !== JSON.stringify(oldSpecs);
      }

      if (isNameChanged || isBarChanged || isSpecsChanged) {
        sensitiveFieldChanged = true;
        profile.profileStatus = 'pending_review';
        profile.submittedAt = new Date();
      }
    }

    // Apply updates
    if (name !== undefined && name.trim()) {
      user.name = name.trim();
    }
    if (phone !== undefined) {
      user.phone = String(phone).trim();
    }
    await user.save();

    if (photo !== undefined) profile.photo = String(photo).trim();
    if (experience !== undefined) profile.experience = Number(experience) || 0;
    if (courts !== undefined) profile.courts = String(courts).trim();
    if (city !== undefined) profile.city = String(city).trim();
    if (education !== undefined) profile.education = String(education).trim();
    if (barCouncilNumber !== undefined) profile.barCouncilNumber = String(barCouncilNumber).trim();
    if (bio !== undefined) profile.bio = String(bio).trim();
    if (consultationFee !== undefined) profile.consultationFee = String(consultationFee).trim();

    if (specializations !== undefined) {
      if (Array.isArray(specializations)) {
        profile.specializations = specializations.map(s => String(s).trim()).filter(Boolean);
      } else if (typeof specializations === 'string') {
        profile.specializations = specializations.split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    if (languages !== undefined) {
      if (Array.isArray(languages)) {
        profile.languages = languages.map(l => String(l).trim()).filter(Boolean);
      } else if (typeof languages === 'string') {
        profile.languages = languages.split(',').map(l => l.trim()).filter(Boolean);
      }
    }

    if (!profile.slug) {
      profile.slug = await generateUniqueSlug(user.name, profile._id);
    }

    await profile.save();

    // If sensitive fields changed on a published profile, notify the admin
    if (sensitiveFieldChanged) {
      try {
        await sendLawyerProfileSubmittedAdminEmail({
          name: user.name,
          email: user.email,
          phone: user.phone,
          barCouncilNumber: profile.barCouncilNumber,
          specializations: profile.specializations,
          experience: profile.experience,
          city: profile.city
        });
      } catch (err) {
        console.error('Failed to notify admin of sensitive field edit:', err.message || err);
      }
    }

    return res.json({
      success: true,
      message: sensitiveFieldChanged 
        ? 'Sensitive details updated. Because key credentials changed, your profile has been placed back in review.' 
        : 'Profile updated successfully.',
      sensitiveFieldChanged,
      profile: {
        id: profile._id.toString(),
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        photo: profile.photo,
        title: profile.title,
        experience: profile.experience,
        specializations: profile.specializations,
        languages: profile.languages,
        courts: profile.courts,
        city: profile.city,
        education: profile.education,
        barCouncilNumber: profile.barCouncilNumber,
        bio: profile.bio,
        consultationFee: profile.consultationFee,
        slug: profile.slug,
        profileStatus: profile.profileStatus,
        rejectionReason: profile.rejectionReason,
        submittedAt: profile.submittedAt,
        approvedAt: profile.approvedAt,
        mustChangePassword: user.mustChangePassword
      }
    });
  } catch (error) {
    console.error('Update lawyer profile error:', error);
    return res.status(500).json({ message: 'Failed to update profile details' });
  }
});

// POST /api/lawyer/profile/submit - Submit completed profile for Admin approval
router.post('/profile/submit', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User record not found' });
    }

    const profile = await LawyerProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(400).json({ message: 'Please save your profile details first before submitting for review.' });
    }

    // Required fields check:
    // 1. Photo
    // 2. Specializations (>= 1)
    // 3. Experience (>= 0)
    // 4. Languages (>= 1)
    // 5. Courts of practice
    // 6. City
    // 7. Education
    // 8. Bar Council number
    // 9. Bio
    const missing = [];
    if (!profile.photo || !profile.photo.trim()) missing.push('Profile Photo');
    if (!profile.specializations || profile.specializations.length === 0) missing.push('Specialization (at least 1)');
    if (profile.experience === undefined || profile.experience === null || profile.experience < 0) missing.push('Years of Experience');
    if (!profile.languages || profile.languages.length === 0) missing.push('Languages (at least 1)');
    if (!profile.courts || !profile.courts.trim()) missing.push('Courts of Practice');
    if (!profile.city || !profile.city.trim()) missing.push('City');
    if (!profile.education || !profile.education.trim()) missing.push('Education / Qualifications');
    if (!profile.barCouncilNumber || !profile.barCouncilNumber.trim()) missing.push('Bar Council Number');
    if (!profile.bio || !profile.bio.trim()) missing.push('Short Bio');

    if (missing.length > 0) {
      return res.status(400).json({
        message: `Please complete all required fields before submitting: ${missing.join(', ')}.`,
        missingFields: missing
      });
    }

    profile.profileStatus = 'pending_review';
    profile.submittedAt = new Date();
    profile.rejectionReason = '';

    if (!profile.slug) {
      profile.slug = await generateUniqueSlug(user.name, profile._id);
    }

    await profile.save();

    // Dispatch email notification to admin (lawzunction@gmail.com)
    try {
      await sendLawyerProfileSubmittedAdminEmail({
        name: user.name,
        email: user.email,
        phone: user.phone,
        barCouncilNumber: profile.barCouncilNumber,
        specializations: profile.specializations,
        experience: profile.experience,
        city: profile.city
      });
    } catch (emailErr) {
      console.error('⚠️ Failed to dispatch admin profile submission notice via Resend:', emailErr.message || emailErr);
    }

    return res.json({
      success: true,
      message: 'Your profile has been submitted for administrative review. You will receive an email once approved and live.',
      profileStatus: 'pending_review',
      submittedAt: profile.submittedAt
    });
  } catch (error) {
    console.error('Submit profile for review error:', error);
    return res.status(500).json({ message: 'Failed to submit profile for review' });
  }
});

export default router;

