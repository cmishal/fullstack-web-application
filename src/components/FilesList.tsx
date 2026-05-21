'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Upload, File, Download, Trash2, Loader2, FolderOpen, Eye, Sparkles } from 'lucide-react'

interface Attachment {
  id: string
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  created_at: string
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function FilesList() {
  const [files, setFiles] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchFiles()
  }, [])

  async function fetchFiles() {
    const { data, error } = await supabase
      .from('attachments')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching files:', error)
    } else {
      setFiles(data || [])
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      const file = e.target.files?.[0]
      if (!file) return

      setUploading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be logged in to upload files')

      // 1. Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 2. Save metadata to 'attachments' table
      const { error: dbError } = await supabase.from('attachments').insert({
        user_id: user.id,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
      })

      if (dbError) throw dbError

      await fetchFiles()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleDownload(filePath: string) {
    const { data, error } = await supabase.storage
      .from('documents')
      .download(filePath)

    if (error) {
      alert(error.message)
      return
    }

    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = filePath.split('/').pop() || 'download'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleView(filePath: string) {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 60)

      if (error) throw error

      window.open(data.signedUrl, '_blank')
    } catch (error: any) {
      alert(error.message)
    }
  }

  async function handleDelete(id: string, filePath: string) {
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filePath])

      if (storageError) throw storageError

      const { error: dbError } = await supabase
        .from('attachments')
        .delete()
        .eq('id', id)

      if (dbError) throw dbError

      await fetchFiles()
    } catch (error: any) {
      alert(error.message)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">Documents</h1>
          <p className="text-[var(--text-muted)] mt-1">Securely store and manage your important files.</p>
        </div>
      </div>

      {/* Upload Zone */}
      <div 
        className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden ${
          dragOver 
            ? 'border-indigo-500 bg-indigo-500/5 shadow-lg shadow-indigo-500/10' 
            : 'border-[var(--border-primary)] bg-[var(--bg-surface)] hover:border-indigo-500/30'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false) }}
      >
        <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
            uploading 
              ? 'bg-indigo-500/10 text-indigo-400' 
              : dragOver
                ? 'bg-indigo-500/20 text-indigo-400 scale-110'
                : 'bg-[var(--bg-primary)] text-[var(--text-muted)]'
          }`}>
            {uploading ? <Loader2 size={32} className="animate-spin" /> : <Upload size={32} />}
          </div>
          <div>
            <p className="text-lg font-semibold text-[var(--text-primary)]">
              {uploading ? 'Uploading file...' : dragOver ? 'Drop your file here' : 'Upload your documents'}
            </p>
            <p className="text-[var(--text-muted)] text-sm mt-1">PDF, DOCX, JPG, PNG up to 5MB</p>
          </div>
          <input 
            type="file" 
            id="file-upload" 
            className="hidden" 
            onChange={handleUpload}
            disabled={uploading}
          />
          <label 
            htmlFor="file-upload"
            className={`px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg text-sm ${
              uploading 
                ? 'bg-[var(--bg-primary)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border-primary)]' 
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 cursor-pointer shadow-indigo-500/20 active:scale-[0.98]'
            }`}
          >
            {uploading ? 'Processing...' : 'Select File'}
          </label>
        </div>
      </div>

      {/* Files List */}
      <div className="space-y-4">
        {files.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-[var(--text-muted)] space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)] flex items-center justify-center">
              <FolderOpen size={32} strokeWidth={1} className="text-[var(--text-muted)]" />
            </div>
            <p className="text-lg font-medium text-[var(--text-secondary)]">No documents uploaded yet</p>
            <p className="text-sm">Drop files above or click to browse</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)] overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-primary)]/50">
                    <th className="px-6 py-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Size</th>
                    <th className="px-6 py-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-primary)]">
                  {files.map((file) => (
                    <tr key={file.id} className="hover:bg-[var(--bg-hover)] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <File size={18} className="text-[var(--text-muted)] flex-shrink-0" />
                          <span className="font-medium text-sm text-[var(--text-primary)] truncate max-w-[300px]">
                            {file.file_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                        {formatFileSize(file.file_size)}
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--text-secondary)]" suppressHydrationWarning>
                        {new Date(file.created_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button 
                            onClick={() => handleView(file.file_path)}
                            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            onClick={() => handleDownload(file.file_path)}
                            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                            title="Download"
                          >
                            <Download size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(file.id, file.file_path)}
                            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden space-y-3">
              {files.map((file) => (
                <div key={file.id} className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)] p-4 space-y-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <File size={20} className="text-[var(--text-muted)] flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{file.file_name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{formatFileSize(file.file_size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-primary)]">
                    <button 
                      onClick={() => handleView(file.file_path)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                    >
                      View
                    </button>
                    <button 
                      onClick={() => handleDownload(file.file_path)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                    >
                      Download
                    </button>
                    <button 
                      onClick={() => handleDelete(file.id, file.file_path)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* File count */}
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <Sparkles size={12} />
              <span>{files.length} document{files.length !== 1 ? 's' : ''} stored securely</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
