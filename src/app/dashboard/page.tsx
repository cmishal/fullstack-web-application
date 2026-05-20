import { createClient } from '@/utils/supabase/server'
import NotesList from '@/components/NotesList'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: notes, error } = await supabase
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return <div className="p-6 text-red-500">Error loading notes: {error.message}</div>
  }

  return (
    <DashboardLayout>
      <NotesList initialNotes={notes || []} />
    </DashboardLayout>
  )
}
