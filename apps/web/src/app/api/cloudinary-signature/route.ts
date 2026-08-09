import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { api } from '../../../lib/api';

export async function POST(request: Request) {
  try {
    const { getToken } = await auth();
    const token = await getToken();

    // next-cloudinary sends { paramsToSign } in the request body
    const body = await request.json();
    const paramsToSign = body.paramsToSign || body;

    const data = await api.getUploadSignature(paramsToSign, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
