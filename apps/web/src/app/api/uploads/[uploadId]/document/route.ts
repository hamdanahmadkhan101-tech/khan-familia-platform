import { NextResponse } from 'next/server';
import { ApiError } from '@khan-familia/sdk';
import { getServerApiClient } from '../../../../../lib/api.server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ uploadId: string }> },
) {
  try {
    const { uploadId } = await params;
    const api = await getServerApiClient();
    const { url } = await api.getDocumentAccess(uploadId);
    return NextResponse.redirect(url, {
      status: 303,
      headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Document unavailable or access denied' },
      {
        status: error instanceof ApiError ? error.status : 503,
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  }
}
