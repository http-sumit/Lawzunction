import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import ClientProfile from '../models/ClientProfile.js';
import LawyerProfile from '../models/LawyerProfile.js';
import Case from '../models/Case.js';
import Invoice from '../models/Invoice.js';
import Document from '../models/Document.js';
import Message from '../models/Message.js';
import Appointment from '../models/Appointment.js';
import Enquiry from '../models/Enquiry.js';
import Notification from '../models/Notification.js';
import { verifyJWT } from '../middleware/auth.js';
import { loginLimiter, signupLimiter, passwordResetLimiter } from '../middleware/security.js';
import { sendResetPasswordEmail } from '../utils/mailer.js';
import { logActivity } from '../utils/logger.js';

const router = express.Router();

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('FATAL SECURITY ERROR: JWT_SECRET environment variable is not defined.');
  }
  return secret;
};

// Helper to seed a newly registered client with demo cases/invoices/docs
const seedClientDemoData = async (clientProfileId, userId) => {
  try {
    // 1. Seed Cases
    const demoCase = await Case.create({
      caseNumber: 'LAW-2026-' + Math.floor(1000 + Math.random() * 9000),
      title: 'Acquisition of Delta SaaS Corp',
      status: 'IN_PROGRESS',
      progress: 75,
      lastUpdate: 'Updated share purchase terms (SPA) for final signing.',
      clientId: clientProfileId
    });

    // 2. Seed Invoices
    await Invoice.insertMany([
      {
        description: 'Retainer Fee - Corporate Governance Advisory',
        amount: '75,000 INR',
        date: 'June 01, 2026',
        status: 'Unpaid',
        userId: userId
      },
      {
        description: 'Trademark Filing & Filing Fees (12 Classes)',
        amount: '48,000 INR',
        date: 'May 12, 2026',
        status: 'Paid',
        userId: userId
      }
    ]);

    // 3. Seed Documents
    await Document.create({
      name: 'Draft_Share_Purchase_Agreement_v3.pdf',
      fileUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
      size: '2.4 MB',
      uploadedBy: 'Attorney - Madhav Raghuwanshi',
      clientId: clientProfileId,
      caseId: demoCase._id
    });

    // 4. Seed Messages
    await Message.insertMany([
      {
        userId: userId,
        sender: 'Madhav Raghuwanshi',
        text: 'Hello, I have updated the Share Purchase Agreement draft. Please review Section 6 on indemnities and upload your signature authorization file.',
        time: 'June 11, 2026, 11:30 AM'
      },
      {
        userId: userId,
        sender: 'Client (You)',
        text: 'Thank you Madhav. I am checking the document with our CFO and will upload the signed version today.',
        time: 'June 11, 2026, 02:15 PM'
      }
    ]);
  } catch (error) {
    console.error('Error seeding new client demo records:', error);
  }
};

// POST /api/auth/register - Self register a Client account
router.post('/register', signupLimiter, async (req, res) => {
  const { name, email, phone, password, company, address } = req.body;

  if (!name || typeof name !== 'string' || !email || typeof email !== 'string' || !password || typeof password !== 'string') {
    return res.status(400).json({ message: 'Valid name, email, and password strings are required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail) || cleanEmail.length > 254) {
    return res.status(400).json({ message: 'Invalid email address format' });
  }

  if (password.length < 6 || password.length > 128) {
    return res.status(400).json({ message: 'Password must be between 6 and 128 characters long' });
  }

  if (name.trim().length === 0 || name.length > 100) {
    return res.status(400).json({ message: 'Name must be between 1 and 100 characters long' });
  }

  try {
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name: name.trim(),
      email: cleanEmail,
      phone: phone ? String(phone).slice(0, 30) : '',
      password: hashedPassword,
      role: 'CLIENT'
    });


    const clientProfile = await ClientProfile.create({
      userId: newUser._id,
      company: company || '',
      address: address || ''
    });

    // Seed mock cases & invoices inside client portal for immediate display
    await seedClientDemoData(clientProfile._id, newUser._id);

    const token = jwt.sign(
      { id: newUser._id.toString(), role: newUser.role },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    await logActivity(newUser._id, 'Register Account', 'Client self-registered');

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        clientProfileId: clientProfile._id.toString()
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Failed to register client user' });
  }
});

// POST /api/auth/login - Secure login
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
    return res.status(400).json({ message: 'Valid email and password strings are required' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const lawyerProfile = await LawyerProfile.findOne({ userId: user._id });
    const clientProfile = await ClientProfile.findOne({ userId: user._id });

    const clientProfileId = clientProfile ? clientProfile._id.toString() : null;
    const lawyerProfileId = lawyerProfile ? lawyerProfile._id.toString() : null;

    const token = jwt.sign(
      { id: user._id.toString(), role: user.role, mustChangePassword: user.mustChangePassword },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    await logActivity(user._id, 'User Login', `Logged in as ${user.role}`);

    return res.json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        clientProfileId,
        lawyerProfileId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Authentication error' });
  }
});

// GET /api/auth/me - Retrieve profile from JWT token session
router.get('/me', verifyJWT, async (req, res) => {
  const user = req.user;
  return res.json({
    success: true,
    user
  });
});

// POST & PUT /api/auth/change-password - Protected endpoint for user/lawyer to change mandatory/current password
const handleChangePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters long' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'New password must be different from current password' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.mustChangePassword = false;
    await user.save();

    await logActivity(user._id, 'Change Password', 'User successfully changed account password');

    const clientProfile = await ClientProfile.findOne({ userId: user._id });
    const lawyerProfile = await LawyerProfile.findOne({ userId: user._id });
    if (lawyerProfile) {
      lawyerProfile.mustChangePassword = false;
      await lawyerProfile.save();
    }

    return res.json({
      success: true,
      message: 'Password changed successfully',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        mustChangePassword: false,
        clientProfileId: clientProfile ? clientProfile._id.toString() : null,
        lawyerProfileId: lawyerProfile ? lawyerProfile._id.toString() : null,
        lawyerProfile: lawyerProfile ? lawyerProfile.toJSON() : null
      }
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ message: 'Failed to change password' });
  }
};

router.post('/change-password', verifyJWT, handleChangePassword);
router.put('/change-password', verifyJWT, handleChangePassword);

// POST /api/auth/forgot-password - Send password reset email (Random 32-byte crypto token, 15-minute expiry)
router.post('/forgot-password', passwordResetLimiter, async (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ message: 'Valid email address is required' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Generic success message to prevent user enumeration
      return res.json({ success: true, message: 'If the email exists, a reset link has been dispatched.' });
    }

    // 1. Generate cryptographically secure random token
    const rawResetToken = crypto.randomBytes(32).toString('hex');

    // 2. Hash token for secure database storage (protects against database dumps)
    const hashedToken = crypto.createHash('sha256').update(rawResetToken).digest('hex');

    // 3. Set strict 15-minute expiration (900,000 ms)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    // 4. Send raw token via transactional email
    try {
      const emailResult = await sendResetPasswordEmail(user.email, user.name, rawResetToken);
      if (!emailResult?.success) {
        console.warn('⚠️ Notice: Password reset email dispatch returned non-success:', emailResult?.reason || emailResult?.error || 'Unknown mail error');
      }
    } catch (mailErr) {
      console.warn('⚠️ Non-fatal exception during reset email dispatch:', mailErr.message || mailErr);
    }

    await logActivity(user._id, 'Forgot Password Request', 'Password reset email dispatched (Single-use, 15 min expiry)');

    return res.json({ success: true, message: 'Password reset link successfully sent. Please check your inbox.' });
  } catch (error) {
    console.error('Forgot password error:', error.stack || error.message || error);
    return res.status(500).json({ message: 'Failed to process password reset request. Please try again.' });
  }
});

// POST /api/auth/reset-password - Verify single-use token and update password
router.post('/reset-password', passwordResetLimiter, async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || typeof token !== 'string' || !newPassword || typeof newPassword !== 'string') {
    return res.status(400).json({ message: 'Token and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters long' });
  }

  try {
    // Hash incoming token to look up database record
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid, expired, or already used password reset link' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;

    // Single-use enforcement: immediately clear token and expiry
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    await logActivity(user._id, 'Reset Password', 'User successfully updated password via single-use token');

    return res.json({ success: true, message: 'Password successfully updated. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error.message || error);
    return res.status(400).json({ message: 'Invalid or expired password reset link' });
  }
});

// PUT /api/auth/profile - Update user info
router.put('/profile', verifyJWT, async (req, res) => {
  const { name, phone, password } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
      }
      user.password = await bcrypt.hash(password, 10);
      user.mustChangePassword = false;
    }

    await user.save();
    await logActivity(user._id, 'Update Profile', 'Modified account info');

    return res.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        mustChangePassword: user.mustChangePassword
      }
    });
  } catch (error) {
    console.error('Update profile error:', error.message || error);
    return res.status(500).json({ message: 'Failed to update profile info' });
  }
});

// DELETE /api/auth/me - Self-service account & personal data deletion (Right to Erasure)
router.delete('/me', verifyJWT, async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') {
    return res.status(403).json({ message: 'Administrative accounts cannot be deleted via self-service API' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    const userEmail = user.email;

    // 1. Remove associated profile records
    await ClientProfile.deleteMany({ userId });
    await LawyerProfile.deleteMany({ userId });

    // 2. Anonymize external inquiry and appointment records to protect personal identity
    await Appointment.updateMany(
      { email: userEmail },
      { $set: { clientName: '[Deleted User]', email: 'deleted@lawzunction.in', phone: '[Deleted]' } }
    );
    await Enquiry.updateMany(
      { email: userEmail },
      { $set: { name: '[Deleted User]', email: 'deleted@lawzunction.in', phone: '[Deleted]', message: '[Personal Inquiry Data Cleared]' } }
    );

    // 3. Remove user messages & notifications
    await Message.deleteMany({ userId });
    await Notification.deleteMany({ userId });

    // 4. Delete user account record
    await User.findByIdAndDelete(userId);

    // 5. Audit log with zero PII
    await logActivity(null, 'User Self-Deletion', 'User exercised right to erasure; personal data permanently removed and anonymized');

    return res.json({
      success: true,
      message: 'Your account and associated personal data have been permanently deleted.'
    });
  } catch (error) {
    console.error('Account deletion error:', error.message || error);
    return res.status(500).json({ message: 'Failed to process account deletion request' });
  }
});

export default router;
