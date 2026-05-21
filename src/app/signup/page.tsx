'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Mail, Lock, UserPlus, Sparkles, ArrowLeft } from 'lucide-react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'error' | 'success'>('error')
  const [emailSent, setEmailSent] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setMessage(error.message)
      setMessageType('error')
    } else {
      setEmailSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md space-y-8 relative">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-2xl shadow-xl shadow-indigo-500/20 mb-4">
            S
          </div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Create Account</h1>
          <p className="text-[var(--text-muted)]">Join SecureNote and keep your data safe</p>
        </div>

        {/* Auth Card */}
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute -inset-[1px] bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-3xl blur-sm" />
          
          <div className="relative bg-[var(--bg-surface)] backdrop-blur-xl p-8 rounded-3xl border border-[var(--border-primary)] space-y-6 shadow-2xl">
            {emailSent ? (
              /* ── Confirmation Sent Screen ── */
              <div className="text-center space-y-6 py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10">
                  <Mail className="text-emerald-400" size={28} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">Check Your Email</h2>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    We&apos;ve sent a confirmation link to{' '}
                    <span className="font-medium text-[var(--text-primary)]">{email}</span>
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Click the link in the email to verify your account and get started.
                  </p>
                </div>
                <a
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                  <ArrowLeft size={14} />
                  Back to Sign In
                </a>
              </div>
            ) : (
              /* ── Signup Form ── */
              <>
                <form onSubmit={handleSignup} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--text-secondary)] ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none transition-all text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                        placeholder="name@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--text-secondary)] ml-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none transition-all text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-500 hover:to-purple-500 active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <UserPlus size={18} />
                        Sign Up
                      </>
                    )}
                  </button>
                </form>

                {message && (
                  <div className={`p-3 rounded-xl text-sm text-center font-medium border ${
                    messageType === 'error' 
                      ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {message}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <p className="text-center text-[var(--text-secondary)] text-sm">
          Already have an account?{' '}
          <a href="/login" className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">Log in</a>
        </p>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
          <Sparkles size={12} />
          <span>End-to-end encrypted workspace</span>
        </div>
      </div>
    </div>
  )
}
