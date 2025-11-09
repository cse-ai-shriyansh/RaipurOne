const express = require('express');
const multer = require('multer');
const {
  uploadImage,
  uploadMultipleImages,
  getTicketImages,
  getUserImages,
  deleteImage,
} = require('../controllers/imageController');

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  },
});

/**
 * @route   POST /api/images/upload
 * @desc    Upload a single image
 * @body    { userId, ticketId (optional) }
 * @file    image (single file)
 */
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const { userId, ticketId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided',
      });
    }

    const result = await uploadImage(req.file, userId, ticketId || null);
    res.json(result);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error uploading image',
    });
  }
});

/**
 * @route   POST /api/images/upload-multiple
 * @desc    Upload multiple images
 * @body    { userId, ticketId (optional) }
 * @files   images (multiple files)
 */
router.post('/upload-multiple', upload.array('images', 10), async (req, res) => {
  try {
    const { userId, ticketId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required',
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No image files provided',
      });
    }

    const result = await uploadMultipleImages(req.files, userId, ticketId || null);
    res.json(result);
  } catch (error) {
    console.error('Upload multiple error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error uploading images',
    });
  }
});

/**
 * @route   GET /api/images/ticket/:ticketId
 * @desc    Get all images for a ticket
 */
router.get('/ticket/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;
    console.log(`📷 Fetching images for ticket: ${ticketId}`);
    const result = await getTicketImages(ticketId);
    console.log(`📷 Found ${result.images?.length || 0} images for ticket ${ticketId}`);
    res.json(result);
  } catch (error) {
    console.error('Get ticket images error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error fetching ticket images',
    });
  }
});

/**
 * @route   GET /api/images/user/:userId
 * @desc    Get all images for a user
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await getUserImages(userId);
    res.json(result);
  } catch (error) {
    console.error('Get user images error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error fetching user images',
    });
  }
});

/**
 * @route   DELETE /api/images/:imageId
 * @desc    Delete an image
 * @body    { userId }
 */
router.delete('/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required',
      });
    }

    const result = await deleteImage(imageId, userId);
    res.json(result);
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error deleting image',
    });
  }
});

// Error handler for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size too large. Maximum size is 10MB',
      });
    }
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
  next(error);
});

module.exports = router;
