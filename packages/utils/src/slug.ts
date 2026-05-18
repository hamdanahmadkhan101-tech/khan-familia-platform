import { customAlphabet, nanoid } from 'nanoid';
import slugify from 'slugify';

const alphaNumeric = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 8);

export const generateSlug = (input: string): string =>
  slugify(input, { lower: true, strict: true, trim: true });

export const generateShortId = (): string => alphaNumeric();

export const generateNanoId = (size = 12): string => nanoid(size);
