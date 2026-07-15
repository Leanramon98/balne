import { NextRequest, NextResponse } from 'next/server';
import {
  readData,
  writeData,
  isAdminRequest,
  generateId,
  ALLOWED_ICONS,
  type HelpTopic,
} from './_data';

export const dynamic = 'force-dynamic';

/** GET /api/help-center — list all topics (public) */
export async function GET() {
  const data = await readData();
  return NextResponse.json(data);
}

/** POST /api/help-center — create new topic (admin only) */
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { title_es, title_pt, icon } = body;

    if (!title_es || typeof title_es !== 'string' || title_es.trim().length === 0) {
      return NextResponse.json({ error: 'title_es is required' }, { status: 400 });
    }

    const iconName = icon || 'HelpCircle';
    if (!ALLOWED_ICONS.includes(iconName)) {
      return NextResponse.json({ error: `invalid icon. Allowed: ${ALLOWED_ICONS.join(', ')}` }, { status: 400 });
    }

    const data = await readData();

    const newTopic: HelpTopic = {
      id: generateId('topic'),
      icon: iconName,
      title_es: title_es.trim(),
      title_pt: (title_pt || title_es).trim(),
      description_es: '',
      description_pt: '',
      order: data.topics.length,
      steps: [],
    };

    data.topics.push(newTopic);
    await writeData(data);

    return NextResponse.json(newTopic, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Invalid request body', message: error.message }, { status: 400 });
  }
}
