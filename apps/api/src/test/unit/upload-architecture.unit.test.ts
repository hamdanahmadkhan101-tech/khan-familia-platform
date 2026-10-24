import { describe, expect, it } from 'vitest';
import { UPLOAD_POLICIES } from '@khan-familia/constants';
import { createUploadBodySchema } from '@khan-familia/validation';
import { getMediaStorage, storageReference } from '../../infrastructure/storage/index.js';
import {
  imageReferenceKey,
  storedImageReferenceKey,
} from '../../modules/catalog/image-references.js';
import { documentReferences } from '../../modules/upload/document-references.js';

const uploadId = 'cm123456789012345678901234';

describe('upload architecture boundaries', () => {
  it.each(['not-installed', '__proto__', 'constructor'])(
    'fails closed for unsupported provider %s',
    (name) => {
      expect(() => getMediaStorage(name)).toThrow('Storage provider unavailable');
    },
  );
  it('resolves known providers explicitly and preserves visibility when mapping persistence', () => {
    expect(getMediaStorage('cloudinary').name).toBe('cloudinary');
    expect(
      storageReference({
        storageKey: 'opaque/key',
        visibility: 'PRIVATE',
        format: 'pdf',
        version: null,
      }),
    ).toEqual({ key: 'opaque/key', visibility: 'PRIVATE', format: 'pdf', version: null });
    expect(() =>
      storageReference({
        storageKey: 'opaque/key',
        visibility: 'unexpected',
        format: 'pdf',
        version: null,
      }),
    ).toThrow();
  });
  it('keeps PDF documents outside the public photo admission policy', () => {
    expect(UPLOAD_POLICIES.APPLICATION_DOCUMENT.allowedFormats).toContain('pdf');
    expect(UPLOAD_POLICIES.PROPERTY_PHOTO.allowedFormats).not.toContain('pdf');
    expect(UPLOAD_POLICIES.APPLICATION_DOCUMENT.maxBytes).toBe(5 * 1024 * 1024);
    expect(
      createUploadBodySchema.safeParse({
        purpose: 'APPLICATION_DOCUMENT',
        storageKey: 'foreign/key',
      }).success,
    ).toBe(false);
  });
  it('uses the submission schema for document references and removes arbitrary stored URLs', () => {
    expect(documentReferences([{ uploadId, type: 'REGISTRATION' }])).toEqual([
      { uploadId, type: 'REGISTRATION' },
    ]);
    expect(
      documentReferences([
        { uploadId, type: 'REGISTRATION', url: 'https://foreign.test/file.pdf' },
      ]),
    ).toEqual([{ type: 'LEGACY_DOCUMENT', unavailable: true }]);
  });
  it('uses unambiguous image keys and handles seeded room JSON safely', () => {
    expect(imageReferenceKey({ url: 'a|b', publicId: 'c' })).not.toBe(
      imageReferenceKey({ url: 'a', publicId: 'b|c' }),
    );
    expect(storedImageReferenceKey({ url: 'https://image.test/seed.jpg' })).toBe(
      imageReferenceKey({ url: 'https://image.test/seed.jpg' }),
    );
    expect(
      storedImageReferenceKey({ url: 'https://image.test/seed.jpg', publicId: 123 }),
    ).toBeNull();
    expect(storedImageReferenceKey(null)).toBeNull();
    expect(storedImageReferenceKey('https://image.test/seed.jpg')).toBeNull();
  });
});
