import { v2 as cloudinary } from 'cloudinary';

import { env } from '../../env.js';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export type CloudinaryUploadSignature = {
  signature: string;
  timestamp: number;
  cloudName: string;
};

/**
 * Generate a signed upload token for client-side direct upload to Cloudinary.
 * Allows unsigned upload with constraints (folder, overwrite).
 */
export const generateUploadSignature = (folder: string): CloudinaryUploadSignature => {
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = { timestamp, folder, overwrite: true };

  const signature = cloudinary.utils.api_sign_request(paramsToSign, env.CLOUDINARY_API_SECRET);

  return {
    signature,
    timestamp,
    cloudName: env.CLOUDINARY_CLOUD_NAME,
  };
};

export { cloudinary };
