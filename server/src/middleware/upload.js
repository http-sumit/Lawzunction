import multer from 'multer';
import path from 'path';

// Store files in memory as Buffers so they can be saved to DB or attached to emails
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname || '').toLowerCase();

  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/octet-stream' // fallback MIME type used by some browsers/OS for doc/docx
  ];

  if (allowedExtensions.includes(ext) || allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, and DOCX documents up to 5 MB are permitted.'), false);
  }
};

export const uploadResume = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  },
  fileFilter
});

// Multiple field aliases supported for upload flexibility
const resumeUploadFields = uploadResume.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'file', maxCount: 1 },
  { name: 'cv', maxCount: 1 },
  { name: 'document', maxCount: 1 },
  { name: 'resumeFile', maxCount: 1 }
]);

// Middleware wrapper that intercepts Multer errors and returns clear 400 responses
export const handleResumeUpload = (req, res, next) => {
  resumeUploadFields(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Resume file size exceeds the 5 MB limit. Please upload a smaller document.'
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Invalid file uploaded. Only PDF, DOC, and DOCX files up to 5 MB are allowed.'
      });
    }

    // Normalize req.file from files dictionary so downstream handlers can access req.file directly
    if (!req.file && req.files) {
      req.file =
        req.files['resume']?.[0] ||
        req.files['file']?.[0] ||
        req.files['cv']?.[0] ||
        req.files['document']?.[0] ||
        req.files['resumeFile']?.[0] ||
        null;
    }

    next();
  });
};
