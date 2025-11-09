import { supabase } from './supabaseClient';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

/**
 * Upload an image to Supabase Storage
 * @param {string} uri - The local URI of the image
 * @param {string} bucket - The storage bucket name (default: 'complaint-images')
 * @param {string} folder - Optional folder path within bucket
 * @returns {Promise<{success: boolean, url: string | null, error: string | null}>}
 */
export const uploadImage = async (uri, bucket = 'complaint-images', folder = '') => {
  try {
    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Generate unique filename
    const filename = `${folder ? folder + '/' : ''}${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;

    // Convert base64 to array buffer
    const arrayBuffer = decode(base64);

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filename, arrayBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filename);

    return {
      success: true,
      url: urlData.publicUrl,
      path: filename,
      error: null,
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    return {
      success: false,
      url: null,
      path: null,
      error: error.message,
    };
  }
};

/**
 * Upload multiple images
 * @param {Array<string>} uris - Array of image URIs
 * @param {string} bucket - The storage bucket name
 * @param {string} folder - Optional folder path
 * @returns {Promise<Array>}
 */
export const uploadMultipleImages = async (uris, bucket = 'complaint-images', folder = '') => {
  const uploadPromises = uris.map((uri) => uploadImage(uri, bucket, folder));
  return await Promise.all(uploadPromises);
};

/**
 * Delete an image from Supabase Storage
 * @param {string} path - The file path in storage
 * @param {string} bucket - The storage bucket name
 * @returns {Promise<{success: boolean, error: string | null}>}
 */
export const deleteImage = async (path, bucket = 'complaint-images') => {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      throw error;
    }

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error('Error deleting image:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get public URL for an image
 * @param {string} path - The file path in storage
 * @param {string} bucket - The storage bucket name
 * @returns {string}
 */
export const getImageUrl = (path, bucket = 'complaint-images') => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

/**
 * List all images in a folder
 * @param {string} folder - The folder path
 * @param {string} bucket - The storage bucket name
 * @returns {Promise<Array>}
 */
export const listImages = async (folder = '', bucket = 'complaint-images') => {
  try {
    const { data, error } = await supabase.storage.from(bucket).list(folder, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' },
    });

    if (error) {
      throw error;
    }

    return {
      success: true,
      images: data,
      error: null,
    };
  } catch (error) {
    console.error('Error listing images:', error);
    return {
      success: false,
      images: [],
      error: error.message,
    };
  }
};

export default {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  getImageUrl,
  listImages,
};
