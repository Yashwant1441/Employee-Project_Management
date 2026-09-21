const multer = require("multer");

// Memory storage for streaming document buffers directly to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Block dangerous executable binary scripts
  const forbiddenExecutables = /\.(exe|bat|cmd|sh|php|pl|cgi|jar|vbs)$/i;
  if (forbiddenExecutables.test(file.originalname)) {
    return cb(new Error("Executable files are not allowed for security reasons."), false);
  }
  cb(null, true);
};

const documentUpload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit per document file
  },
  fileFilter,
});

module.exports = documentUpload;
