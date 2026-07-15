import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData, isAdminRequest } from '../_data';

export const dynamic = 'force-dynamic';

/** PUT /api/help-center/reorder — reorder topics (admin only) */
export async function PUT(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { topicIds } = body;

    if (!Array.isArray(topicIds) || topicIds.length === 0) {
      return NextResponse.json({ error: 'topicIds array is required' }, { status: 400 });
    }

    const data = await readData();

    // Build new order matching topicIds, preserve any topics not in the list
    const reordered: typeof data.topics = [];
    const remaining = data.topics.filter((t) => !topicIds.includes(t.id));

    for (let i = 0; i < topicIds.length; i++) {
      const topic = data.topics.find((t) => t.id === topicIds[i]);
      if (topic) {
        topic.order = reordered.length;
        reordered.push(topic);
      }
    }

    // Append any topics that were missing from topicIds
    for (const topic of remaining) {
      topic.order = reordered.length;
      reordered.push(topic);
    }

    data.topics = reordered;
    await writeData(data);

    return NextResponse.json({ success: true, topics: data.topics });
  } catch (error: any) {
    return NextResponse.json({ error: 'Invalid request body', message: error.message }, { status: 400 });
  }
}
