const cloudinary = require('cloudinary').v2;

const isConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
} else {
  console.warn('[cloudinary] Cloudinary credentials missing. File uploads will use inline data URI fallback.');
}

/**
 * Uploads a file buffer to Cloudinary.
 * If Cloudinary is not configured, gracefully falls back to an inline data URI.
 *
 * @param {Buffer} buffer - File buffer from multer
 * @param {string} folder - Folder name in Cloudinary (e.g. 'ironline/gym-logos')
 * @param {string} [mimetype='image/jpeg']
 * @returns {Promise<{url: string, publicId: string, isFallback?: boolean}>}
 */
function uploadToCloudinary(buffer, folder = 'ironline', mimetype = 'image/jpeg') {
  return new Promise((resolve, reject) => {
    if (!isConfigured) {
      // Fallback: return data URI so app features remain functional in local dev without Cloudinary
      const base64 = buffer.toString('base64');
      const dataUri = `data:${mimetype};base64,${base64}`;
      return resolve({
        url: dataUri,
        publicId: `inline_${Date.now()}`,
        isFallback: true,
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          console.error('[cloudinary] Upload error:', error);
          return reject(error);
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Deletes an asset from Cloudinary by public ID.
 *
 * @param {string} publicId
 * @returns {Promise<any>}
 */
async function deleteFromCloudinary(publicId) {
  if (!isConfigured || !publicId || publicId.startsWith('inline_')) {
    return { result: 'skipped' };
  }
  return cloudinary.uploader.destroy(publicId);
}

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  isConfigured,
};
