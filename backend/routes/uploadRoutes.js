const express = require('express');
const multer = require('multer');
const { protect, authorize } = require('../middleware/auth');
const { attachAdminTenant, attachCustomerTenant } = require('../middleware/tenant');
const { uploadToCloudinary } = require('../utils/cloudinary');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WebP) are allowed!'), false);
    }
  },
});

/**
 * POST /api/upload/gym-logo
 * Admin uploads custom gym logo. Updates Admin profile automatically.
 */
router.post(
  '/gym-logo',
  protect,
  authorize('admin'),
  attachAdminTenant,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded.' });
    }

    const { url, publicId } = await uploadToCloudinary(
      req.file.buffer,
      'ironline/gym-logos',
      req.file.mimetype
    );

    req.adminDoc.gymLogoUrl = url;
    await req.adminDoc.save();

    res.json({
      url,
      publicId,
      message: 'Gym logo uploaded and updated successfully.',
    });
  })
);

/**
 * POST /api/upload/progress-photo
 * Customer uploads progress photo for weight tracking logs.
 */
router.post(
  '/progress-photo',
  protect,
  authorize('customer'),
  attachCustomerTenant,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded.' });
    }

    const { url, publicId } = await uploadToCloudinary(
      req.file.buffer,
      'ironline/progress-photos',
      req.file.mimetype
    );

    res.json({
      url,
      publicId,
      message: 'Progress photo uploaded successfully.',
    });
  })
);

module.exports = router;
