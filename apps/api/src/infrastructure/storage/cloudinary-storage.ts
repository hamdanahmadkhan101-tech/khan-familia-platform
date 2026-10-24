import { z } from '@khan-familia/validation';
import { cloudinary } from './cloudinary.js';
import { env } from '../../env.js';
import {
  InvalidStorageObjectError,
  type MediaStorage,
  type StorageReference,
} from './storage.interface.js';

const deliveryType = (reference: StorageReference) =>
  reference.visibility === 'PUBLIC' ? 'upload' : 'authenticated';
const resourceSchema = z.object({
  public_id: z.string(),
  resource_type: z.literal('image'),
  type: z.string(),
  format: z.string(),
  bytes: z.number().int().positive(),
  version: z.number().int().positive(),
});

export const cloudinaryStorage: MediaStorage = {
  name: 'cloudinary',
  prepareUpload(reference, options) {
    const parameters = {
      timestamp: Math.floor(Date.now() / 1000),
      public_id: reference.key,
      type: deliveryType(reference),
      overwrite: false,
      allowed_formats: options.allowedFormats.join(','),
      upload_preset:
        reference.visibility === 'PUBLIC'
          ? env.CLOUDINARY_PHOTO_UPLOAD_PRESET
          : env.CLOUDINARY_DOCUMENT_UPLOAD_PRESET,
    };
    return {
      uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,
      fields: {
        ...Object.fromEntries(
          Object.entries(parameters).map(([key, value]) => [key, String(value)]),
        ),
        api_key: env.CLOUDINARY_API_KEY,
        signature: cloudinary.utils.api_sign_request(parameters, env.CLOUDINARY_API_SECRET),
      },
    };
  },
  async inspectUpload(reference) {
    const resource: unknown = await cloudinary.api.resource(reference.key, {
      resource_type: 'image',
      type: deliveryType(reference),
    });
    const parsed = resourceSchema.safeParse(resource);
    if (
      !parsed.success ||
      parsed.data.public_id !== reference.key ||
      parsed.data.type !== deliveryType(reference)
    ) {
      throw new InvalidStorageObjectError();
    }
    return { format: parsed.data.format, bytes: parsed.data.bytes, version: parsed.data.version };
  },
  publicUrl(reference) {
    if (reference.visibility !== 'PUBLIC' || !reference.format || !reference.version) {
      throw new InvalidStorageObjectError();
    }
    return cloudinary.url(reference.key, {
      secure: true,
      resource_type: 'image',
      type: 'upload',
      format: reference.format,
      version: reference.version,
    });
  },
  privateDownloadUrl(reference, expiresAt) {
    if (reference.visibility !== 'PRIVATE' || !reference.format)
      throw new InvalidStorageObjectError();
    return cloudinary.utils.private_download_url(reference.key, reference.format, {
      resource_type: 'image',
      type: 'authenticated',
      expires_at: expiresAt,
      attachment: true,
    });
  },
};
