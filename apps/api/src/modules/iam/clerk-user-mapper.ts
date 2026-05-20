import { z } from 'zod';

const emailAddressSchema = z.object({
  id: z.string(),
  email_address: z.string(),
});

const clerkWebhookUserSchema = z.object({
  id: z.string(),
  image_url: z.string().nullable().optional(),
  username: z.string().nullable().optional(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  email_addresses: z.array(emailAddressSchema).optional(),
  primary_email_address_id: z.string().nullable().optional(),
  phone_numbers: z.array(z.object({ phone_number: z.string() })).optional(),
});

export type ClerkWebhookUser = z.infer<typeof clerkWebhookUserSchema>;

export const parseClerkWebhookUser = (data: unknown): ClerkWebhookUser => {
  return clerkWebhookUserSchema.parse(data);
};

export const pickPrimaryEmail = (data: ClerkWebhookUser): string | null => {
  const addresses = data.email_addresses;
  if (!addresses?.length) {
    return null;
  }
  if (data.primary_email_address_id) {
    const primary = addresses.find((e) => e.id === data.primary_email_address_id);
    if (primary) {
      return primary.email_address;
    }
  }
  return addresses[0]!.email_address;
};

export const pickPrimaryPhone = (data: ClerkWebhookUser): string | null => {
  const phones = data.phone_numbers;
  if (!phones?.length) {
    return null;
  }
  return phones[0]!.phone_number;
};

export const deriveUsername = (data: ClerkWebhookUser, email: string | null): string => {
  const trimmed = data.username?.trim();
  if (trimmed) {
    return trimmed;
  }
  if (email) {
    const local = email.split('@')[0];
    if (local) {
      return local;
    }
  }
  const suffix = data.id.replace(/^user_/, '').slice(0, 16) || 'guest';
  return `user_${suffix}`;
};

export type ClerkUserUpsertFields = {
  clerkId: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  phone: string | null;
};

export const buildUserUpsertData = (data: ClerkWebhookUser): ClerkUserUpsertFields => {
  const email = pickPrimaryEmail(data);
  if (!email) {
    throw new Error('Clerk user has no email addresses');
  }

  return {
    clerkId: data.id,
    username: deriveUsername(data, email),
    email,
    avatarUrl: data.image_url ?? null,
    phone: pickPrimaryPhone(data),
  };
};
