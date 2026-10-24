export type StorageVisibility = 'PUBLIC' | 'PRIVATE';
export type StorageReference = {
  key: string;
  visibility: StorageVisibility;
  format?: string | null;
  /** Optional provider version; adapters without numeric versions can return null. */
  version?: number | null;
};
export type StoredMedia = { format: string; bytes: number; version: number | null };
export type MultipartUpload = { uploadUrl: string; fields: Record<string, string> };
export type DirectUploadOptions = {
  allowedFormats: readonly string[];
  maxBytes: number;
  expiresAt: Date;
};

/** Provider operations only. User/tenant authorization belongs to the upload service. */
export interface MediaStorage {
  readonly name: string;
  prepareUpload(
    reference: StorageReference,
    options: DirectUploadOptions,
  ): MultipartUpload | Promise<MultipartUpload>;
  inspectUpload(reference: StorageReference): Promise<StoredMedia>;
  publicUrl(reference: StorageReference): string;
  privateDownloadUrl(reference: StorageReference, expiresAt: number): string | Promise<string>;
}

export class InvalidStorageObjectError extends Error {
  constructor() {
    super('Uploaded asset does not match its reserved storage reference');
    this.name = 'InvalidStorageObjectError';
  }
}
