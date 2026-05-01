const multer  = require('multer');
const path    = require('path');

// Store in memory — we stream directly to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const ext  = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) return cb(null, true);
  cb(new Error('Only image files are allowed (jpeg, jpg, png, webp)'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB
});

module.exports = upload;
