import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // Create a Supabase client from the request cookies to verify the user
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            const cookieHeader = request.headers.get('cookie') || ''
            return cookieHeader.split(';').filter(Boolean).map((c) => {
              const [name, ...rest] = c.trim().split('=')
              return { name, value: rest.join('=') }
            })
          },
          setAll() {
            // Not needed for this route
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create an admin client with the service role key to perform deletions
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server configuration error. SUPABASE_SERVICE_ROLE_KEY not set.' },
        { status: 500 }
      )
    }

    const adminClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        cookies: {
          getAll: () => [],
          setAll: () => {},
        },
      }
    )

    // 1. Delete files from the documents bucket
    const { data: attachments } = await adminClient
      .from('attachments')
      .select('file_path')
      .eq('user_id', user.id)

    if (attachments && attachments.length > 0) {
      const filePaths = attachments.map((a) => a.file_path)
      await adminClient.storage.from('documents').remove(filePaths)
    }

    // 2. Delete avatar(s) from the avatars bucket — list then remove all
    const { data: avatarFiles } = await adminClient.storage
      .from('avatars')
      .list(user.id, { limit: 100 })

    if (avatarFiles && avatarFiles.length > 0) {
      const avatarPaths = avatarFiles.map((f) => `${user.id}/${f.name}`)
      await adminClient.storage.from('avatars').remove(avatarPaths)
    }

    // 3. Delete user's data from tables
    await adminClient.from('notes').delete().eq('user_id', user.id)
    await adminClient.from('attachments').delete().eq('user_id', user.id)
    await adminClient.from('profiles').delete().eq('id', user.id)

    // 4. Delete the auth user (this will cascade to remaining records)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)
    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete account error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete account' },
      { status: 500 }
    )
  }
}
