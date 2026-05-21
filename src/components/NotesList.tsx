'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Trash2, Plus, FileText, Sparkles } from 'lucide-react'

interface Note {
  id: string
  title: string
  content: string
  created_at: string
}

export default function NotesList({ initialNotes }: { initialNotes: Note[] }) {
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase
      .from('notes')
      .insert({ title, content })
      .select()

    if (error) {
      alert(error.message)
    } else if (data) {
      setNotes([...notes, ...data])
      setTitle('')
      setContent('')
    }
    setLoading(false)
  }

  const deleteNote = async (id: string) => {
    const { error } = await supabase.from('notes').delete().eq('id', id)
    if (error) {
      alert(error.message)
    } else {
      setNotes(notes.filter((n) => n.id !== id))
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">My Notes</h1>
          <p className="text-[var(--text-muted)] mt-1">Capture your thoughts and ideas quickly.</p>
        </div>
      </div>

      {/* New Note Form */}
      <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)] overflow-hidden">
        <form onSubmit={addNote} className="space-y-0">
          <input
            type="text"
            placeholder="Note Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-6 pt-6 pb-3 text-lg font-medium bg-transparent border-b border-[var(--border-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-indigo-500/50 transition-colors"
            required
          />
          <textarea
            placeholder="Write your note here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-6 py-4 text-sm text-[var(--text-secondary)] bg-transparent outline-none resize-none min-h-[120px] placeholder-[var(--text-muted)]"
          />
          <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-primary)] bg-[var(--bg-primary)]/50">
            <p className="text-xs text-[var(--text-muted)]">
              <Sparkles size={12} className="inline mr-1" />
              Markdown supported
            </p>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
            >
              <Plus size={16} />
              {loading ? 'Saving...' : 'Add Note'}
            </button>
          </div>
        </form>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {notes.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-[var(--text-muted)] space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)] flex items-center justify-center">
              <FileText size={32} strokeWidth={1} className="text-[var(--text-muted)]" />
            </div>
            <p className="text-lg font-medium text-[var(--text-secondary)]">No notes yet</p>
            <p className="text-sm">Start by creating one above!</p>
          </div>
        ) : (
          notes.map((note) => (
            <div 
              key={note.id} 
              className="group relative rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)] hover:border-indigo-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 overflow-hidden"
            >
              {/* Accent bar */}
              <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="p-5 sm:p-6">
                <h3 className="text-base font-bold text-[var(--text-primary)] mb-2 line-clamp-1">{note.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap line-clamp-4">
                  {note.content}
                </p>
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-[var(--border-primary)]">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)]" suppressHydrationWarning>
                    {new Date(note.created_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="p-2 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                    title="Delete note"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
