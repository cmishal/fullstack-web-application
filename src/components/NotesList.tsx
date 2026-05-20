'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Trash2, Plus, FileText } from 'lucide-react'

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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Notes</h1>
          <p className="text-slate-500">Capture your thoughts and ideas quickly.</p>
        </div>
      </div>

      <form onSubmit={addNote} className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="grid gap-4">
          <input
            type="text"
            placeholder="Note Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 text-lg font-medium border-b border-slate-100 focus:border-blue-500 outline-none transition-colors bg-transparent"
            required
          />
          <textarea
            placeholder="Write your note here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-0 py-2 text-slate-600 outline-none resize-none min-h-[120px] bg-transparent"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:bg-blue-300 transition-all shadow-md shadow-blue-200"
          >
            <Plus size={18} />
            {loading ? 'Saving...' : 'Add Note'}
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notes.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 space-y-4">
            <FileText size={48} strokeWidth={1} />
            <p className="text-lg">No notes yet. Start by creating one above!</p>
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between group hover:shadow-md transition-all">
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{note.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{note.content}</p>
<p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mt-6" suppressHydrationWarning>
                    {new Date(note.created_at).toLocaleDateString()}
                  </p>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => deleteNote(note.id)}
                  className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
