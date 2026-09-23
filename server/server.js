import express from 'express';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { connectDB } from './src/config/db.js';
import { seedInitialData } from './src/config/seed.js';
import { migrateExistingLawyers } from './src/config/migration.js';

// Security configurations
import { configureCORS, configureHelmet, apiLimiter } from './src/middleware/security.js';

// Route imports
import authRoutes from './src/routes/auth.js';
import adminRoutes from './src/routes/admin.js';
import lawyerRoutes from './src/routes/lawyer.js';
import clientRoutes from './src/routes/client.js';
import publicRoutes from './src/routes/public.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

// Ensure debug mode defaults to OFF in production environments
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

const app = express();
const PORT = process.env.PORT || 5000;

// Trust front-facing reverse proxies (Cloudflare, Render, Vercel) for accurate client IP identification in rate limiters
app.set('trust proxy', 1);

// Environment Variable Pre-Flight Validation
const validateEnvironment = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const missingCritical = [];

  if (!process.env.MONGODB_URI) {
    missingCritical.push('MONGODB_URI (MongoDB Atlas connection string)');
  }
  if (!process.env.JWT_SECRET) {
    missingCritical.push('JWT_SECRET (Cryptographic JWT signing secret)');
  }

  if (missingCritical.length > 0) {
    console.error('\n❌ FATAL SECURITY ERROR: Server startup aborted due to missing critical environment variables:');
    missingCritical.forEach(item => console.error(`   - ${item}`));
    console.error('   Please define these variables in your environment or server/.env file.\n');
    process.exit(1);
  }

  if (isProduction && !process.env.RESEND_API_KEY) {
    console.warn('⚠️ WARNING: RESEND_API_KEY is not defined in production. Email notifications will be skipped.');
  }
};

// Lightweight Health check endpoint (for Render keep-alive & uptime monitoring)
app.get(['/health', '/api/health'], (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Block attempts to probe sensitive dotfiles, backup files, and git repositories
app.use((req, res, next) => {
  if (/(^\/|\/)(\.git|\.env|\.svn|\.htaccess|docker-compose|\.aws|\.ssh|\.bak|\.config)/i.test(req.path)) {
    return res.status(404).json({ message: 'Resource not found' });
  }
  next();
});

// Compression middleware (gzip/deflate for fast responses)
app.use(compression());

// Apply Global Security Middlewares
app.use(configureHelmet());
app.use(configureCORS());
app.use('/api/', apiLimiter); // Apply rate limiter to all API endpoints

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/lawyer', lawyerRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/public', publicRoutes);

// Serve compiled static frontend bundle in production if built
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist');
  const indexPath = path.join(distPath, 'index.html');

  if (fs.existsSync(indexPath)) {
    app.use(express.static(distPath, {
      maxAge: '1h',
      setHeaders: (res, filePath) => {
        if (
          filePath.includes(path.sep + 'assets' + path.sep) ||
          filePath.includes('/assets/') ||
          filePath.includes(path.sep + 'fonts' + path.sep) ||
          filePath.includes('/fonts/')
        ) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      }
    }));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ message: 'API route not found' });
      }
      res.sendFile(indexPath);
    });
  } else {
    app.get('/', (req, res) => {
      res.send('Lawzunction Backend API is running (MERN Stack).');
    });
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ message: 'API route not found' });
      }
      res.status(404).send('Frontend build not found. Ensure Vite build command is run.');
    });
  }
}

// Global Exception Handler with Correlation IDs & Zero Internal Leaks
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const correlationId = randomUUID();
  const statusCode = err.status || err.statusCode || 500;

  // Server-side detailed log with correlation ID, request path, method, and full stack
  console.error(`[Error ID: ${correlationId}] ${req.method} ${req.originalUrl} - Status ${statusCode}:`, err.stack || err.message || err);

  // Safe client response with generic message and correlationId (never leaks stacks, query details, or paths)
  const clientMessage = statusCode < 500 
    ? (err.message || 'Invalid request') 
    : 'An unexpected internal server error occurred. Please contact support with the reference ID.';

  res.status(statusCode).json({
    success: false,
    message: clientMessage,
    correlationId
  });
});

// Database connectivity check and start listener
let httpServer = null;

const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

  const forceExit = setTimeout(() => {
    console.error('⚠️ Graceful shutdown timed out (10s limit). Forcing process exit.');
    process.exit(1);
  }, 10000);
  if (forceExit.unref) forceExit.unref();

  if (httpServer) {
    httpServer.close(async (err) => {
      if (err) {
        console.error('Error during HTTP server closure:', err);
      } else {
        console.log('✅ HTTP server closed cleanly.');
      }

      try {
        if (mongoose.connection && mongoose.connection.readyState !== 0) {
          await mongoose.connection.close(false);
          console.log('✅ MongoDB connection closed.');
        }
      } catch (dbErr) {
        console.error('Error during database disconnection:', dbErr);
      }

      clearTimeout(forceExit);
      process.exit(0);
    });
  } else {
    try {
      if (mongoose.connection && mongoose.connection.readyState !== 0) {
        await mongoose.connection.close(false);
      }
    } catch (_) {}
    clearTimeout(forceExit);
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

const startServer = async () => {
  validateEnvironment();

  try {
    await connectDB();
    await seedInitialData();
    await migrateExistingLawyers();

    httpServer = app.listen(PORT, () => {
      console.log(`🚀 Lawzunction MERN Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    const safeErrorMsg = error.message ? error.message.replace(/mongodb(\+srv)?:\/\/[^@]+@/i, 'mongodb$1://<credentials-hidden>@') : 'Database connection error';
    console.error('CRITICAL ERROR: Failed to connect to MongoDB on startup:', safeErrorMsg);

    if (process.env.NODE_ENV === 'production') {
      console.error('FATAL: Database connection failed in production. Refusing to start server.');
      process.exit(1);
    }

    console.warn('\n⚠️  NOTICE: Backend server cannot reach your MongoDB database in development.');
    console.warn('   Please check MONGODB_URI in server/.env and ensure your MongoDB credentials or local MongoDB service are running.\n');
    
    httpServer = app.listen(PORT, () => {
      console.log(`Server started on port ${PORT} (Warning: MongoDB connection pending update in server/.env)`);
    });
  }
};

startServer();
