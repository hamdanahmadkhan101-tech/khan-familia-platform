import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createApiClient } from '@khan-familia/sdk';

const getApiClient = async () => {
  const { getToken } = await auth();
  return createApiClient({
    baseUrl: process.env['NEXT_PUBLIC_API_BASE_URL'] || 'http://localhost:3001',
    getToken: async () => await getToken(),
  });
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiClient = await getApiClient();

    const response = await apiClient.submitApplication(body);

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('API Route Error submitting application:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 },
    );
  }
}
