import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

// Production & Staging Allowed Origins
const DEFAULT_ALLOWED_ORIGINS = [
  'https://lawzunction.in',
  'https://www.lawzunction.in',
  'https://api.lawzunction.in',
  'https://lawzunction.vercel.app'
];

const DEV_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5000',
  'http://localhost:3000',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4173'
];

// Helper to determine whether an incoming HTTP Origin is permitted
export const isOriginAllowed = (origin) => {
  // Allow requests with no origin (mobile apps, curl, server-to-server health checks)
  if (!origin) return true;

  const customOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map(u => u.trim().toLowerCase()).filter(Boolean)
    : [];

  const allStatic = [
    ...DEFAULT_ALLOWED_ORIGINS.map(o => o.toLowerCase()),
    ...DEV_ALLOWED_ORIGINS.map(o => o.toLowerCase()),
    ...customOrigins
  ];

  const lowerOrigin = origin.toLowerCase().trim();

  // 1. Exact match in static or custom whitelist
  if (allStatic.includes(lowerOrigin)) {
    return true;
  }

  // 2. All official Lawzunction domains & subdomains (e.g. lawzunction.in, api.lawzunction.in, www.lawzunction.in)
  if (/^https:\/\/(?:[a-z0-9-]+\.)*lawzunction\.in(?::\d+)?$/i.test(lowerOrigin)) {
    return true;
  }

  // 3. All Vercel deployments (production, branch previews, custom aliases)
  if (/^https:\/\/(?:[a-z0-9-]+\.)*vercel\.app(?::\d+)?$/i.test(lowerOrigin)) {
    return true;
  }

  // 4. All Render deployments (backend, frontend, preview instances)
  if (/^https:\/\/(?:[a-z0-9-]+\.)*onrender\.com(?::\d+)?$/i.test(lowerOrigin)) {
    return true;
  }

  // 5. Localhost and 127.0.0.1 development servers on any port
  if (/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(lowerOrigin)) {
    return true;
  }

  return false;
};

// CORS configuration (Strict domain whitelist, never allows wildcard '*' in production)
export const configureCORS = () => {
  return cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }

      console.warn(`⚠️ CORS policy blocked access from origin: ${origin}`);
      const corsError = new Error(`CORS policy blocked access from origin: ${origin}`);
      corsError.status = 403;
      corsError.statusCode = 403;
      return callback(corsError);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400 // 24 hours preflight cache
  });
};

// Security headers via Helmet (HSTS 1 year, Frameguard DENY, NoSniff, CSP)
export const configureHelmet = () => {
  return helmet({
    // Content-Security-Policy restricting scripts & connections to trusted origins
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://images.unsplash.com"],
        connectSrc: [
          "'self'",
          "https://lawzunction.in",
          "https://www.lawzunction.in",
          "https://api.lawzunction.in",
          "https://*.onrender.com",
          "https://*.vercel.app",
          "http://localhost:*",
          "http://127.0.0.1:*"
        ],
        frameAncestors: ["'none'"], // Disallow iframe embedding
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: []
      }
    },
    // X-Content-Type-Options: nosniff
    xContentTypeOptions: true,
    // X-Frame-Options: DENY
    frameguard: { action: 'deny' },
    // Strict-Transport-Security: max-age=31536000 (1 year), includeSubDomains, preload
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  });
};

// Global API Rate Limiting (Increased limit for rich SPA navigation and real-time updates)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Max 1000 requests per 15 min window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});

// Authentication endpoints: Login rate limiter (Min requirement: 5 attempts per minute per IP)
export const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 login attempts per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many login attempts. Please wait 1 minute before trying again.'
  }
});

// Registration / Signup rate limiter (10 registrations per 15 minutes per IP)
export const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many registration requests. Please wait a few minutes before trying again.'
  }
});

// Password reset rate limiter (10 attempts per hour per IP)
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 attempts per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many password reset requests. Please wait a few minutes before attempting again.'
  }
});

// Public form submissions rate limiter (Bookings, inquiries, job applications, newsletter: 50 per 15 min per IP)
export const submissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many form submissions from this IP. Please wait 15 minutes before submitting again.'
  }
});

// Messaging abuse limiter (Max 30 messages per 15 minutes to prevent spam & simulated reply flooding)
export const messageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Message rate limit exceeded. Please wait a few minutes before sending another message.'
  }
});

// File upload limiter (Max 20 document uploads per 15 minutes per IP/session)
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Upload frequency limit exceeded. Please wait a few minutes before uploading more documents.'
  }
});

