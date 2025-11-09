const express = require('express');
const router = express.Router();
const multer = require('multer');
const { supabase } = require('../config/supabaseClient');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Upload emergency broadcast image
router.post('/emergency-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const file = req.file;
    const fileName = `emergency_${Date.now()}_${file.originalname}`;
    const filePath = `emergency-broadcasts/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('complaint-images')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload image',
        error: error.message
      });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('complaint-images')
      .getPublicUrl(filePath);

    res.json({
      success: true,
      url: urlData.publicUrl,
      fileName: fileName
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message
    });
  }
});

// Upload CCTV screenshot (from Python detection)
router.post('/cctv-screenshot', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const file = req.file;
    const { camera_id, location, timestamp } = req.body;
    const fileName = `cctv_${camera_id}_${Date.now()}.jpg`;
    const filePath = `cctv-screenshots/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('complaint-images')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload screenshot',
        error: error.message
      });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('complaint-images')
      .getPublicUrl(filePath);

    res.json({
      success: true,
      url: urlData.publicUrl,
      fileName: fileName,
      metadata: {
        camera_id,
        location,
        timestamp
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload screenshot',
      error: error.message
    });
  }
});

module.exports = router;
