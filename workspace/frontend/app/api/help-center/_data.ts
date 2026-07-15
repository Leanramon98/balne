/**
 * Shared helpers for help-center API routes.
 * Reads/writes a JSON file in data/ — no backend dependency.
 */
import { NextRequest } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'help-center.json');

export interface HelpStep {
  id: string;
  title_es: string;
  title_pt: string;
  description_es: string;
  description_pt: string;
  image?: string;
  tip_es?: string;
  tip_pt?: string;
  order: number;
}

export interface HelpTopic {
  id: string;
  icon: string;
  title_es: string;
  title_pt: string;
  description_es: string;
  description_pt: string;
  order: number;
  steps: HelpStep[];
}

export interface HelpCenterData {
  topics: HelpTopic[];
}

/** Reads the JSON data file (creates default if missing). */
export async function readData(): Promise<HelpCenterData> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw) as HelpCenterData;
  } catch {
    // If file doesn't exist, return empty
    return { topics: [] };
  }
}

/** Writes data to the JSON file. */
export async function writeData(data: HelpCenterData): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

/** Verifies the request has a valid admin JWT. */
export function isAdminRequest(req: NextRequest): boolean {
  const token = req.cookies.get('auto_insight_token')?.value;
  if (!token) return false;

  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString('utf-8')
    );
    const roles = payload.roles || (payload.role ? [payload.role] : []);
    return roles.includes('admin');
  } catch {
    return false;
  }
}

/** Generates a short unique id for topics/steps. */
export function generateId(prefix: string): string {
  const rand = Math.random().toString(36).substring(2, 6);
  return `${prefix}-${rand}`;
}

/** Allowed icon names for help topics. */
export const ALLOWED_ICONS = [
  'Home',
  'Activity',
  'ClipboardList',
  'Target',
  'TrendingUp',
  'HelpCircle',
] as const;
