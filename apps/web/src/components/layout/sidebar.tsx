'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  CheckSquare, 
  Inbox, 
  BarChart2, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/ui.store'
import { Button } from '@/components/ui/button'

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'My Issues', icon: CheckSquare, href: '/my-issues' },
  { name: 'Inbox', icon: Inbox, href: '/inbox' },
  { name: 'Analytics', icon: BarChart2, href: '/analytics' },
]

import { UserButton } from '@clerk/nextjs'

export function Sidebar() {
  const pathname = usePathname()
  const { isSidebarCollapsed, setSidebarCollapsed } = useUIStore()

  return (
    <aside 
      className={cn(
        "h-screen bg-bg-surface border-r border-border-subtle flex flex-col transition-all duration-300 ease-smooth z-30",
        isSidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Sidebar Header */}
      <div className="h-14 flex items-center px-4 border-b border-border-subtle justify-between">
        {!isSidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-accent rounded-sm flex items-center justify-center text-white font-bold text-xs">
              L
            </div>
            <span className="font-bold text-sm tracking-tight text-text-primary">Lumo</span>
          </div>
        )}
        <Button 
          variant="ghost" 
          size="sm" 
          className="p-1 h-auto"
          onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
        >
          {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                isActive 
                  ? "bg-accent/10 text-accent" 
                  : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
              )}
            >
              <item.icon size={18} />
              {!isSidebarCollapsed && <span className="text-sm font-medium">{item.name}</span>}
              {isActive && !isSidebarCollapsed && (
                <div className="ml-auto w-1 h-4 bg-accent rounded-full" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Projects Section */}
      {!isSidebarCollapsed && (
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Projects</span>
            <button className="text-text-tertiary hover:text-text-primary transition-colors">
              <Plus size={14} />
            </button>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary cursor-pointer py-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Project A</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary cursor-pointer py-1">
              <div className="w-2 h-2 rounded-full bg-violet-500" />
              <span>Project B</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer Settings */}
      <div className="p-2 border-t border-border-subtle space-y-1">
        <Link 
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors",
            pathname === '/settings' && "bg-bg-elevated text-text-primary"
          )}
        >
          <Settings size={18} />
          {!isSidebarCollapsed && <span className="text-sm font-medium">Settings</span>}
        </Link>
        
        <div className="flex items-center gap-3 px-3 py-2">
          <UserButton 
            afterSignOutUrl="/sign-in"
            appearance={{
              elements: {
                userButtonAvatarBox: "w-6 h-6",
                userButtonPopoverCard: "bg-bg-surface border border-border-subtle shadow-2xl",
                userButtonPopoverActionButton: "hover:bg-bg-elevated text-text-primary",
                userButtonPopoverActionButtonText: "text-text-primary",
                userButtonPopoverFooter: "hidden"
              }
            }}
          />
          {!isSidebarCollapsed && <span className="text-sm font-medium text-text-secondary">My Profile</span>}
        </div>
      </div>
    </aside>
  )
}
