import { cloudinaryStorage } from './cloudinary-storage.js';
import type { MediaStorage, StorageReference } from './storage.interface.js';
import { AppError } from '../../shared/errors/AppError.js';

// New uploads use the configured implementation; existing records retain their provider identity.
// Add another implementation only when it exists and its semantics are tested.
export const defaultMediaStorage = cloudinaryStorage;
const providers = new Map<string, MediaStorage>([['cloudinary', cloudinaryStorage]]);
export const getMediaStorage = (name: string): MediaStorage => {
  const provider = providers.get(name);
  if (!provider) throw AppError.serviceUnavailable('Storage provider unavailable');
  return provider;
};

export const storageReference = (asset: {
  storageKey: string;
  visibility: string;
  format: string | null;
  version: number | null;
}): StorageReference => {
  if (asset.visibility !== 'PUBLIC' && asset.visibility !== 'PRIVATE') {
    throw AppError.internal('Invalid stored asset visibility');
  }
  return {
    key: asset.storageKey,
    visibility: asset.visibility,
    format: asset.format,
    version: asset.version,
  };
};
