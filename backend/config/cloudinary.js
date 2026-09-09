const cloudinary = require("cloudinary").v2;

let cloudName = process.env.CLOUDINARY_CLOUD_NAME;
let apiKey = process.env.CLOUDINARY_API_KEY;
let apiSecret = process.env.CLOUDINARY_API_SECRET;

// Gracefully handle if someone pasted a full cloudinary URL or prefix
if (apiSecret && apiSecret.includes("cloudinary://")) {
  const match = apiSecret.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
  if (match) {
    apiKey = apiKey || match[1];
    apiSecret = match[2];
    cloudName = cloudName || match[3];
  }
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

/**
 * Uploads a file buffer into Cloudinary via a stream (in-memory, no disk writes).
 * @param {Buffer} buffer - File buffer from multer memoryStorage
 * @param {string} folder - Target folder in Cloudinary (e.g. 'employee_avatars' or 'project_icons')
 * @returns {Promise<object>} - Resolves with Cloudinary upload result containing secure_url
 */
const uploadStream = (buffer, folder = "employee_project_management") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

module.exports = {
  cloudinary,
  uploadStream,
};
