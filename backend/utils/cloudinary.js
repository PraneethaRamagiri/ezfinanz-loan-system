const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');

if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME.trim(),
    api_key: process.env.CLOUDINARY_API_KEY.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET.trim(),
    secure: true
  });
}

/**
 * Upload local file to Cloudinary persistent storage
 * Delivers PDF documents with Content-Type: application/pdf for native browser viewing
 * @param {string} filePath - Absolute path to local file saved by Multer
 * @param {string} folder - Folder name ('selfies' or 'documents')
 * @returns {Promise<string|null>} - Persistent HTTPS Cloudinary URL or null
 */
const uploadToCloudinary = async (filePath, folder = 'uploads') => {
  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    try {
      const ext = path.extname(filePath).toLowerCase();
      const isPdf = ext === '.pdf';

      const uploadOptions = {
        folder: `ezfinanz/${folder}`,
        resource_type: 'image'
      };

      if (isPdf) {
        uploadOptions.format = 'pdf';
      }

      const result = await cloudinary.uploader.upload(filePath, uploadOptions);

      let secureUrl = result.secure_url;
      if (isPdf && !secureUrl.toLowerCase().endsWith('.pdf')) {
        secureUrl = `${secureUrl}.pdf`;
      }

      // Remove temporary file from local filesystem after upload
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (unlinkErr) {
          console.warn('[Cloudinary] Could not remove temp local file:', unlinkErr.message);
        }
      }

      return secureUrl;
    } catch (err) {
      console.error('[Cloudinary Upload Error]', err.message);
      return null;
    }
  }
  return null;
};

module.exports = {
  cloudinary,
  uploadToCloudinary
};
