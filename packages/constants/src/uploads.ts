/** Shared admission policy. Client checks are advisory; the API verifies provider metadata. */
export const UPLOAD_POLICIES = {
  PROPERTY_PHOTO: {
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
    maxBytes: 10 * 1024 * 1024,
  },
  APPLICATION_DOCUMENT: {
    allowedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
    maxBytes: 5 * 1024 * 1024,
  },
} as const;
