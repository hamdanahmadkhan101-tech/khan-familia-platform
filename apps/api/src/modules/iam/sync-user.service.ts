import type { PrismaClient } from '@khan-familia/database';

import { buildUserUpsertData, parseClerkWebhookUser } from './clerk-user-mapper.js';

export const upsertUserFromClerkPayload = async (prisma: PrismaClient, data: unknown) => {
  const user = parseClerkWebhookUser(data);
  const payload = buildUserUpsertData(user);

  await prisma.user.upsert({
    where: { clerkId: payload.clerkId },
    create: {
      clerkId: payload.clerkId,
      username: payload.username,
      email: payload.email,
      avatarUrl: payload.avatarUrl,
      phone: payload.phone,
    },
    update: {
      username: payload.username,
      email: payload.email,
      avatarUrl: payload.avatarUrl,
      phone: payload.phone,
      isDeleted: false,
      deletedAt: null,
    },
  });
};

export const softDeleteUserByClerkId = async (prisma: PrismaClient, clerkUserId: string) => {
  await prisma.user.updateMany({
    where: { clerkId: clerkUserId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
};
