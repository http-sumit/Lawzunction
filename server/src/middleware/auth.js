import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import LawyerProfile from '../models/LawyerProfile.js';
import ClientProfile from '../models/ClientProfile.js';

export const verifyJWT = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.query?.token;

  if (!token) {
    return res.status(401).json({ message: 'Access token missing' });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('FATAL SECURITY ERROR: JWT_SECRET environment variable is missing.');
    return res.status(500).json({ message: 'Authentication service configuration error' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    
    // Load user and associated profile depending on role
    const userDoc = await User.findById(decoded.id);
    if (!userDoc) {
      return res.status(401).json({ message: 'Invalid token session user' });
    }

    const userObj = userDoc.toJSON();
    const lawyerProfile = await LawyerProfile.findOne({ userId: userDoc._id });
    const clientProfile = await ClientProfile.findOne({ userId: userDoc._id });

    userObj.lawyerProfile = lawyerProfile ? lawyerProfile.toJSON() : null;
    userObj.clientProfile = clientProfile ? clientProfile.toJSON() : null;

    req.user = userObj;

    // Enforce forced password change: while mustChangePassword is true,
    // strictly allow only GET /api/auth/me and POST/PUT /api/auth/change-password.
    if (userDoc.mustChangePassword) {
      const normalizedPath = (req.originalUrl || (req.baseUrl || '') + (req.path || ''))
        .split('?')[0]
        .replace(/\/+$/, '');
      const method = (req.method || '').toUpperCase();

      const isAllowed = 
        (method === 'GET' && normalizedPath === '/api/auth/me') ||
        ((method === 'POST' || method === 'PUT') && normalizedPath === '/api/auth/change-password');

      if (!isAllowed) {
        return res.status(403).json({
          message: 'Password change required. You must change your temporary password before accessing portal features.',
          mustChangePassword: true,
          code: 'PASSWORD_CHANGE_REQUIRED'
        });
      }
    }

    next();
  } catch (error) {
    console.error('JWT Token Verification Error:', error);
    return res.status(403).json({ message: 'Session expired or invalid token' });
  }
};
