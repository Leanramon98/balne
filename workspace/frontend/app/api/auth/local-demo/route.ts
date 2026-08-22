import { NextResponse } from 'next/server';
import { localDemoSession } from '@/demo/balne-fixture';
import { isLocalDemoEnabled } from '@/lib/local-demo';

export async function POST() {
  if (!isLocalDemoEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const response = NextResponse.json(localDemoSession);
  response.cookies.set('balne_local_demo_session', '1', {
    httpOnly: true,
    secure: false,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 8,
  });
  return response;
}
