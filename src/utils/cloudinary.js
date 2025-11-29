import axios from 'axios';

// Cloudinary upload function using direct upload to avoid Node.js modules in browser
export const uploadToCloudinary = async (file, folder = '') => {
   const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'diap7m2zq';
   const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'cloudjamz';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  // Set folder if provided
  if (folder) {
    formData.append('folder', folder);
  }

  // Determine resource type based on file type
  let resourceType = 'auto';
  if (file.type.startsWith('audio/')) {
    resourceType = 'video'; // Cloudinary treats audio as 'video' resource type
  } else if (file.type.startsWith('image/')) {
    resourceType = 'image';
  }

  formData.append('resource_type', resourceType);

  // Remove format and quality parameters for unsigned uploads
  // These need to be configured in the upload preset instead

  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    console.log('Cloudinary response:', response.data); // Debug log

    return {
      url: response.data.secure_url,
      publicId: response.data.public_id,
      format: response.data.format,
      bytes: response.data.bytes,
    };
  } catch (error) {
    console.error('Cloudinary upload failed:', error.response?.data || error.message);
    console.error('Full error object:', error);
    console.error('Error response data:', error.response?.data);
    console.error('Error details:', JSON.stringify(error.response?.data, null, 2));
    throw error;
  }
};

// Cloudinary delete function - Note: This requires server-side implementation for proper deletion
// Client-side deletion of unsigned uploads is not supported by Cloudinary
// For now, we'll just log the attempt and remove from Firestore
export const deleteFromCloudinary = async (publicId) => {
  console.log('Cloudinary client-side delete not supported for unsigned uploads. Public ID:', publicId);
  console.log('To properly delete from Cloudinary, implement server-side Admin API call');

  // For now, just return success to allow Firestore deletion
  // In production, you'd need a server endpoint that calls:
  // POST https://api.cloudinary.com/v1_1/{cloud_name}/resources/{resource_type}/destroy
  // with api_key and api_secret (server-side only)

  return { success: true };
};

export default {
  uploadToCloudinary,
  deleteFromCloudinary,
};
