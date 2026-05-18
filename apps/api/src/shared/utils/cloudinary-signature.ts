import { v2 as cloudinary } from 'cloudinary';

const getRequiredEnv = (key: 'CLOUDINARY_API_SECRET' | 'CLOUDINARY_CLOUD_NAME'): string => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

export type UploadSignature = {
  signature: string;
  timestamp: number;
  cloudName: string;
};

export const generateUploadSignature = (folder: string): UploadSignature => {
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = { timestamp, folder, overwrite: true };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    getRequiredEnv('CLOUDINARY_API_SECRET'),
  );

  return {
    signature,
    timestamp,
    cloudName: getRequiredEnv('CLOUDINARY_CLOUD_NAME'),
  };
};
