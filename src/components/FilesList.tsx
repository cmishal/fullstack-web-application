'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Upload, File, Download, Trash2, Loader2, FolderOpen, Eye } from 'lucide-react'

interface Attachment {
  id: string
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  created_at: string
}

export default function FilesList() {
  const [files, setFiles] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)
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
        .createSignedUrl(filePath, 60) // URL valid for 60 seconds

      if (error) throw error

      window.open(data.signedUrl, '_blank')
    } catch (error: any) {
      alert(error.message)
    }
  }

  async function handleDelete(id: string, filePath: string) {
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      // 1. Delete from Storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filePath])

      if (storageError) throw storageError

      // 2. Delete from DB
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Documents</h1>
          <p className="text-slate-500">Securely store and manage your important files.</p>
        </div>
      </div>

      <div className="p-12 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center bg-white text-center space-y-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${uploading ? 'bg-blue-100 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
          {uploading ? <Loader2 size={32} className="animate-spin" /> : <Upload size={32} />}
        </div>
        <div>
          <p className="text-lg font-semibold">{uploading ? 'Uploading file...' : 'Upload your documents'}</p>
          <p className="text-slate-500 text-sm">PDF, DOCX, JPG, PNG up to 5MB</p>
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
          className={`px-6 py-2 rounded-xl font-medium transition-all shadow-md ${
            uploading 
              ? 'bg-slate-200 text-slate-500 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer shadow-blue-200'
          }`}
        >
          {uploading ? 'Processing...' : 'Select File'}
        </label>
      </div>

      <div className="grid gap-4">
        {files.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-4">
            <FolderOpen size={48} strokeWidth={1} />
            <p className="text-lg">No documents uploaded yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 font-semibold">Name</th>
                  <th className="px-6 py-3 font-semibold">Size</th>
                  <th className="px-6 py-3 font-semibold">Date</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {files.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <File size={18} className="text-slate-400" />
                        <span className="font-medium text-slate-700">{file.file_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {(file.file_size / 1024).toFixed(1)} KB
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      <span suppressHydrationWarning>
                        {new Date(file.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleView(file.file_path)}
                          className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-all"
                          title="View File"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => handleDownload(file.file_path)}
                          className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-all"
                        >
                          <Download size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(file.id, file.file_path)}
                          className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
