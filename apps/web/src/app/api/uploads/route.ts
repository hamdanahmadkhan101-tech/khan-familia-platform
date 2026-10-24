import { NextResponse } from 'next/server';
import { ApiError } from '@khan-familia/sdk';
import { createUploadBodySchema } from '@khan-familia/validation';
import { getServerApiClient } from '../../../lib/api.server';

export async function POST(request: Request) {
  try {
    const parsed = createUploadBodySchema.safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json({ error: 'Invalid upload request' }, { status: 400 });
    const api = await getServerApiClient();
    const result = await api.getUploadSignature(parsed.data);
    return NextResponse.json(result, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const status =
      error instanceof ApiError ? error.status : error instanceof SyntaxError ? 400 : 503;
    return NextResponse.json({ error: 'Could not authorize upload' }, { status });
  }
}
