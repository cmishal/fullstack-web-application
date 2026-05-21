'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Mail, Lock, LogIn, Globe, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        setMessage('Please confirm your email address first. Check your inbox for the confirmation link, or sign up again to resend it.')
      } else {
        setMessage(error.message)
      }
    } else {
      router.push('/dashboard')
      router.refresh()
    }
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
    }
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
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Welcome Back</h1>
          <p className="text-[var(--text-muted)]">Sign in to access your secure workspace</p>
        </div>

        {/* Auth Card */}
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute -inset-[1px] bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-3xl blur-sm" />
          
          <div className="relative bg-[var(--bg-surface)] backdrop-blur-xl p-8 rounded-3xl border border-[var(--border-primary)] space-y-6 shadow-2xl">
            <form onSubmit={handleLogin} className="space-y-5">
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
                    <LogIn size={18} />
                    Sign In
                  </>
                )}
              </button>
            </form>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border-primary)]"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[var(--bg-surface)] px-3 text-[var(--text-muted)] font-medium">Or continue with</span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-3 bg-[var(--bg-primary)] text-[var(--text-primary)] font-medium border border-[var(--border-primary)] rounded-xl hover:bg-[var(--bg-hover)] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <Globe size={18} className="text-indigo-400" />
              Google Account
            </button>

            {message && (
              <div className="p-3 rounded-xl bg-red-500/10 text-red-400 text-sm text-center font-medium border border-red-500/20">
                {message}
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-[var(--text-secondary)] text-sm">
          Don&apos;t have an account?{' '}
          <a href="/signup" className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">Create account</a>
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
