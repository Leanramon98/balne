import { NextRequest, NextResponse } from 'next/server';
import {
  readData,
  writeData,
  isAdminRequest,
  generateId,
  ALLOWED_ICONS,
  type HelpTopic,
  type HelpStep,
} from '../_data';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/help-center/:id — get a single topic */
export async function GET(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const data = await readData();
  const topic = data.topics.find((t) => t.id === id);
  if (!topic) {
    return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
  }
  return NextResponse.json(topic);
}

/** PUT /api/help-center/:id — update topic or its steps (admin only) */
export async function PUT(req: NextRequest, context: RouteContext) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await context.params;
  const data = await readData();
  const index = data.topics.findIndex((t) => t.id === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
  }

  try {
    const body = await req.json();
    const topic = data.topics[index];

    // Allowed fields on topic
    if (body.title_es !== undefined) {
      if (typeof body.title_es !== 'string' || body.title_es.trim().length === 0) {
        return NextResponse.json({ error: 'title_es must be a non-empty string' }, { status: 400 });
      }
      topic.title_es = body.title_es.trim();
    }
    if (body.title_pt !== undefined) {
      topic.title_pt = body.title_pt;
    }
    if (body.description_es !== undefined) {
      topic.description_es = body.description_es;
    }
    if (body.description_pt !== undefined) {
      topic.description_pt = body.description_pt;
    }
    if (body.icon !== undefined) {
      if (!ALLOWED_ICONS.includes(body.icon)) {
        return NextResponse.json({ error: `invalid icon. Allowed: ${ALLOWED_ICONS.join(', ')}` }, { status: 400 });
      }
      topic.icon = body.icon;
    }
    if (body.order !== undefined) {
      topic.order = body.order;
    }

    // Full steps replacement
    if (body.steps !== undefined) {
      if (!Array.isArray(body.steps)) {
        return NextResponse.json({ error: 'steps must be an array' }, { status: 400 });
      }
      topic.steps = body.steps.map((s: any, idx: number) => ({
        id: s.id || generateId('step'),
        title_es: s.title_es || '',
        title_pt: s.title_pt || '',
        description_es: s.description_es || '',
        description_pt: s.description_pt || '',
        image: s.image || undefined,
        tip_es: s.tip_es || undefined,
        tip_pt: s.tip_pt || undefined,
        order: s.order ?? idx,
      }));
    }

    // Individual step operations
    if (body.addStep !== undefined) {
      const { title_es, title_pt } = body.addStep;
      const newStep: HelpStep = {
        id: generateId('step'),
        title_es: title_es || 'Nuevo paso',
        title_pt: title_pt || title_es || 'Novo passo',
        description_es: '',
        description_pt: '',
        order: topic.steps.length,
      };
      topic.steps.push(newStep);
    }

    if (body.deleteStepId !== undefined) {
      topic.steps = topic.steps.filter((s) => s.id !== body.deleteStepId);
      // Re-index orders
      topic.steps.forEach((s, idx) => { s.order = idx; });
    }

    if (body.updateStep !== undefined) {
      const { stepId, ...fields } = body.updateStep;
      const step = topic.steps.find((s) => s.id === stepId);
      if (step) {
        if (fields.title_es !== undefined) step.title_es = fields.title_es;
        if (fields.title_pt !== undefined) step.title_pt = fields.title_pt;
        if (fields.description_es !== undefined) step.description_es = fields.description_es;
        if (fields.description_pt !== undefined) step.description_pt = fields.description_pt;
        if (fields.tip_es !== undefined) step.tip_es = fields.tip_es || undefined;
        if (fields.tip_pt !== undefined) step.tip_pt = fields.tip_pt || undefined;
        if (fields.image !== undefined) step.image = fields.image || undefined;
        if (fields.order !== undefined) step.order = fields.order;
      }
    }

    // Reorder steps
    if (body.reorderSteps !== undefined && Array.isArray(body.reorderSteps)) {
      topic.steps = body.reorderSteps.map((stepId: string, idx: number) => {
        const existing = topic.steps.find((s) => s.id === stepId);
        if (existing) {
          existing.order = idx;
          return existing;
        }
        return null;
      }).filter(Boolean) as HelpStep[];
    }

    await writeData(data);
    return NextResponse.json(topic);
  } catch (error: any) {
    return NextResponse.json({ error: 'Invalid request body', message: error.message }, { status: 400 });
  }
}

/** DELETE /api/help-center/:id — delete a topic (admin only) */
export async function DELETE(req: NextRequest, context: RouteContext) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await context.params;
  const data = await readData();
  const index = data.topics.findIndex((t) => t.id === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
  }

  data.topics.splice(index, 1);
  // Re-index orders
  data.topics.forEach((t, idx) => { t.order = idx; });
  await writeData(data);

  return NextResponse.json({ success: true });
}
