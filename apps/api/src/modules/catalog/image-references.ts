/** Asset keys are opaque strings; tuple encoding avoids ambiguous string concatenation. */
export const imageReferenceKey = (image: { url: string; publicId?: string | null | undefined }) =>
  JSON.stringify([image.url, image.publicId ?? null]);

/** Existing room JSON predates verified uploads. Retain known references without trusting new ones. */
export const storedImageReferenceKey = (value: unknown): string | null => {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('url' in value) ||
    typeof value.url !== 'string'
  )
    return null;
  const publicId = 'publicId' in value ? value.publicId : undefined;
  if (publicId !== undefined && publicId !== null && typeof publicId !== 'string') return null;
  return imageReferenceKey({ url: value.url, publicId });
};
