import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import LawyerProfile from '../models/LawyerProfile.js';
import ClientProfile from '../models/ClientProfile.js';
import Case from '../models/Case.js';
import Appointment from '../models/Appointment.js';
import Enquiry from '../models/Enquiry.js';
import Document from '../models/Document.js';
import Blog from '../models/Blog.js';
import PracticeArea from '../models/PracticeArea.js';
import Newsletter from '../models/Newsletter.js';
import JobApplication from '../models/JobApplication.js';
import { verifyJWT } from '../middleware/auth.js';
import { 
  authorizeRoles, 
  canRemoveUser, 
  canEditUser, 
  canAssignRole, 
  normalizeRole, 
  getAllowedAssignableRoles 
} from '../middleware/roles.js';
import { 
  sendLawyerCredentialsEmail,
  sendCaseAllotmentEmail,
  sendCaseUnassignedEmail,
  sendLawyerProfileApprovedEmail,
  sendLawyerProfileRejectedEmail
} from '../utils/mailer.js';
import { generateUniqueSlug } from '../utils/slug.js';
import { logActivity } from '../utils/logger.js';

const router = express.Router();

// Enforce admin/superadmin verification
router.use(verifyJWT);
router.use(authorizeRoles('ADMIN', 'SUPER_ADMIN'));

// GET /api/admin/dashboard-stats - Dashboard metrics (Parallelized for optimal performance)
router.get('/dashboard-stats', async (req, res) => {
  try {
    const [
      totalCases,
      activeCases,
      closedCases,
      lawyersCount,
      clientProfilesWithCases,
      pendingAppointments,
      newEnquiries
    ] = await Promise.all([
      Case.countDocuments(),
      Case.countDocuments({ status: 'IN_PROGRESS' }),
      Case.countDocuments({ status: 'CLOSED' }),
      User.countDocuments({ role: 'LAWYER' }),
      Case.distinct('clientId'),
      Appointment.countDocuments({ status: 'PENDING' }),
      Enquiry.countDocuments({ status: 'NEW' })
    ]);

    const clientsCount = clientProfilesWithCases.length;

    return res.json({
      totalCases,
      activeCases,
      closedCases,
      lawyersCount,
      clientsCount,
      pendingAppointments,
      newEnquiries
    });
  } catch (error) {
    console.error('Stats loading error:', error);
    return res.status(500).json({ message: 'Failed to aggregate dashboard statistics' });
  }
});

// GET /api/admin/users - List users with roles (Batched queries to eliminate N+1 latency)
router.get('/users', async (req, res) => {
  try {
    // 1. Identify client profiles with at least one linked case
    const clientProfilesWithCases = await Case.distinct('clientId');
    const [validClientProfiles, caseCounts] = await Promise.all([
      ClientProfile.find({ _id: { $in: clientProfilesWithCases } }).select('_id userId'),
      Case.aggregate([
        { $match: { clientId: { $in: clientProfilesWithCases } } },
        { $group: { _id: '$clientId', count: { $sum: 1 } } }
      ])
    ]);

    const clientUserIdsWithCases = validClientProfiles.map(p => p.userId);
    const caseCountMap = new Map();
    caseCounts.forEach(item => {
      if (item._id) caseCountMap.set(item._id.toString(), item.count);
    });

    // 2. Query users: all non-clients, plus only clients who have at least one case
    const users = await User.find({
      $or: [
        { role: { $ne: 'CLIENT' } },
        { role: 'CLIENT', _id: { $in: clientUserIdsWithCases } }
      ]
    }).sort({ createdAt: -1 });

    // 3. Batch fetch all corresponding lawyer and client profiles in 2 single queries (avoids 2N queries)
    const userIds = users.map(u => u._id);
    const [lawyerProfiles, clientProfiles] = await Promise.all([
      LawyerProfile.find({ userId: { $in: userIds } }),
      ClientProfile.find({ userId: { $in: userIds } })
    ]);

    const lawyerMap = new Map(lawyerProfiles.map(lp => [lp.userId.toString(), lp]));
    const clientMap = new Map(clientProfiles.map(cp => [cp.userId.toString(), cp]));

    const formatted = users.map((u) => {
      const uIdStr = u._id.toString();
      const lawyerProfile = lawyerMap.get(uIdStr);
      const clientProfile = clientMap.get(uIdStr);
      const designationCompany = u.designation || lawyerProfile?.title || clientProfile?.company || '';
      const clientCaseCount = clientProfile ? (caseCountMap.get(clientProfile._id.toString()) || 0) : 0;

      return {
        id: uIdStr,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        designation: designationCompany,
        casesCount: u.role === 'CLIENT' ? clientCaseCount : undefined,
        mustChangePassword: u.mustChangePassword,
        createdAt: u.createdAt,
        profileDetails: {
          title: designationCompany,
          company: designationCompany,
          casesCount: u.role === 'CLIENT' ? clientCaseCount : undefined,
          ...(lawyerProfile ? lawyerProfile.toJSON() : {}),
          ...(clientProfile ? clientProfile.toJSON() : {})
        }
      };
    });

    return res.json(formatted);
  } catch (error) {
    console.error('Users load error:', error);
    return res.status(500).json({ message: 'Failed to list users' });
  }
});

// POST /api/admin/users - Admin creates new user (Admin, Lawyer, Client)
router.post('/users', async (req, res) => {
  const { name, email, phone, password, role, details, mustChangePassword } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Name, email, password, and role are required' });
  }

  const assignCheck = canAssignRole(req.user.role, role);
  if (!assignCheck.allowed) {
    return res.status(403).json({
      message: assignCheck.reason || 'Forbidden: You do not have permission to assign this role.'
    });
  }

  try {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const shouldForcePasswordChange = role === 'LAWYER' 
      ? true 
      : (mustChangePassword !== undefined ? Boolean(mustChangePassword) : false);

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      role,
      mustChangePassword: shouldForcePasswordChange
    });

    if (role === 'LAWYER') {
      const title = details?.title || 'Legal Associate';
      const experience = parseInt(details?.experience) || 0;
      const specializations = details?.specializations || [];
      const bio = details?.bio || 'Professional Legal Consultant';
      const education = details?.education || 'LL.B.';
      const courts = details?.courts || '';
      const city = details?.city || '';
      const consultationFee = details?.consultationFee || '';
      const slug = await generateUniqueSlug(name);

      await LawyerProfile.create({
        userId: newUser._id,
        title,
        experience,
        specializations,
        bio,
        education,
        courts,
        city,
        consultationFee,
        slug,
        profileStatus: 'incomplete',
        mustChangePassword: true
      });
    } else if (role === 'CLIENT') {
      const company = details?.company || '';
      const address = details?.address || '';

      await ClientProfile.create({
        userId: newUser._id,
        company,
        address
      });
    }

    if (role === 'LAWYER') {
      sendLawyerCredentialsEmail(email.toLowerCase(), name, password, false)
        .catch(emailErr => console.error('⚠️ Failed to send lawyer credentials email via Resend:', emailErr.message || emailErr));
    }

    return res.status(201).json({
      success: true,
      message: `${role} account successfully created. Initial credentials email sent.`,
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        mustChangePassword: newUser.mustChangePassword
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({ message: 'Failed to create user account' });
  }
});

// PUT /api/admin/users/:id - Edit/Update User with Role Hierarchy Enforcement
router.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, role, designation, company } = req.body;

  try {
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ message: 'User account not found' });
    }

    const requesterRole = req.user.role;
    const targetCurrentRole = targetUser.role;

    // 1. Permission check: Can requester edit this user?
    const editCheck = canEditUser(requesterRole, targetCurrentRole);
    if (!editCheck.allowed) {
      return res.status(403).json({
        message: editCheck.reason || 'Forbidden: You do not have permission to edit this user.'
      });
    }

    // 2. Permission check: If role is being changed, can requester assign the new role?
    const newRole = role ? normalizeRole(role) : targetCurrentRole;
    if (role && newRole !== normalizeRole(targetCurrentRole)) {
      const assignCheck = canAssignRole(requesterRole, newRole);
      if (!assignCheck.allowed) {
        return res.status(403).json({
          message: assignCheck.reason || `Forbidden: Your role cannot assign the ${role} role.`
        });
      }
    }

    // 3. Email format validation
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ message: 'Invalid email address format' });
      }

      // 4. Email uniqueness validation across users
      const normalizedEmail = email.toLowerCase().trim();
      if (normalizedEmail !== targetUser.email.toLowerCase()) {
        const emailExists = await User.findOne({ 
          email: normalizedEmail,
          _id: { $ne: targetUser._id }
        });
        if (emailExists) {
          return res.status(409).json({ message: `Email "${email}" is already registered to another account` });
        }
      }
    }

    // Track field-level diffs for audit logging
    const changes = [];
    if (name && name.trim() && name.trim() !== targetUser.name) {
      changes.push(`Name: "${targetUser.name}" → "${name.trim()}"`);
      targetUser.name = name.trim();
    }

    if (email && email.toLowerCase().trim() !== targetUser.email) {
      changes.push(`Email: "${targetUser.email}" → "${email.toLowerCase().trim()}"`);
      targetUser.email = email.toLowerCase().trim();
    }

    if (role && newRole !== normalizeRole(targetCurrentRole)) {
      changes.push(`Role: "${targetCurrentRole}" → "${newRole}"`);
      targetUser.role = newRole;
    }

    if (phone !== undefined && String(phone).trim() !== (targetUser.phone || '')) {
      changes.push(`Phone: "${targetUser.phone || 'N/A'}" → "${String(phone).trim()}"`);
      targetUser.phone = String(phone).trim();
    }

    const desigValue = designation !== undefined ? designation : company;
    if (desigValue !== undefined) {
      const cleanDesig = String(desigValue).trim();
      if (cleanDesig !== (targetUser.designation || '')) {
        changes.push(`Designation: "${targetUser.designation || 'N/A'}" → "${cleanDesig}"`);
        targetUser.designation = cleanDesig;
      }
    }

    await targetUser.save();

    // Synchronize designation / company with profile models if applicable
    if (desigValue !== undefined) {
      const cleanDesig = String(desigValue).trim();
      if (targetUser.role === 'LAWYER') {
        await LawyerProfile.findOneAndUpdate(
          { userId: targetUser._id },
          { $set: { title: cleanDesig } },
          { upsert: false }
        );
      } else if (targetUser.role === 'CLIENT') {
        await ClientProfile.findOneAndUpdate(
          { userId: targetUser._id },
          { $set: { company: cleanDesig } },
          { upsert: false }
        );
      }
    }

    // Audit Logging
    const changeSummary = changes.length > 0 ? changes.join('; ') : 'No core attributes altered';
    await logActivity(req.user.id, 'Edit User', `Admin ${req.user.name} (${req.user.role}) updated user ${targetUser.name} (${targetUser._id}): ${changeSummary}`);

    const lawyerProfile = await LawyerProfile.findOne({ userId: targetUser._id });
    const clientProfile = await ClientProfile.findOne({ userId: targetUser._id });
    const designationCompany = targetUser.designation || lawyerProfile?.title || clientProfile?.company || '';

    return res.json({
      success: true,
      message: `User account for "${targetUser.name}" successfully updated.`,
      user: {
        id: targetUser._id.toString(),
        name: targetUser.name,
        email: targetUser.email,
        phone: targetUser.phone,
        role: targetUser.role,
        designation: designationCompany,
        mustChangePassword: targetUser.mustChangePassword,
        createdAt: targetUser.createdAt,
        profileDetails: {
          title: designationCompany,
          company: designationCompany,
          ...(lawyerProfile ? lawyerProfile.toJSON() : {}),
          ...(clientProfile ? clientProfile.toJSON() : {})
        }
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ message: 'Failed to update user account details' });
  }
});

// DELETE /api/admin/users/:id - Delete/Remove User with Role Hierarchy Enforcement
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ message: 'User account not found' });
    }

    // Prevent deleting one's own active account
    if (targetUser._id.toString() === req.user.id.toString()) {
      return res.status(400).json({ message: 'Self-deletion is forbidden. You cannot delete your currently active account.' });
    }

    const requesterRole = req.user.role;
    const targetRole = targetUser.role;

    // Permission check: Can requester delete target user?
    const removeCheck = canRemoveUser(requesterRole, targetRole);
    if (!removeCheck.allowed) {
      return res.status(403).json({
        message: removeCheck.reason || 'Forbidden: You do not have permission to delete this user.'
      });
    }

    // If target is a LAWYER, verify they do not have active/assigned cases before deletion
    if (targetUser.role === 'LAWYER') {
      const lawyerProfile = await LawyerProfile.findOne({ userId: targetUser._id });
      if (lawyerProfile) {
        const assignedCases = await Case.find({ lawyerId: lawyerProfile._id });
        if (assignedCases.length > 0) {
          const caseNames = assignedCases.map(c => c.caseNumber || c.title).slice(0, 3).join(', ');
          const extra = assignedCases.length > 3 ? ` and ${assignedCases.length - 3} more` : '';
          return res.status(400).json({
            message: `Cannot delete advocate "${targetUser.name}". This advocate is currently assigned to ${assignedCases.length} case(s) (${caseNames}${extra}). Please reassign all cases before deleting.`
          });
        }
      }
    }

    // Capture user details for audit log before deletion
    const deletedUserInfo = {
      id: targetUser._id.toString(),
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role
    };

    // Remove user and associated profiles
    await User.findByIdAndDelete(targetUser._id);
    await LawyerProfile.deleteMany({ userId: targetUser._id });
    await ClientProfile.deleteMany({ userId: targetUser._id });

    // Detailed Audit Logging
    await logActivity(
      req.user.id,
      'Delete User',
      `Admin ${req.user.name} (${req.user.role}) permanently deleted user ${deletedUserInfo.name} (${deletedUserInfo.email}, Role: ${deletedUserInfo.role})`
    );

    return res.json({
      success: true,
      message: `User account "${deletedUserInfo.name}" (${deletedUserInfo.email}) has been permanently deleted.`
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ message: 'Failed to delete user account' });
  }
});

// ==========================================
// ADVOCATE / LAWYER MANAGEMENT ENDPOINTS (Task 2)
// ==========================================

// Helper to validate Base64 / image URL (JPG, PNG, WEBP, max 2MB)
const validateLawyerPhoto = (photoStr) => {
  if (!photoStr || typeof photoStr !== 'string') return { valid: true };
  const trimmed = photoStr.trim();
  if (trimmed === '' || trimmed.startsWith('/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return { valid: true };
  }

  // Base64 Data URI check
  const dataUriMatch = trimmed.match(/^data:(image\/(jpeg|jpg|png|webp));base64,(.+)$/i);
  if (!dataUriMatch) {
    return { valid: false, message: 'Invalid image format. Allowed formats: JPG, JPEG, PNG, WEBP.' };
  }

  const base64Data = dataUriMatch[3];
  // Calculate size in bytes: (length * 3 / 4) - padding
  const sizeInBytes = (base64Data.length * 3) / 4;
  const maxBytes = 2 * 1024 * 1024; // 2MB
  if (sizeInBytes > maxBytes) {
    return { valid: false, message: 'Profile picture exceeds maximum allowed size of 2 MB.' };
  }

  return { valid: true };
};

// Helper function to resolve target lawyer user and profile
const resolveLawyerAndProfile = async (id) => {
  let targetUser = await User.findById(id);
  let lawyerProfile = null;

  if (targetUser) {
    lawyerProfile = await LawyerProfile.findOne({ userId: targetUser._id });
  } else {
    lawyerProfile = await LawyerProfile.findById(id);
    if (lawyerProfile) {
      targetUser = await User.findById(lawyerProfile.userId);
    }
  }

  return { targetUser, lawyerProfile };
};

// GET /api/admin/lawyers - List all advocates with profile specifics and case counts
router.get('/lawyers', async (req, res) => {
  try {
    const lawyerProfiles = await LawyerProfile.find();
    const lawyerUserIds = lawyerProfiles.map(p => p.userId).filter(Boolean);
    const lawyerUsers = await User.find({
      $or: [
        { role: 'LAWYER' },
        { _id: { $in: lawyerUserIds } }
      ]
    }).sort({ createdAt: -1 });

    const profileMap = new Map();
    lawyerProfiles.forEach(p => {
      profileMap.set(p.userId.toString(), p);
    });

    // Count cases per lawyer profile
    const caseCounts = await Case.aggregate([
      { $match: { lawyerId: { $ne: null } } },
      { $group: { _id: '$lawyerId', count: { $sum: 1 } } }
    ]);
    const caseCountMap = new Map();
    caseCounts.forEach(c => {
      if (c._id) caseCountMap.set(c._id.toString(), c.count);
    });

    const counts = {
      all: lawyerUsers.length,
      incomplete: 0,
      pending_review: 0,
      published: 0,
      rejected: 0
    };

    let formatted = lawyerUsers.map(u => {
      const profile = profileMap.get(u._id.toString());
      const pId = profile ? profile._id.toString() : null;
      const casesCount = pId ? (caseCountMap.get(pId) || 0) : 0;
      const profileStatus = profile?.profileStatus || 'incomplete';

      if (counts[profileStatus] !== undefined) {
        counts[profileStatus] += 1;
      }

      return {
        id: u._id.toString(),
        userId: u._id.toString(),
        lawyerProfileId: pId,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        designation: profile?.title || u.designation || 'Advocate',
        title: profile?.title || u.designation || 'Advocate',
        experience: profile?.experience || 0,
        specializations: profile?.specializations || [],
        bio: profile?.bio || '',
        education: profile?.education || '',
        languages: profile?.languages || [],
        linkedin: profile?.linkedin || '',
        photo: profile?.photo || '',
        barCouncilNumber: profile?.barCouncilNumber || '',
        courts: profile?.courts || '',
        city: profile?.city || '',
        consultationFee: profile?.consultationFee || '',
        slug: profile?.slug || '',
        profileStatus,
        rejectionReason: profile?.rejectionReason || '',
        submittedAt: profile?.submittedAt || null,
        approvedAt: profile?.approvedAt || null,
        status: profile?.status || 'ACTIVE',
        mustChangePassword: u.mustChangePassword,
        casesCount,
        createdAt: u.createdAt,
        profileDetails: profile ? profile.toJSON() : {}
      };
    });

    res.setHeader('X-Status-Counts', JSON.stringify(counts));

    if (req.query.status && req.query.status !== 'all') {
      formatted = formatted.filter(l => l.profileStatus === req.query.status);
    }

    return res.json(formatted);
  } catch (error) {
    console.error('List lawyers error:', error);
    return res.status(500).json({ message: 'Failed to fetch advocate roster' });
  }
});

// PUT /api/admin/lawyers/:id & PATCH /api/admin/lawyers/:id - Edit advocate details with validation
const handleUpdateLawyer = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    email,
    phone,
    title,
    designation,
    experience,
    specializations,
    bio,
    education,
    languages,
    linkedin,
    photo,
    barCouncilNumber,
    status
  } = req.body;

  try {
    const { targetUser, lawyerProfile: existingProfile } = await resolveLawyerAndProfile(id);
    if (!targetUser) {
      return res.status(404).json({ message: 'Advocate user account not found' });
    }

    // Validation
    if (name !== undefined && !name.trim()) {
      return res.status(400).json({ message: 'Advocate name cannot be empty' });
    }

    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ message: 'Invalid email address format' });
      }

      const normalizedEmail = email.toLowerCase().trim();
      if (normalizedEmail !== targetUser.email.toLowerCase()) {
        const emailTaken = await User.findOne({ email: normalizedEmail, _id: { $ne: targetUser._id } });
        if (emailTaken) {
          return res.status(409).json({ message: `Email "${email}" is already used by another account` });
        }
      }
    }

    if (experience !== undefined) {
      const expNum = Number(experience);
      if (isNaN(expNum) || expNum < 0) {
        return res.status(400).json({ message: 'Years of experience must be a non-negative number' });
      }
    }

    // Photo validation
    if (photo !== undefined && photo !== null) {
      const photoCheck = validateLawyerPhoto(photo);
      if (!photoCheck.valid) {
        return res.status(400).json({ message: photoCheck.message });
      }
    }

    // Update User
    if (name) targetUser.name = name.trim();
    if (email) targetUser.email = email.toLowerCase().trim();
    if (phone !== undefined) targetUser.phone = String(phone).trim();
    const finalTitle = title || designation;
    if (finalTitle) targetUser.designation = finalTitle.trim();
    await targetUser.save();

    // Update or Create LawyerProfile
    let lawyerProfile = existingProfile;
    if (!lawyerProfile) {
      lawyerProfile = new LawyerProfile({
        userId: targetUser._id,
        title: finalTitle || 'Advocate',
        experience: Number(experience) || 0
      });
    }

    if (finalTitle) lawyerProfile.title = finalTitle.trim();
    if (experience !== undefined) lawyerProfile.experience = Number(experience) || 0;
    if (bio !== undefined) lawyerProfile.bio = String(bio).trim();
    if (education !== undefined) lawyerProfile.education = String(education).trim();
    if (linkedin !== undefined) lawyerProfile.linkedin = String(linkedin).trim();
    if (barCouncilNumber !== undefined) lawyerProfile.barCouncilNumber = String(barCouncilNumber).trim();
    if (status && ['ACTIVE', 'INACTIVE', 'ON_LEAVE'].includes(status)) {
      lawyerProfile.status = status;
    }
    if (photo !== undefined) lawyerProfile.photo = String(photo).trim();

    if (specializations !== undefined) {
      if (Array.isArray(specializations)) {
        lawyerProfile.specializations = specializations.map(s => String(s).trim()).filter(Boolean);
      } else if (typeof specializations === 'string') {
        lawyerProfile.specializations = specializations.split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    if (languages !== undefined) {
      if (Array.isArray(languages)) {
        lawyerProfile.languages = languages.map(l => String(l).trim()).filter(Boolean);
      } else if (typeof languages === 'string') {
        lawyerProfile.languages = languages.split(',').map(l => l.trim()).filter(Boolean);
      }
    }

    if (req.body.courts !== undefined) lawyerProfile.courts = String(req.body.courts).trim();
    if (req.body.city !== undefined) lawyerProfile.city = String(req.body.city).trim();
    if (req.body.consultationFee !== undefined) lawyerProfile.consultationFee = String(req.body.consultationFee).trim();
    if (req.body.profileStatus && ['incomplete', 'pending_review', 'published', 'rejected'].includes(req.body.profileStatus)) {
      lawyerProfile.profileStatus = req.body.profileStatus;
    }

    if (!lawyerProfile.slug && targetUser.name) {
      lawyerProfile.slug = await generateUniqueSlug(targetUser.name, lawyerProfile._id);
    }

    await lawyerProfile.save();

    // Count active cases
    const casesCount = await Case.countDocuments({ lawyerId: lawyerProfile._id });

    return res.json({
      success: true,
      message: `Advocate "${targetUser.name}" details successfully updated.`,
      lawyer: {
        id: targetUser._id.toString(),
        userId: targetUser._id.toString(),
        lawyerProfileId: lawyerProfile._id.toString(),
        name: targetUser.name,
        email: targetUser.email,
        phone: targetUser.phone,
        role: targetUser.role,
        designation: lawyerProfile.title,
        title: lawyerProfile.title,
        experience: lawyerProfile.experience,
        specializations: lawyerProfile.specializations,
        bio: lawyerProfile.bio,
        education: lawyerProfile.education,
        languages: lawyerProfile.languages,
        linkedin: lawyerProfile.linkedin,
        photo: lawyerProfile.photo,
        barCouncilNumber: lawyerProfile.barCouncilNumber,
        courts: lawyerProfile.courts,
        city: lawyerProfile.city,
        consultationFee: lawyerProfile.consultationFee,
        slug: lawyerProfile.slug,
        profileStatus: lawyerProfile.profileStatus,
        rejectionReason: lawyerProfile.rejectionReason,
        status: lawyerProfile.status,
        casesCount,
        profileDetails: lawyerProfile.toJSON()
      }
    });
  } catch (error) {
    console.error('Update lawyer error:', error);
    return res.status(500).json({ message: 'Failed to update advocate details' });
  }
};

router.put('/lawyers/:id', handleUpdateLawyer);
router.patch('/lawyers/:id', handleUpdateLawyer);

// PUT /api/admin/lawyers/:id/approve - Approve lawyer profile and make public
router.put('/lawyers/:id/approve', async (req, res) => {
  const { id } = req.params;

  try {
    const { targetUser, lawyerProfile } = await resolveLawyerAndProfile(id);
    if (!targetUser) {
      return res.status(404).json({ message: 'Advocate user account not found' });
    }

    let profile = lawyerProfile;
    if (!profile) {
      const slug = await generateUniqueSlug(targetUser.name);
      profile = new LawyerProfile({
        userId: targetUser._id,
        title: targetUser.designation || 'Advocate',
        slug,
        profileStatus: 'published',
        approvedAt: new Date(),
        mustChangePassword: false
      });
    } else {
      if (!profile.slug) {
        profile.slug = await generateUniqueSlug(targetUser.name, profile._id);
      }
      profile.profileStatus = 'published';
      profile.approvedAt = new Date();
      profile.rejectionReason = '';
    }

    await profile.save();

    sendLawyerProfileApprovedEmail(targetUser.email, targetUser.name, profile.slug)
      .catch(emailErr => console.error('⚠️ Failed to dispatch profile approved email via Resend:', emailErr.message || emailErr));

    return res.json({
      success: true,
      message: `Advocate "${targetUser.name}" profile is now published and live on the public directory.`,
      lawyer: {
        id: targetUser._id.toString(),
        userId: targetUser._id.toString(),
        lawyerProfileId: profile._id.toString(),
        name: targetUser.name,
        email: targetUser.email,
        profileStatus: profile.profileStatus,
        approvedAt: profile.approvedAt,
        slug: profile.slug
      }
    });
  } catch (error) {
    console.error('Approve lawyer profile error:', error);
    return res.status(500).json({ message: 'Failed to approve advocate profile' });
  }
});

// PUT /api/admin/lawyers/:id/reject - Reject lawyer profile with mandatory reason
router.put('/lawyers/:id/reject', async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason || !reason.trim()) {
    return res.status(400).json({ message: 'A rejection reason is mandatory to guide the advocate on necessary corrections.' });
  }

  try {
    const { targetUser, lawyerProfile } = await resolveLawyerAndProfile(id);
    if (!targetUser) {
      return res.status(404).json({ message: 'Advocate user account not found' });
    }

    let profile = lawyerProfile;
    if (!profile) {
      const slug = await generateUniqueSlug(targetUser.name);
      profile = new LawyerProfile({
        userId: targetUser._id,
        title: targetUser.designation || 'Advocate',
        slug,
        profileStatus: 'rejected',
        rejectionReason: reason.trim()
      });
    } else {
      profile.profileStatus = 'rejected';
      profile.rejectionReason = reason.trim();
    }

    await profile.save();

    sendLawyerProfileRejectedEmail(targetUser.email, targetUser.name, reason.trim())
      .catch(emailErr => console.error('⚠️ Failed to dispatch profile rejection email via Resend:', emailErr.message || emailErr));

    return res.json({
      success: true,
      message: `Advocate "${targetUser.name}" profile marked as rejected. Guidance email dispatched.`,
      lawyer: {
        id: targetUser._id.toString(),
        userId: targetUser._id.toString(),
        lawyerProfileId: profile._id.toString(),
        name: targetUser.name,
        email: targetUser.email,
        profileStatus: profile.profileStatus,
        rejectionReason: profile.rejectionReason
      }
    });
  } catch (error) {
    console.error('Reject lawyer profile error:', error);
    return res.status(500).json({ message: 'Failed to reject advocate profile' });
  }
});

// PUT /api/admin/lawyers/:id/unpublish - Unpublish lawyer profile
router.put('/lawyers/:id/unpublish', async (req, res) => {
  const { id } = req.params;

  try {
    const { targetUser, lawyerProfile } = await resolveLawyerAndProfile(id);
    if (!targetUser) {
      return res.status(404).json({ message: 'Advocate user account not found' });
    }

    if (lawyerProfile) {
      lawyerProfile.profileStatus = 'incomplete';
      await lawyerProfile.save();
    }

    return res.json({
      success: true,
      message: `Advocate "${targetUser.name}" profile has been unpublished from the public directory.`,
      profileStatus: 'incomplete'
    });
  } catch (error) {
    console.error('Unpublish lawyer profile error:', error);
    return res.status(500).json({ message: 'Failed to unpublish advocate profile' });
  }
});

// DELETE /api/admin/lawyers/:id - Delete advocate with assigned cases protection check
router.delete('/lawyers/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { targetUser, lawyerProfile } = await resolveLawyerAndProfile(id);
    if (!targetUser) {
      return res.status(404).json({ message: 'Advocate user account not found' });
    }

    // Safety Check: Verify if advocate is assigned to any cases
    if (lawyerProfile) {
      const assignedCases = await Case.find({ lawyerId: lawyerProfile._id });
      if (assignedCases.length > 0) {
        const caseListStr = assignedCases.map(c => c.caseNumber || c.title).slice(0, 3).join(', ');
        const extraCount = assignedCases.length > 3 ? ` and ${assignedCases.length - 3} more` : '';
        return res.status(400).json({
          message: `Cannot delete advocate "${targetUser.name}". This advocate is currently assigned to ${assignedCases.length} case(s) (${caseListStr}${extraCount}). Please reassign these cases to another advocate before deleting.`
        });
      }
    }

    const deletedName = targetUser.name;
    const deletedEmail = targetUser.email;

    // Delete profile and user
    if (lawyerProfile) {
      await LawyerProfile.findByIdAndDelete(lawyerProfile._id);
    }
    await User.findByIdAndDelete(targetUser._id);

    return res.json({
      success: true,
      message: `Advocate "${deletedName}" (${deletedEmail}) has been permanently deleted.`
    });
  } catch (error) {
    console.error('Delete lawyer error:', error);
    return res.status(500).json({ message: 'Failed to delete advocate' });
  }
});

// GET /api/admin/enquiries - View public contact enquiries
router.get('/enquiries', async (req, res) => {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });
    return res.json(enquiries.map(e => e.toJSON()));
  } catch (error) {
    console.error('Enquiries loading error:', error);
    return res.status(500).json({ message: 'Failed to fetch enquiries' });
  }
});

// PUT /api/admin/enquiries/:id - Update enquiry status
router.put('/enquiries/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const updated = await Enquiry.findByIdAndUpdate(id, { $set: { status } }, { new: true });
    if (!updated) {
      return res.status(404).json({ message: 'Enquiry not found' });
    }

    return res.json({ success: true, enquiry: updated.toJSON() });
  } catch (error) {
    console.error('Update enquiry error:', error);
    return res.status(500).json({ message: 'Failed to update enquiry status' });
  }
});

// DELETE /api/admin/enquiries/all - Delete all visitor intake enquiries (Must precede :id route)
router.delete('/enquiries/all', async (req, res) => {
  try {
    const count = await Enquiry.countDocuments();
    await Enquiry.deleteMany({});
    return res.json({
      success: true,
      message: `All ${count} visitor intake enquiries have been deleted successfully.`,
      deletedCount: count
    });
  } catch (error) {
    console.error('Delete all enquiries error:', error);
    return res.status(500).json({ message: 'Failed to delete all visitor enquiries' });
  }
});

// DELETE /api/admin/enquiries/:id - Delete single visitor intake enquiry
router.delete('/enquiries/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Enquiry.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Enquiry not found' });
    }
    return res.json({ success: true, message: 'Enquiry deleted successfully' });
  } catch (error) {
    console.error('Delete enquiry error:', error);
    return res.status(500).json({ message: 'Failed to delete enquiry' });
  }
});

// GET /api/admin/cases - Retrieve all active cases across the firm
router.get('/cases', async (req, res) => {
  try {
    const cases = await Case.find()
      .populate({
        path: 'clientId',
        populate: { path: 'userId', select: 'name email phone' }
      })
      .populate({
        path: 'lawyerId',
        populate: { path: 'userId', select: 'name email phone' }
      })
      .sort({ updatedAt: -1 });

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
      if (c.lawyerId) {
        caseObj.lawyer = c.lawyerId.toJSON();
        if (c.lawyerId.userId) {
          caseObj.lawyer.user = c.lawyerId.userId.toJSON();
        }
      }
      return caseObj;
    }));

    return res.json(formattedCases);
  } catch (error) {
    console.error('Admin cases load error:', error);
    return res.status(500).json({ message: 'Failed to retrieve cases list' });
  }
});

// PUT /api/admin/cases/:caseId/assign - Assign or re-allot case to lawyer
router.put('/cases/:caseId/assign', async (req, res) => {
  const { caseId } = req.params;
  const { lawyerProfileId } = req.body;

  try {
    // 1. Fetch case with client and current lawyer populated
    const existingCase = await Case.findById(caseId)
      .populate({
        path: 'clientId',
        populate: { path: 'userId', select: 'name email phone' }
      })
      .populate({
        path: 'lawyerId',
        populate: { path: 'userId', select: 'name email phone' }
      });

    if (!existingCase) {
      return res.status(404).json({ message: 'Case not found' });
    }

    const previousLawyerProfile = existingCase.lawyerId;
    const previousLawyerUser = previousLawyerProfile?.userId;
    const previousLawyerProfileId = previousLawyerProfile?._id?.toString() || null;

    // 2. Resolve target lawyer profile & user
    let targetLawyerProfile = null;
    let targetLawyerUser = null;

    if (lawyerProfileId) {
      targetLawyerProfile = await LawyerProfile.findById(lawyerProfileId).populate('userId');
      if (!targetLawyerProfile) {
        // Fallback: lawyerProfileId might be user ID
        targetLawyerUser = await User.findById(lawyerProfileId);
        if (targetLawyerUser) {
          targetLawyerProfile = await LawyerProfile.findOne({ userId: targetLawyerUser._id }).populate('userId');
        }
      } else {
        targetLawyerUser = targetLawyerProfile.userId;
      }
    }

    const newLawyerProfileId = targetLawyerProfile ? targetLawyerProfile._id : null;

    // 3. Update the case record
    existingCase.lawyerId = newLawyerProfileId;
    await existingCase.save();

    // 4. Send case allotment email via Resend (Must not crash the request)
    const isNewAssignment = Boolean(newLawyerProfileId && newLawyerProfileId.toString() !== previousLawyerProfileId);
    const isReassignment = Boolean(isNewAssignment && previousLawyerUser && previousLawyerProfileId);

    if (isNewAssignment && targetLawyerUser && targetLawyerUser.email) {
      const clientName = existingCase.clientId?.userId?.name || 'Firm Client';
      const allotmentDate = new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

      sendCaseAllotmentEmail({
        lawyerEmail: targetLawyerUser.email,
        lawyerName: targetLawyerUser.name,
        caseNumber: existingCase.caseNumber,
        caseTitle: existingCase.title,
        caseType: existingCase.caseType || 'Litigation & Legal Advisory',
        clientName,
        caseDescription: existingCase.description || existingCase.lastUpdate || 'Legal counsel representation matter.',
        allotmentDate,
        hearingDateOrDeadline: existingCase.hearingDate || existingCase.deadline || 'To be scheduled / Refer to docket'
      }).catch(mailErr => console.error('⚠️ Failed to dispatch case allotment email to lawyer:', mailErr.message || mailErr));

      // If re-assigned from another lawyer, notify previous lawyer of removal
      if (isReassignment && previousLawyerUser.email) {
        sendCaseUnassignedEmail({
          lawyerEmail: previousLawyerUser.email,
          lawyerName: previousLawyerUser.name,
          caseNumber: existingCase.caseNumber,
          caseTitle: existingCase.title
        }).catch(prevMailErr => console.error('⚠️ Failed to dispatch removal notice to previous lawyer:', prevMailErr.message || prevMailErr));
      }
    }

    return res.json({ success: true, case: existingCase.toJSON() });
  } catch (error) {
    console.error('Assign lawyer error:', error);
    return res.status(500).json({ message: 'Failed to assign lawyer to case' });
  }
});

// PUT /api/admin/cases/:caseId - Edit case details
router.put('/cases/:caseId', async (req, res) => {
  const { caseId } = req.params;
  const {
    title,
    status,
    progress,
    lastUpdate,
    lawyerProfileId,
    caseType,
    description,
    hearingDate,
    deadline
  } = req.body;

  try {
    const existingCase = await Case.findById(caseId)
      .populate({
        path: 'clientId',
        populate: { path: 'userId', select: 'name email phone' }
      })
      .populate({
        path: 'lawyerId',
        populate: { path: 'userId', select: 'name email phone' }
      });

    if (!existingCase) {
      return res.status(404).json({ message: 'Case not found' });
    }

    const previousLawyerProfile = existingCase.lawyerId;
    const previousLawyerUser = previousLawyerProfile?.userId;
    const previousLawyerProfileId = previousLawyerProfile?._id?.toString() || null;

    // Resolve target lawyer if lawyerProfileId is passed
    let targetLawyerProfile = previousLawyerProfile;
    let targetLawyerUser = previousLawyerUser;
    let newLawyerProfileId = previousLawyerProfileId;

    if (lawyerProfileId !== undefined) {
      if (!lawyerProfileId) {
        newLawyerProfileId = null;
        targetLawyerProfile = null;
        targetLawyerUser = null;
      } else {
        targetLawyerProfile = await LawyerProfile.findById(lawyerProfileId).populate('userId');
        if (!targetLawyerProfile) {
          targetLawyerUser = await User.findById(lawyerProfileId);
          if (targetLawyerUser) {
            targetLawyerProfile = await LawyerProfile.findOne({ userId: targetLawyerUser._id }).populate('userId');
          }
        } else {
          targetLawyerUser = targetLawyerProfile.userId;
        }
        newLawyerProfileId = targetLawyerProfile ? targetLawyerProfile._id.toString() : null;
      }
      existingCase.lawyerId = newLawyerProfileId;
    }

    if (title !== undefined && title.trim()) existingCase.title = title.trim();
    if (status !== undefined) existingCase.status = status;
    if (progress !== undefined) existingCase.progress = Math.min(100, Math.max(0, Number(progress) || 0));
    if (lastUpdate !== undefined) existingCase.lastUpdate = String(lastUpdate);
    if (caseType !== undefined) existingCase.caseType = String(caseType);
    if (description !== undefined) existingCase.description = String(description);
    if (hearingDate !== undefined) existingCase.hearingDate = String(hearingDate);
    if (deadline !== undefined) existingCase.deadline = String(deadline);

    await existingCase.save();

    // Trigger allotment email if lawyer changed
    const isNewAssignment = Boolean(newLawyerProfileId && newLawyerProfileId !== previousLawyerProfileId);
    const isReassignment = Boolean(isNewAssignment && previousLawyerUser && previousLawyerProfileId);

    if (isNewAssignment && targetLawyerUser && targetLawyerUser.email) {
      const clientName = existingCase.clientId?.userId?.name || 'Firm Client';
      const allotmentDate = new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

      sendCaseAllotmentEmail({
        lawyerEmail: targetLawyerUser.email,
        lawyerName: targetLawyerUser.name,
        caseNumber: existingCase.caseNumber,
        caseTitle: existingCase.title,
        caseType: existingCase.caseType || 'Litigation & Legal Advisory',
        clientName,
        caseDescription: existingCase.description || existingCase.lastUpdate || 'Legal counsel representation matter.',
        allotmentDate,
        hearingDateOrDeadline: existingCase.hearingDate || existingCase.deadline || 'To be scheduled / Refer to docket'
      }).catch(mailErr => console.error('⚠️ Failed to dispatch case allotment email to lawyer:', mailErr.message || mailErr));

      if (isReassignment && previousLawyerUser.email) {
        sendCaseUnassignedEmail({
          lawyerEmail: previousLawyerUser.email,
          lawyerName: previousLawyerUser.name,
          caseNumber: existingCase.caseNumber,
          caseTitle: existingCase.title
        }).catch(prevMailErr => console.error('⚠️ Failed to dispatch removal notice to previous lawyer:', prevMailErr.message || prevMailErr));
      }
    }

    // Format response consistent with GET /cases
    const formatted = existingCase.toJSON();
    const docs = await Document.find({ caseId: existingCase._id });
    formatted.documents = docs.map(d => d.toJSON());
    if (existingCase.clientId) {
      formatted.client = existingCase.clientId.toJSON();
      if (existingCase.clientId.userId) {
        formatted.client.user = existingCase.clientId.userId.toJSON();
      }
    }
    if (targetLawyerProfile) {
      formatted.lawyer = targetLawyerProfile.toJSON();
      if (targetLawyerUser) {
        formatted.lawyer.user = targetLawyerUser.toJSON ? targetLawyerUser.toJSON() : targetLawyerUser;
      }
    } else {
      formatted.lawyer = null;
    }

    return res.json({ success: true, case: formatted });
  } catch (error) {
    console.error('Edit case error:', error);
    return res.status(500).json({ message: 'Failed to update case details' });
  }
});

// DELETE /api/admin/cases/:caseId - Delete a case
router.delete('/cases/:caseId', async (req, res) => {
  const { caseId } = req.params;
  try {
    const deleted = await Case.findByIdAndDelete(caseId);
    if (!deleted) {
      return res.status(404).json({ message: 'Case not found' });
    }

    // Clean up associated documents
    await Document.deleteMany({ caseId });

    return res.json({ success: true, message: 'Case and associated records deleted successfully' });
  } catch (error) {
    console.error('Delete case error:', error);
    return res.status(500).json({ message: 'Failed to delete case' });
  }
});

// GET /api/admin/job-applications (and /careers) - List candidate career applications (Buffer excluded for speed)
router.get(['/job-applications', '/careers', '/careers/applications'], async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

    if (!isNaN(page) && page > 0) {
      const total = await JobApplication.countDocuments();
      const apps = await JobApplication.find()
        .select('-resumeData')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      return res.json({
        success: true,
        data: apps,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    }

    const apps = await JobApplication.find().select('-resumeData').sort({ createdAt: -1 });
    return res.json(apps);
  } catch (error) {
    console.error('Job applications load error:', error);
    return res.status(500).json({ message: 'Failed to list job applications' });
  }
});

// GET /api/admin/job-applications/:id/resume - View or Download Candidate Resume
router.get(['/job-applications/:id/resume', '/careers/:id/resume', '/careers/applications/:id/resume'], async (req, res) => {
  try {
    const { id } = req.params;
    const isDownload = req.query.download === 'true' || req.query.download === '1';

    const app = await JobApplication.findById(id).select('+resumeData');
    if (!app) {
      return res.status(404).json({ message: 'Career application not found' });
    }

    if (!app.resumeData) {
      return res.status(404).json({ message: 'No resume document is attached to this application' });
    }

    const filename = app.fileName || `resume_${app.name ? app.name.replace(/[^a-zA-Z0-9]/g, '_') : id}.pdf`;
    const contentType = app.resumeContentType || 'application/pdf';

    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `${isDownload ? 'attachment' : 'inline'}; filename="${encodeURIComponent(filename)}"`
    );
    res.setHeader('Content-Length', app.resumeData.length);
    res.setHeader('Cache-Control', 'private, max-age=3600');

    return res.send(app.resumeData);
  } catch (error) {
    console.error('Fetch resume error:', error);
    return res.status(500).json({ message: 'Failed to retrieve resume file' });
  }
});

// DELETE /api/admin/job-applications/:id - Delete a career application
router.delete(['/job-applications/:id', '/careers/:id', '/careers/applications/:id'], async (req, res) => {
  try {
    const { id } = req.params;
    const app = await JobApplication.findByIdAndDelete(id);

    if (!app) {
      return res.status(404).json({ message: 'Career application not found' });
    }

    // Non-blocking activity log — must never prevent success response
    logActivity(
      req.user.id,
      'Delete Career Application',
      `Deleted application from ${app.name} (${app.email}) for position ${app.jobTitle}`
    ).catch(err => console.error('Activity log error (non-critical):', err));

    return res.status(200).json({ success: true, message: 'Career application deleted successfully' });
  } catch (error) {
    console.error('Delete application error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete application' });
  }
});


// PUT /api/admin/users/:id/reset-password - Admin resets a user/lawyer password
router.put('/users/:id/reset-password', async (req, res) => {
  const { id } = req.params;
  const { temporaryPassword } = req.body;

  if (!temporaryPassword || temporaryPassword.length < 6) {
    return res.status(400).json({ message: 'Temporary password must be at least 6 characters long' });
  }

  try {
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ message: 'User account not found' });
    }

    targetUser.password = await bcrypt.hash(temporaryPassword, 10);
    targetUser.mustChangePassword = true;
    await targetUser.save();

    sendLawyerCredentialsEmail(targetUser.email, targetUser.name, temporaryPassword, true)
      .catch(emailErr => console.error('⚠️ Failed to send reset lawyer credentials email via Resend:', emailErr.message || emailErr));
    logActivity(req.user.id, 'Admin Reset Password', `Admin reset password for user ${id}`)
      .catch(err => console.error('Activity log error (non-critical):', err));

    return res.json({
      success: true,
      message: `Password successfully reset for ${targetUser.email}. User will be forced to change password on next login.`,
      user: {
        id: targetUser._id.toString(),
        email: targetUser.email,
        mustChangePassword: true
      }
    });
  } catch (error) {
    console.error('Admin reset password error:', error);
    return res.status(500).json({ message: 'Failed to reset user password' });
  }
});


// GET /api/admin/practice-areas - List all practice areas
router.get('/practice-areas', async (req, res) => {
  try {
    const areas = await PracticeArea.find();
    return res.json(areas.map(a => a.toJSON()));
  } catch (error) {
    console.error('Get practice areas error:', error);
    return res.status(500).json({ message: 'Failed to fetch practice areas' });
  }
});

// POST /api/admin/practice-areas - Create practice area
router.post('/practice-areas', async (req, res) => {
  const { name, icon, description, overview, services, faqs } = req.body;

  if (!name || !description) {
    return res.status(400).json({ message: 'Name and description are required' });
  }

  try {
    const area = await PracticeArea.create({
      name,
      icon: icon || 'Briefcase',
      description,
      overview: overview || description,
      services: services || [],
      faqs: faqs || []
    });

    await logActivity(req.user.id, 'Create Practice Area', `Created area: ${name}`);
    return res.status(201).json({ success: true, practiceArea: area.toJSON() });
  } catch (error) {
    console.error('Create practice area error:', error);
    return res.status(500).json({ message: 'Failed to create practice area' });
  }
});

// PUT /api/admin/practice-areas/:id - Edit practice area
router.put('/practice-areas/:id', async (req, res) => {
  const { id } = req.params;
  const { name, icon, description, overview, services, faqs } = req.body;

  try {
    const updateObj = {};
    if (name) updateObj.name = name;
    if (icon) updateObj.icon = icon;
    if (description) updateObj.description = description;
    if (overview) updateObj.overview = overview;
    if (services) updateObj.services = services;
    if (faqs) updateObj.faqs = faqs;

    const updated = await PracticeArea.findByIdAndUpdate(id, { $set: updateObj }, { new: true });
    if (!updated) {
      return res.status(404).json({ message: 'Practice area not found' });
    }

    await logActivity(req.user.id, 'Edit Practice Area', `Updated area ${id}`);
    return res.json({ success: true, practiceArea: updated.toJSON() });
  } catch (error) {
    console.error('Update practice area error:', error);
    return res.status(500).json({ message: 'Failed to update practice area' });
  }
});

// DELETE /api/admin/practice-areas/:id - Delete practice area
router.delete('/practice-areas/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await PracticeArea.findByIdAndDelete(id);
    await logActivity(req.user.id, 'Delete Practice Area', `Deleted area ${id}`);
    return res.json({ success: true, message: 'Practice area deleted' });
  } catch (error) {
    console.error('Delete practice area error:', error);
    return res.status(500).json({ message: 'Failed to delete practice area' });
  }
});

// GET /api/admin/blogs - List blogs
router.get('/blogs', async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    return res.json(blogs.map(b => b.toJSON()));
  } catch (error) {
    console.error('Get blogs error:', error);
    return res.status(500).json({ message: 'Failed to fetch blogs' });
  }
});

// POST /api/admin/blogs - Create blog post
router.post('/blogs', async (req, res) => {
  const { title, content, summary, category, authorName, date, readTime, published } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  try {
    const blog = await Blog.create({
      title,
      content,
      summary: summary || title,
      category: category || 'General',
      authorName: authorName || req.user.name,
      date: date || new Date().toLocaleDateString(),
      readTime: readTime || '5 min read',
      published: published !== undefined ? published : true
    });

    await logActivity(req.user.id, 'Create Blog', `Created blog: ${title}`);
    return res.status(201).json({ success: true, blog: blog.toJSON() });
  } catch (error) {
    console.error('Create blog error:', error);
    return res.status(500).json({ message: 'Failed to create blog post' });
  }
});

// PUT /api/admin/blogs/:id - Edit blog post
router.put('/blogs/:id', async (req, res) => {
  const { id } = req.params;
  const { title, content, summary, category, authorName, published } = req.body;

  try {
    const updateObj = {};
    if (title) updateObj.title = title;
    if (content) updateObj.content = content;
    if (summary) updateObj.summary = summary;
    if (category) updateObj.category = category;
    if (authorName) updateObj.authorName = authorName;
    if (published !== undefined) updateObj.published = published;

    const updated = await Blog.findByIdAndUpdate(id, { $set: updateObj }, { new: true });
    if (!updated) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    await logActivity(req.user.id, 'Edit Blog', `Updated blog ${id}`);
    return res.json({ success: true, blog: updated.toJSON() });
  } catch (error) {
    console.error('Update blog error:', error);
    return res.status(500).json({ message: 'Failed to update blog post' });
  }
});

// DELETE /api/admin/blogs/:id - Delete blog post
router.delete('/blogs/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await Blog.findByIdAndDelete(id);
    await logActivity(req.user.id, 'Delete Blog', `Deleted blog ${id}`);
    return res.json({ success: true, message: 'Blog deleted' });
  } catch (error) {
    console.error('Delete blog error:', error);
    return res.status(500).json({ message: 'Failed to delete blog post' });
  }
});

// GET /api/admin/documents - Manage all legal documents
router.get('/documents', async (req, res) => {
  try {
    const docs = await Document.find().sort({ createdAt: -1 });
    return res.json(docs.map(d => d.toJSON()));
  } catch (error) {
    console.error('Admin documents error:', error);
    return res.status(500).json({ message: 'Failed to load documents' });
  }
});

// DELETE /api/admin/documents/:id - Delete document
router.delete('/documents/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await Document.findByIdAndDelete(id);
    await logActivity(req.user.id, 'Delete Document', `Deleted document ${id}`);
    return res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    return res.status(500).json({ message: 'Failed to delete document' });
  }
});

// GET /api/admin/appointments - List all appointments
router.get('/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({ createdAt: -1 });
    return res.json(appointments.map(a => a.toJSON()));
  } catch (error) {
    console.error('Admin appointments error:', error);
    return res.status(500).json({ message: 'Failed to load appointments' });
  }
});

// PUT /api/admin/appointments/:id/status - Update appointment status
router.put('/appointments/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, lawyerId } = req.body;

  try {
    const updateObj = {};
    if (status) updateObj.status = status;
    if (lawyerId) updateObj.lawyerId = lawyerId;

    const updated = await Appointment.findByIdAndUpdate(id, { $set: updateObj }, { new: true });
    if (!updated) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    await logActivity(req.user.id, 'Update Appointment', `Updated appointment ${id}`);
    return res.json({ success: true, appointment: updated.toJSON() });
  } catch (error) {
    console.error('Update appointment error:', error);
    return res.status(500).json({ message: 'Failed to update appointment' });
  }
});



// GET /api/admin/subscribers - View all newsletter subscribers
router.get('/subscribers', async (req, res) => {
  try {
    const list = await Newsletter.find().sort({ createdAt: -1 });
    return res.json(list.map(s => s.toJSON()));
  } catch (error) {
    console.error('Newsletter subscribers load error:', error);
    return res.status(500).json({ message: 'Failed to load subscribers' });
  }
});

export default router;
