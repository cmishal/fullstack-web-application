'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  FileText, 
  FolderOpen, 
  LogOut, 
  User,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [pathname])

  // Body scroll lock when mobile sidebar is open
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileSidebarOpen])

  const menuItems = [
    { name: 'Notes', href: '/dashboard', icon: FileText },
    { name: 'Documents', href: '/dashboard/files', icon: FolderOpen },
    { name: 'Profile', href: '/dashboard/profile', icon: User },
  ]

  const SidebarContent = ({ collapsed }: { collapsed: boolean }) => (
    <>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 ${collapsed ? 'justify-center py-6' : 'px-6 py-6'}`}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/20 flex-shrink-0">
          S
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-[var(--text-primary)]">SecureNote</span>
            <span className="text-[10px] text-[var(--text-muted)] tracking-wider uppercase font-medium">Workspace</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 mt-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-indigo-500/10 text-indigo-400 shadow-sm' 
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.name : undefined}
            >
              <Icon size={20} className={isActive ? 'text-indigo-400' : ''} />
              {!collapsed && <span className="font-medium text-sm">{item.name}</span>}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-5 rounded-full bg-indigo-400" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className={`p-3 border-t border-[var(--border-primary)] space-y-2 ${collapsed ? 'flex flex-col items-center' : ''}`}>
        <button 
          onClick={handleSignOut}
          className={`flex items-center gap-3 px-3 py-2.5 w-full text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all duration-200 group ${
            collapsed ? 'justify-center' : ''
          }`}
          title="Sign Out"
        >
          <LogOut size={20} />
          {!collapsed && <span className="font-medium text-sm">Sign Out</span>}
        </button>

        {!collapsed && (
          <div className="px-3 py-3 rounded-xl bg-gradient-to-r from-indigo-500/5 to-purple-500/5 border border-indigo-500/10">
            <div className="flex items-start gap-2">
              <Sparkles size={14} className="text-indigo-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Your workspace is secure and encrypted.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* ── Desktop Sidebar ── */}
      <aside 
        className={`hidden lg:flex flex-col border-r border-[var(--border-primary)] bg-[var(--bg-secondary)] transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        <SidebarContent collapsed={sidebarCollapsed} />
        
        {/* Collapse Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute bottom-20 -right-3 w-6 h-6 rounded-full border border-[var(--border-primary)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center shadow-md transition-all hidden lg:flex"
        >
          {sidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* ── Mobile Sidebar Overlay ── */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ── Mobile Sidebar Drawer ── */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col border-r border-[var(--border-primary)] bg-[var(--bg-secondary)] lg:hidden transition-transform duration-300 ease-in-out ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border-primary)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/20">
              S
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-[var(--text-primary)]">SecureNote</span>
              <span className="text-[10px] text-[var(--text-muted)] tracking-wider uppercase font-medium block">Workspace</span>
            </div>
          </div>
          <button 
            onClick={() => setMobileSidebarOpen(false)}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
          >
            <X size={20} />
          </button>
        </div>
        <SidebarContent collapsed={false} />
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 lg:h-18 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]/50 backdrop-blur-xl flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
            >
              <Menu size={20} />
            </button>
            
            {/* Desktop breadcrumb-style indicator */}
            <div className="hidden lg:flex items-center gap-2 text-sm">
              <span className="text-[var(--text-muted)]">
                {pathname === '/dashboard' ? 'Notes' : 
                 pathname === '/dashboard/files' ? 'Documents' : 
                 pathname === '/dashboard/profile' ? 'Profile' : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-primary)]">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse" />
              <span className="text-xs text-[var(--text-secondary)] font-medium">Secure</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-[var(--border-primary)] flex items-center justify-center text-sm font-semibold text-indigo-400">
              U
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
