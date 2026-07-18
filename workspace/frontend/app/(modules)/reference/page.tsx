'use client';

import { useState, useEffect, useCallback } from 'react';

interface Note {
  id: string;
  title: string;
  content: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export default function ReferenceNotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/reference/notes');
      if (!res.ok) throw new Error(`Failed to fetch notes: ${res.status}`);
      const data: Note[] = await res.json();
      setNotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setError('');
    try {
      const res = await fetch('/api/reference/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      });
      if (!res.ok) throw new Error(`Failed to create note: ${res.status}`);
      setTitle('');
      setContent('');
      await fetchNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Notes</h1>

      <form onSubmit={handleCreate} className="mb-8 space-y-3 max-w-md">
        <input
          type="text"
          placeholder="Note title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          aria-label="Note title"
        />
        <textarea
          placeholder="Note content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          rows={3}
          aria-label="Note content"
        />
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Create Note
        </button>
      </form>

      {error && (
        <p className="text-sm text-red-500 mb-4" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading notes...</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notes yet.</p>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="rounded-lg border border-border bg-card p-4"
            >
              <h3 className="font-medium text-foreground">{note.title}</h3>
              {note.content && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {note.content}
                </p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                Created: {new Date(note.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
