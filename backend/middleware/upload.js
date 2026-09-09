const multer = require("multer");

// Use memoryStorage so uploaded files are held in RAM buffer and streamed to Cloudinary
// This prevents ephemeral filesystem issues on cloud hosts like Render
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|svg|gif/;
  const isMimeTypeValid = allowedTypes.test(file.mimetype.toLowerCase());
  const isExtensionValid = allowedTypes.test(file.originalname.toLowerCase());

  if (isMimeTypeValid || isExtensionValid) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (JPEG, PNG, WEBP, SVG, GIF) are allowed."), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter,
});

module.exports = upload;
