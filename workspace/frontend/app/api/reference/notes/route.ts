import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const NOTES_FILE = path.join(process.cwd(), 'app/api/reference/notes/notes.json');

interface Note {
  id: string;
  title: string;
  content: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

function getNotes(): Note[] {
  try {
    if (!fs.existsSync(NOTES_FILE)) {
      // Seed with some initial generic notes
      const initialNotes: Note[] = [
        {
          id: '1',
          title: 'Bienvenido a la Plantilla Base',
          content: 'Esta es una nota de ejemplo almacenada localmente. Podés crear nuevas notas desde este formulario.',
          organization_id: '00000000-0000-0000-0000-000000000000',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      fs.mkdirSync(path.dirname(NOTES_FILE), { recursive: true });
      fs.writeFileSync(NOTES_FILE, JSON.stringify(initialNotes, null, 2), 'utf-8');
      return initialNotes;
    }
    const data = fs.readFileSync(NOTES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading notes:', error);
    return [];
  }
}

function saveNotes(notes: Note[]) {
  try {
    fs.mkdirSync(path.dirname(NOTES_FILE), { recursive: true });
    fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving notes:', error);
  }
}

export async function GET() {
  const notes = getNotes();
  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  try {
    const { title, content } = await req.json();
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const notes = getNotes();
    const newNote: Note = {
      id: crypto.randomUUID(),
      title,
      content: content || '',
      organization_id: '00000000-0000-0000-0000-000000000000',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    notes.push(newNote);
    saveNotes(notes);

    return NextResponse.json(newNote, { status: 201 });
  } catch (error) {
    console.error('Error in POST notes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
