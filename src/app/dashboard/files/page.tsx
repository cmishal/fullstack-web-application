import { createClient } from '@/utils/supabase/server'
import FilesList from '@/components/FilesList'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'

export const dynamic = 'force-dynamic'

export default async function FilesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <DashboardLayout>
      <FilesList />
    </DashboardLayout>
  )
}
