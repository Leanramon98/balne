import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import s3Client, { S3_BUCKET } from '@/app/api/_lib/s3';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ evidenceId: string }> }
) {
  try {
    const { evidenceId } = await context.params;

    // Validate JWT from cookie (Next.js middleware should have done this,
    // but we double-check for defense in depth)
    const token = req.cookies.get('auto_insight_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch evidence metadata from evaluations-service via api-gateway
    // This endpoint checks evaluation access internally
    const gatewayUrl = process.env.INTERNAL_GATEWAY_URL || 'http://localhost:8080';
    const metaRes = await fetch(`${gatewayUrl}/api/evaluations/evidence/${evidenceId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (metaRes.status === 403) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (metaRes.status === 404) {
      return NextResponse.json({ error: 'Evidence not found' }, { status: 404 });
    }
    if (!metaRes.ok) {
      const errText = await metaRes.text();
      console.error('Failed to fetch evidence metadata:', metaRes.status, errText);
      return NextResponse.json({ error: 'Failed to fetch evidence metadata' }, { status: 502 });
    }

    const evidence = await metaRes.json();
    const filePath = evidence.file_path;

    if (!filePath) {
      return NextResponse.json({ error: 'Evidence has no file' }, { status: 404 });
    }

    // Stream file from minIO
    const getCmd = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: filePath,
    });

    const s3Response = await s3Client.send(getCmd);
    const body = s3Response.Body;

    if (!body) {
      return NextResponse.json({ error: 'File not found in storage' }, { status: 404 });
    }

    // Convert the Node.js Readable stream to a Buffer
    const chunks: Buffer[] = [];
    for await (const chunk of body as NodeJS.ReadableStream) {
      chunks.push(Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);

    // Determine content type and disposition
    const contentType = s3Response.ContentType || 'application/octet-stream';
    const originalName = filePath.split('/').pop() || 'download';
    // Try to get a clean name without the UUID prefix
    const displayName = originalName.includes('-')
      ? originalName.substring(originalName.indexOf('-') + 1)
      : originalName;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${displayName}"`,
        'Content-Length': String(buffer.length),
      },
    });
  } catch (error: any) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Download failed', message: error.message },
      { status: 500 }
    );
  }
}
