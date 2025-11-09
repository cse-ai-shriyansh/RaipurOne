const { supabase } = require('../config/supabaseClient');
const { v4: uuidv4 } = require('uuid');

/**
 * Upload image to Supabase Storage
 */
async function uploadImage(file, userId, ticketId = null) {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    // Generate unique file name
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('ticket-images')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('ticket-images')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // Save image metadata to database
    const { data: imageRecord, error: dbError } = await supabase
      .from('images')
      .insert([
        {
          ticket_id: ticketId,
          user_id: userId,
          file_name: file.originalname,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.mimetype,
          storage_url: publicUrl,
        },
      ])
      .select()
      .single();

    if (dbError) throw dbError;

    return {
      success: true,
      image: {
        id: imageRecord.id,
        fileName: imageRecord.file_name,
        url: publicUrl,
        ticketId: imageRecord.ticket_id,
        userId: imageRecord.user_id,
        fileSize: imageRecord.file_size,
        mimeType: imageRecord.mime_type,
        createdAt: imageRecord.created_at,
      },
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

/**
 * Upload multiple images
 */
async function uploadMultipleImages(files, userId, ticketId = null) {
  try {
    if (!files || files.length === 0) {
      throw new Error('No files provided');
    }

    const uploadPromises = files.map((file) => uploadImage(file, userId, ticketId));
    const results = await Promise.all(uploadPromises);

    return {
      success: true,
      images: results.map((r) => r.image),
      count: results.length,
    };
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw error;
  }
}

/**
 * Get images for a ticket
 */
async function getTicketImages(ticketId) {
  try {
    const { data: images, error } = await supabase
      .from('images')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      success: true,
      images: images.map((img) => ({
        id: img.id,
        fileName: img.file_name,
        url: img.storage_url,
        ticketId: img.ticket_id,
        userId: img.user_id,
        fileSize: img.file_size,
        mimeType: img.mime_type,
        createdAt: img.created_at,
      })),
    };
  } catch (error) {
    console.error('Error fetching ticket images:', error);
    throw error;
  }
}

/**
 * Get images for a user
 */
async function getUserImages(userId) {
  try {
    const { data: images, error } = await supabase
      .from('images')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      success: true,
      images: images.map((img) => ({
        id: img.id,
        fileName: img.file_name,
        url: img.storage_url,
        ticketId: img.ticket_id,
        userId: img.user_id,
        fileSize: img.file_size,
        mimeType: img.mime_type,
        createdAt: img.created_at,
      })),
    };
  } catch (error) {
    console.error('Error fetching user images:', error);
    throw error;
  }
}

/**
 * Delete an image
 */
async function deleteImage(imageId, userId) {
  try {
    // Get image record
    const { data: image, error: fetchError } = await supabase
      .from('images')
      .select('*')
      .eq('id', imageId)
      .eq('user_id', userId) // Ensure user owns the image
      .single();

    if (fetchError || !image) {
      throw new Error('Image not found or unauthorized');
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('ticket-images')
      .remove([image.file_path]);

    if (storageError) throw storageError;

    // Delete from database
    const { error: dbError } = await supabase
      .from('images')
      .delete()
      .eq('id', imageId);

    if (dbError) throw dbError;

    return {
      success: true,
      message: 'Image deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
}

module.exports = {
  uploadImage,
  uploadMultipleImages,
  getTicketImages,
  getUserImages,
  deleteImage,
};
