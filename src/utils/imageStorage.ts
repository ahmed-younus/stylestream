import { supabase } from "@/integrations/supabase/client";

/**
 * Uploads a base64 image to Supabase Storage and returns the public URL
 */
export const uploadImageToStorage = async (
  base64Image: string,
  userId: string,
  folder: 'try-on' | 'avatar' = 'try-on'
): Promise<string> => {
  // If already a URL (not base64), return as-is
  if (!base64Image.startsWith('data:')) {
    return base64Image;
  }

  // Extract the base64 data and mime type
  const matches = base64Image.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid base64 image format');
  }

  const mimeType = matches[1];
  const base64Data = matches[2];
  
  // Determine file extension
  const ext = mimeType.includes('png') ? 'png' : 'jpg';
  
  // Generate unique filename - userId MUST be first folder for RLS policy
  // storage.foldername extracts folder names from path, and RLS checks [1] (first element)
  const filename = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
  
  // Convert base64 to blob
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });

  // Upload to storage
  const { data, error } = await supabase.storage
    .from('outfit-images')
    .upload(filename, blob, {
      contentType: mimeType,
      cacheControl: '31536000', // 1 year cache
      upsert: false
    });

  if (error) {
    console.error('Storage upload error:', error);
    throw error;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('outfit-images')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
};

/**
 * Compresses a base64 image to reduce size before upload
 */
export const compressBase64Image = (
  base64Image: string,
  maxWidth: number = 1200,
  maxHeight: number = 1600,
  quality: number = 0.85
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // If not base64, return as-is
    if (!base64Image.startsWith('data:')) {
      resolve(base64Image);
      return;
    }

    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Only resize if larger than max dimensions
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      const compressed = canvas.toDataURL('image/jpeg', quality);
      console.log(`Compressed: ${(base64Image.length / 1024).toFixed(0)}KB → ${(compressed.length / 1024).toFixed(0)}KB`);
      resolve(compressed);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = base64Image;
  });
};

/**
 * Uploads an image with compression
 */
export const uploadCompressedImage = async (
  base64Image: string,
  userId: string,
  folder: 'try-on' | 'avatar' = 'try-on'
): Promise<string> => {
  const compressed = await compressBase64Image(base64Image);
  return uploadImageToStorage(compressed, userId, folder);
};
