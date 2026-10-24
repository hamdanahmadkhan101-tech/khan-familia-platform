import { NextResponse } from 'next/server';
import { ApiError } from '@khan-familia/sdk';
import { getServerApiClient } from '../../../../../lib/api.server';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ uploadId: string }> },
) {
  try {
    const { uploadId } = await params;
    const api = await getServerApiClient();
    return NextResponse.json(await api.completeUpload(uploadId), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Could not verify upload; retry shortly' },
      {
        status: error instanceof ApiError ? error.status : 503,
      },
    );
  }
}
