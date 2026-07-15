import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import s3Client, { S3_BUCKET } from '@/app/api/_lib/s3';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const actionId = formData.get('actionId') as string | null;
    const evaluationId = formData.get('evaluationId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }
    if (!actionId) {
      return NextResponse.json({ error: 'actionId is required' }, { status: 400 });
    }
    if (!evaluationId) {
      return NextResponse.json({ error: 'evaluationId is required' }, { status: 400 });
    }

    // Generate S3 key: actions/{actionId}/{uuid}-{originalName}
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const s3Key = `actions/${actionId}/${randomUUID()}-${sanitizedName}`;

    // Upload file to minIO
    const buffer = Buffer.from(await file.arrayBuffer());
    await s3Client.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Key,
      Body: buffer,
      ContentType: file.type || 'application/octet-stream',
    }));

    // Call evaluations-service via api-gateway to persist metadata
    const gatewayUrl = process.env.INTERNAL_GATEWAY_URL || 'http://localhost:8080';
    const token = req.cookies.get('auto_insight_token')?.value;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const evRes = await fetch(`${gatewayUrl}/api/evaluations/actions/${actionId}/evidence`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        evaluation_id: evaluationId,
        type: 'document',
        file_path: s3Key,
      }),
    });

    if (!evRes.ok) {
      const evError = await evRes.text();
      console.error('Failed to create evidence metadata:', evRes.status, evError);
      return NextResponse.json(
        { error: 'Failed to create evidence metadata', detail: evError },
        { status: 502 }
      );
    }

    const evidence = await evRes.json();
    return NextResponse.json(evidence, { status: 201 });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', message: error.message },
      { status: 500 }
    );
  }
}
