const multer = require('multer');
const path = require('path');

// Use memory storage so we can stream the file buffer directly to Cloudinary
const storage = multer.memoryStorage();

const allowedExtensions = new Set([
  '.pdf',
  '.doc',
  '.docx',
  '.txt',
  '.xls',
  '.xlsx',
  '.csv',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.svg',
  '.gif',
]);

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.has(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `File type not supported (${ext}). Supported files: PDF, DOC, DOCX, XLS, XLSX, CSV, and Images (PNG, JPG, SVG, WebP).`
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 30 * 1024 * 1024, // 30 MB max file size
  },
});

module.exports = upload;
