'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import {
  User, Mail, Shield, Save, Loader2,
  Key, Smartphone, Bell,
  Camera, CheckCircle, AlertCircle,
  Eye, EyeOff, ChevronRight,
  X, LogOut, Trash2, Globe,
  Monitor, Lock,
  AlertTriangle
} from 'lucide-react'
import { useRouter } from 'next/navigation'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

function maskEmail(email: string) {
  try {
    const atIndex = email.indexOf('@')
    if (atIndex <= 1) return email
    const visibleStart = email.slice(0, 3)
    const visibleEnd = email.slice(atIndex - 2)
    const stars = '*'.repeat(Math.min(4, atIndex - 3))
    return `${visibleStart}${stars}${visibleEnd}`
  } catch {
    return email
  }
}

function getAvatarUrl(userId: string, avatarUrl: string | null): string | null {
  if (!avatarUrl) return null
  if (avatarUrl.startsWith('http')) return avatarUrl
  return `${SUPABASE_URL}/storage/v1/object/public/avatars/${avatarUrl}`
}

// ─── Modal Wrapper ───────────────────────────────────
function Modal({
  open,
  onClose,
  title,
  icon: Icon,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)] shadow-2xl shadow-black/40 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-primary)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
              <Icon size={18} className="text-indigo-400" />
            </div>
            <h3 className="font-semibold text-[var(--text-primary)]">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState({
    username: '',
    full_name: '',
    email: '',
    avatar_url: null as string | null,
    notification_email: true,
    notification_browser: true,
  })
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'error' | 'success'>('error')
  const [showEmail, setShowEmail] = useState(false)

  // Avatar upload state
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Modal states
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [devicesModalOpen, setDevicesModalOpen] = useState(false)
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  // Password modal state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordUpdating, setPasswordUpdating] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordMessageType, setPasswordMessageType] = useState<'error' | 'success'>('error')

  // Notifications state
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifBrowser, setNotifBrowser] = useState(true)
  const [notifUpdating, setNotifUpdating] = useState(false)
  const [notifMessage, setNotifMessage] = useState('')

  // Delete account state
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Session info
  const [lastSignIn, setLastSignIn] = useState<string>('')
  const [userId, setUserId] = useState<string>('')

  const router = useRouter()

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          router.push('/login')
          return
        }

        setUserId(user.id)
        setLastSignIn(user.last_sign_in_at || '')

        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('username, full_name, avatar_url, notification_email, notification_browser')
          .eq('id', user.id)
          .limit(1)

        if (profileError) {
          console.error('Error fetching profile:', JSON.stringify(profileError, null, 2))
        }

        const profileData = profiles && profiles.length > 0 ? profiles[0] : null

        setProfile({
          username: profileData?.username || '',
          full_name: profileData?.full_name || '',
          email: user.email || '',
          avatar_url: profileData?.avatar_url || null,
          notification_email: profileData?.notification_email ?? true,
          notification_browser: profileData?.notification_browser ?? true,
        })
        setNotifEmail(profileData?.notification_email ?? true)
        setNotifBrowser(profileData?.notification_browser ?? true)
      } catch (error) {
        console.error('Unexpected error loading profile:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [router])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    setMessage('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not found')

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: profile.username,
          full_name: profile.full_name,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error

      setMessage('Profile updated successfully!')
      setMessageType('success')
    } catch (error: any) {
      setMessage(error.message || 'Failed to update profile')
      setMessageType('error')
    } finally {
      setUpdating(false)
    }
  }

  // ─── Avatar Upload ─────────────────────────────────
  const handleAvatarUpload = async (file: File) => {
    if (!userId) return
    setUploadingAvatar(true)

    try {
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()
      const filePath = `${userId}/avatar.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      if (profile.avatar_url && profile.avatar_url !== filePath) {
        await supabase.storage.from('avatars').remove([profile.avatar_url])
      }

      const { error: dbError } = await supabase
        .from('profiles')
        .upsert({ id: userId, avatar_url: filePath, updated_at: new Date().toISOString() })

      if (dbError) throw dbError

      setProfile((prev) => ({ ...prev, avatar_url: filePath }))
    } catch (error: any) {
      alert(error.message || 'Failed to upload avatar')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleAvatarUpload(file)
    e.target.value = ''
  }

  // ─── Change Password ──────────────────────────────
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setPasswordMessage('Passwords do not match')
      setPasswordMessageType('error')
      return
    }
    if (newPassword.length < 6) {
      setPasswordMessage('Password must be at least 6 characters')
      setPasswordMessageType('error')
      return
    }

    setPasswordUpdating(true)
    setPasswordMessage('')

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      setPasswordMessage('Password updated successfully!')
      setPasswordMessageType('success')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      setPasswordMessage(error.message || 'Failed to update password')
      setPasswordMessageType('error')
    } finally {
      setPasswordUpdating(false)
    }
  }

  // ─── Sign Out All Devices ─────────────────────────
  const handleSignOutAllDevices = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut({ scope: 'global' })
      if (error) throw error
      router.push('/login')
    } catch (error: any) {
      alert(error.message || 'Failed to sign out')
    }
  }

  // ─── Notifications ────────────────────────────────
  const handleSaveNotifications = async () => {
    if (!userId) return
    setNotifUpdating(true)
    setNotifMessage('')

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          notification_email: notifEmail,
          notification_browser: notifBrowser,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error

      setProfile((prev) => ({
        ...prev,
        notification_email: notifEmail,
        notification_browser: notifBrowser,
      }))
      setNotifMessage('Preferences saved!')
    } catch (error: any) {
      setNotifMessage(error.message || 'Failed to save')
    } finally {
      setNotifUpdating(false)
    }
  }

  // ─── Delete Account ───────────────────────────────
  const handleDeleteAccount = async () => {
    setDeletingAccount(true)
    setDeleteError('')

    try {
      const res = await fetch('/api/delete-account', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to delete account')

      router.push('/login')
    } catch (error: any) {
      setDeleteError(error.message || 'Failed to delete account')
    } finally {
      setDeletingAccount(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
            <p className="text-[var(--text-muted)] text-sm">Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const avatarSrc = getAvatarUrl(userId, profile.avatar_url)
  const initial = profile.username
    ? profile.username[0].toUpperCase()
    : profile.email[0].toUpperCase()

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">

        {/* ── Hero Header ── */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-indigo-600/10 via-purple-600/5 to-[var(--bg-surface)] border border-[var(--border-primary)] p-6 sm:p-8 lg:p-10">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden shadow-xl shadow-indigo-500/20">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl sm:text-4xl font-bold text-white">{initial}</span>
                )}
              </div>
              {/* Camera button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[var(--bg-elevated)] border-2 border-[var(--bg-surface)] text-[var(--text-muted)] hover:text-indigo-400 hover:border-indigo-500/30 flex items-center justify-center transition-all shadow-md disabled:opacity-50"
              >
                {uploadingAvatar ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Camera size={14} />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
                {profile.full_name || 'Welcome!'}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <Mail size={14} className="text-[var(--text-muted)]" />
                  <span className="font-mono">
                    {showEmail ? profile.email : maskEmail(profile.email)}
                  </span>
                  <button
                    onClick={() => setShowEmail(!showEmail)}
                    className="p-1 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-indigo-400 transition-all"
                    title={showEmail ? 'Hide email' : 'Show email'}
                  >
                    {showEmail ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Active
                </span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="hidden sm:flex items-center gap-6">
              <div className="text-center">
                <div className="text-lg font-bold text-[var(--text-primary)]">Active</div>
                <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium">Status</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main Content Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">

          {/* ── Left Column ── */}
          <div className="lg:col-span-1 space-y-6">

            {/* Account Status Card */}
            <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--border-primary)]">
                <h3 className="font-semibold text-sm text-[var(--text-primary)] flex items-center gap-2">
                  <Shield size={16} className="text-indigo-400" />
                  Account Status
                </h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">Email</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[var(--text-primary)] font-medium truncate max-w-[140px]">
                      {showEmail ? profile.email : maskEmail(profile.email)}
                    </span>
                    <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">Username</span>
                  <span className="text-sm text-[var(--text-primary)] font-medium">
                    @{profile.username || 'not set'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">Status</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                    <span className="text-sm text-emerald-400 font-medium">Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--border-primary)]">
                <h3 className="font-semibold text-sm text-[var(--text-primary)]">Quick Actions</h3>
              </div>
              <div className="divide-y divide-[var(--border-primary)]">
                <button
                  onClick={() => { setPasswordModalOpen(true); setPasswordMessage('') }}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-[var(--bg-hover)] transition-all group"
                >
                  <Key size={16} className="text-[var(--text-muted)] group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)]">Change Password</p>
                    <p className="text-xs text-[var(--text-muted)]">Update your login credentials</p>
                  </div>
                  <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                </button>

                <button
                  onClick={() => setDevicesModalOpen(true)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-[var(--bg-hover)] transition-all group"
                >
                  <Smartphone size={16} className="text-[var(--text-muted)] group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)]">Manage Devices</p>
                    <p className="text-xs text-[var(--text-muted)]">View and manage your sessions</p>
                  </div>
                  <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                </button>

                <button
                  onClick={() => { setNotificationsModalOpen(true); setNotifMessage('') }}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-[var(--bg-hover)] transition-all group"
                >
                  <Bell size={16} className="text-[var(--text-muted)] group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)]">Notifications</p>
                    <p className="text-xs text-[var(--text-muted)]">Configure alert preferences</p>
                  </div>
                  <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="rounded-2xl border border-red-500/20 overflow-hidden">
              <div className="px-5 py-4 bg-red-500/5 border-b border-red-500/10">
                <h3 className="font-semibold text-sm text-red-400 flex items-center gap-2">
                  <AlertCircle size={16} />
                  Danger Zone
                </h3>
              </div>
              <div className="p-5">
                <button
                  onClick={() => { setDeleteModalOpen(true); setDeleteConfirmText(''); setDeleteError('') }}
                  className="w-full py-2.5 rounded-xl text-sm font-medium text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-all"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>

          {/* ── Right Column: Edit Form ── */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)] overflow-hidden">
              <div className="px-5 sm:px-8 py-5 border-b border-[var(--border-primary)]">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">Edit Information</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Update your personal details and how others see you
                </p>
              </div>

              <form onSubmit={handleUpdateProfile} className="p-5 sm:p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--text-secondary)]">Username</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                      <input
                        type="text"
                        value={profile.username}
                        onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none transition-all text-sm"
                        placeholder="johndoe"
                      />
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">Your unique public identifier</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--text-secondary)]">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                      <input
                        type="text"
                        value={profile.full_name}
                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none transition-all text-sm"
                        placeholder="John Doe"
                      />
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">Your display name across the app</p>
                  </div>

                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-[var(--text-secondary)]">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                      <input
                        type="email"
                        value={profile.email}
                        readOnly
                        className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-muted)] cursor-not-allowed text-sm"
                      />
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">Email cannot be changed. Contact support for updates.</p>
                  </div>
                </div>

                {message && (
                  <div className={`p-4 rounded-xl text-sm font-medium flex items-start gap-3 ${
                    messageType === 'error'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {messageType === 'error'
                      ? <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                      : <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
                    }
                    {message}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-[var(--text-muted)]">Changes are saved immediately</p>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-indigo-500 hover:to-purple-500 active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updating ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                    ) : (
                      <><Save size={16} /> Save Changes</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          MODALS
         ═══════════════════════════════════════════════ */}

      {/* ── Change Password Modal ── */}
      <Modal open={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} title="Change Password" icon={Key}>
        <form onSubmit={handleChangePassword} className="space-y-5">
          <p className="text-sm text-[var(--text-secondary)]">
            Enter your new password below. Make sure it&apos;s at least 6 characters.
          </p>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">New Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none transition-all text-sm"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Confirm Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none transition-all text-sm"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          {passwordMessage && (
            <div className={`p-3 rounded-xl text-sm font-medium flex items-start gap-2 ${
              passwordMessageType === 'error'
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              {passwordMessageType === 'error'
                ? <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                : <CheckCircle size={14} className="mt-0.5 flex-shrink-0" />
              }
              {passwordMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={passwordUpdating || !newPassword || !confirmPassword}
            className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-indigo-500 hover:to-purple-500 active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {passwordUpdating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</>
            ) : (
              <><Key size={16} /> Update Password</>
            )}
          </button>
        </form>
      </Modal>

      {/* ── Manage Devices Modal ── */}
      <Modal open={devicesModalOpen} onClose={() => setDevicesModalOpen(false)} title="Manage Devices" icon={Smartphone}>
        <div className="space-y-5">
          <p className="text-sm text-[var(--text-secondary)]">
            You are currently signed in on this device. Use the button below to sign out of all other sessions.
          </p>

          {/* Current device card */}
          <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                <Monitor size={20} className="text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)]">Current Session</p>
                {lastSignIn && (
                  <p className="text-xs text-[var(--text-muted)]">
                    Last active: {new Date(lastSignIn).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Active
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <div className="flex items-start gap-3">
              <AlertTriangle size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-400">Sign out everywhere</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  This will sign you out of ALL devices, including this one. You will need to log in again.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleSignOutAllDevices}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            Sign Out All Devices
          </button>
        </div>
      </Modal>

      {/* ── Notifications Modal ── */}
      <Modal open={notificationsModalOpen} onClose={() => setNotificationsModalOpen(false)} title="Notifications" icon={Bell}>
        <div className="space-y-5">
          <p className="text-sm text-[var(--text-secondary)]">
            Choose how you want to receive notifications.
          </p>

          {/* Email toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <Mail size={16} className="text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Email Notifications</p>
                <p className="text-xs text-[var(--text-muted)]">Receive updates via email</p>
              </div>
            </div>
            <button
              onClick={() => setNotifEmail(!notifEmail)}
              className={`relative w-11 h-6 rounded-full transition-all duration-200 ${
                notifEmail ? 'bg-indigo-500' : 'bg-[var(--border-primary)]'
              }`}
            >
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                notifEmail ? 'translate-x-5' : ''
              }`} />
            </button>
          </div>

          {/* Browser toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Globe size={16} className="text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Browser Notifications</p>
                <p className="text-xs text-[var(--text-muted)]">Get alerts in your browser</p>
              </div>
            </div>
            <button
              onClick={() => setNotifBrowser(!notifBrowser)}
              className={`relative w-11 h-6 rounded-full transition-all duration-200 ${
                notifBrowser ? 'bg-indigo-500' : 'bg-[var(--border-primary)]'
              }`}
            >
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                notifBrowser ? 'translate-x-5' : ''
              }`} />
            </button>
          </div>

          {notifMessage && (
            <div className={`p-3 rounded-xl text-sm font-medium ${
              notifMessage === 'Preferences saved!'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {notifMessage}
            </div>
          )}

          <button
            onClick={handleSaveNotifications}
            disabled={notifUpdating}
            className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-indigo-500 hover:to-purple-500 active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {notifUpdating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : (
              <><Bell size={16} /> Save Preferences</>
            )}
          </button>
        </div>
      </Modal>

      {/* ── Delete Account Modal ── */}
      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Account" icon={Trash2}>
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-400">This action is permanent</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  All your notes, files, and personal data will be deleted. This cannot be undone.
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm text-[var(--text-secondary)]">
            Type <strong className="text-red-400">DELETE</strong> to confirm:
          </p>

          <input
            type="text"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="Type DELETE to confirm"
            className="w-full px-4 py-2.5 bg-[var(--bg-primary)] border border-red-500/30 rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 outline-none transition-all text-sm"
          />

          {deleteError && (
            <div className="p-3 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 flex items-start gap-2">
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
              {deleteError}
            </div>
          )}

          <button
            onClick={handleDeleteAccount}
            disabled={deleteConfirmText !== 'DELETE' || deletingAccount}
            className="w-full py-2.5 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 active:scale-[0.98] text-white transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-red-500 shadow-lg shadow-red-500/20"
          >
            {deletingAccount ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Deleting Account...</>
            ) : (
              <><Trash2 size={16} /> Permanently Delete My Account</>
            )}
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
