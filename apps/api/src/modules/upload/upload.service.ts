import crypto from 'node:crypto';
import type { Prisma } from '@khan-familia/database';
import type { CreateUploadBody } from '@khan-familia/validation';
import type { DirectUpload, DocumentAccess } from '@khan-familia/types';
import { prisma } from '../../infrastructure/database/client.js';
import {
  defaultMediaStorage,
  getMediaStorage,
  storageReference,
} from '../../infrastructure/storage/index.js';
import {
  InvalidStorageObjectError,
  type StoredMedia,
} from '../../infrastructure/storage/storage.interface.js';
import { UPLOAD_POLICIES } from '@khan-familia/constants';
import { AppError } from '../../shared/errors/AppError.js';

type Upload = Prisma.UploadAssetGetPayload<Record<string, never>>;
const HOUR = 60 * 60 * 1000;

export const assertPropertyUploadAccess = async (userId: string, propertyId: string) => {
  const property = await prisma.property.findFirst({
    where: { id: propertyId, isDeleted: false, tenant: { status: 'ACTIVE' } },
    select: { tenantId: true },
  });
  if (!property) throw AppError.notFound('Property not found');
  const member = await prisma.tenantUser.findFirst({
    where: {
      tenantId: property.tenantId,
      userId,
      status: 'ACTIVE',
      role: { in: ['OWNER', 'ADMIN'] },
    },
  });
  if (!member) throw AppError.forbidden('Property management permission required');
  return property.tenantId;
};

export const createUpload = async (
  userId: string,
  input: CreateUploadBody,
): Promise<DirectUpload> => {
  const photo = input.purpose === 'PROPERTY_PHOTO';
  const tenantId = photo ? await assertPropertyUploadAccess(userId, input.propertyId) : null;
  if (!photo) {
    const existing = await prisma.tenantApplication.findFirst({
      where: { userId, status: { in: ['PENDING', 'APPROVED'] } },
      select: { id: true },
    });
    if (existing) throw AppError.conflict('An application is already pending or approved');
  }
  const storageKey = photo
    ? `khan-familia/properties/${tenantId}/${input.propertyId}/${crypto.randomUUID()}`
    : `khan-familia/verification/${userId}/${crypto.randomUUID()}`;
  const visibility = photo ? 'PUBLIC' : 'PRIVATE';
  const policy = UPLOAD_POLICIES[input.purpose];
  const expiresAt = new Date(Date.now() + HOUR);
  const asset = await prisma.$transaction(async (tx) => {
    // Serialize the per-user quota across API processes, not just in this process.
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`upload:${userId}`}))::text`;
    const recent = await tx.uploadAsset.count({
      where: { ownerId: userId, createdAt: { gt: new Date(Date.now() - HOUR) } },
    });
    if (recent >= 60)
      throw new AppError('Upload limit reached; try again later', 429, 'RATE_LIMITED');
    return tx.uploadAsset.create({
      data: {
        ownerId: userId,
        purpose: input.purpose,
        tenantId,
        propertyId: photo ? input.propertyId : null,
        provider: defaultMediaStorage.name,
        storageKey,
        visibility,
        expiresAt,
      },
    });
  });
  return {
    uploadId: asset.id,
    ...(await defaultMediaStorage.prepareUpload(
      { key: storageKey, visibility },
      { ...policy, expiresAt },
    )),
    allowedFormats: [...policy.allowedFormats],
    maxBytes: policy.maxBytes,
    expiresAt: expiresAt.toISOString(),
  };
};

export const completeUpload = async (userId: string, uploadId: string) => {
  const asset = await prisma.uploadAsset.findFirst({ where: { id: uploadId, ownerId: userId } });
  if (!asset) throw AppError.notFound('Upload not found');
  if (asset.propertyId) await assertPropertyUploadAccess(userId, asset.propertyId);
  if (asset.completedAt) return { uploadId: asset.id };
  if (asset.expiresAt <= new Date())
    throw AppError.conflict('Upload has expired; select the file again');
  let metadata: StoredMedia;
  try {
    metadata = await getMediaStorage(asset.provider).inspectUpload(storageReference(asset));
  } catch (error) {
    if (error instanceof InvalidStorageObjectError)
      throw AppError.badRequest('Uploaded asset does not satisfy the upload policy');
    throw AppError.serviceUnavailable('Could not verify upload; retry completion shortly');
  }
  const policy = UPLOAD_POLICIES[asset.purpose];
  const allowedFormats: readonly string[] = policy.allowedFormats;
  if (!allowedFormats.includes(metadata.format) || metadata.bytes > policy.maxBytes) {
    throw AppError.badRequest('Uploaded asset does not satisfy the upload policy');
  }
  await prisma.uploadAsset.update({
    where: { id: asset.id, ownerId: userId },
    data: {
      completedAt: new Date(),
      format: metadata.format,
      bytes: metadata.bytes,
      version: metadata.version,
    },
  });
  return { uploadId: asset.id };
};

export const publicPhotoUrl = (asset: Upload): string => {
  if (asset.purpose !== 'PROPERTY_PHOTO' || !asset.completedAt || !asset.format) {
    throw AppError.badRequest('A verified property photo is required');
  }
  return getMediaStorage(asset.provider).publicUrl(storageReference(asset));
};

export const getDocumentAccess = async (
  userId: string,
  uploadId: string,
): Promise<DocumentAccess> => {
  const asset = await prisma.uploadAsset.findUnique({ where: { id: uploadId } });
  if (!asset || asset.purpose !== 'APPLICATION_DOCUMENT' || !asset.completedAt || !asset.format) {
    throw AppError.notFound('Document not found');
  }
  if (asset.ownerId !== userId) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    // Reviewers may read submitted documents only, not another user's draft uploads.
    if (user?.role !== 'SUPER_ADMIN' || !asset.applicationId) {
      throw AppError.notFound('Document not found');
    }
  }
  const expiresAt = Math.floor(Date.now() / 1000) + 60;
  return {
    url: await getMediaStorage(asset.provider).privateDownloadUrl(
      storageReference(asset),
      expiresAt,
    ),
    expiresAt: new Date(expiresAt * 1000).toISOString(),
  };
};
