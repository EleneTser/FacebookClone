// src/services/cloudinaryService.ts
//
// Shared helper for uploading images to Cloudinary's unsigned upload API.
// Used by both ProfilePage (profile/cover photos) and CreatePostModal (post photos).

// Fill these in from your Cloudinary dashboard (Settings → Upload → Upload presets).
const CLOUDINARY_CLOUD_NAME = 'yii7agg3';
const CLOUDINARY_UPLOAD_PRESET = 'FACEBOOK';

export const uploadImageToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    throw new Error(`Cloudinary upload failed: ${response.status}`);
  }

  const data = await response.json();
  return data.secure_url as string;
};