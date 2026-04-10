'use client'

import React from 'react'
import { Search, Bell, Command } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'

export function Topbar() {
  return (
    <header className="h-14 border-b border-border-subtle bg-bg-base flex items-center px-4 justify-between sticky top-0 z-20">
      {/* Breadcrumbs Placeholder */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-text-secondary">Workspace</span>
        <span className="text-text-tertiary">/</span>
        <span className="text-sm font-semibold text-text-primary">Dashboard</span>
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-3">
        {/* Cmd+K Search Search Trigger */}
        <div className="hidden md:flex items-center bg-bg-surface border border-border-subtle rounded-md px-2 py-1 gap-4 cursor-pointer hover:border-border-default transition-colors">
          <div className="flex items-center gap-2 text-text-tertiary">
            <Search size={14} />
            <span className="text-xs font-medium">Search or jump to...</span>
          </div>
          <div className="flex items-center gap-0.5 opacity-60">
            <Kbd>
              <Command size={10} className="inline-block" />
              <span>K</span>
            </Kbd>
          </div>
        </div>

        <Button variant="ghost" size="sm" className="relative p-2">
          <Bell size={18} className="text-text-secondary" />
          <div className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border-2 border-bg-base" />
        </Button>

        {/* User Button Placeholder */}
        <div className="w-8 h-8 rounded-full bg-accent-muted border border-accent/20 flex items-center justify-center text-accent text-xs font-bold cursor-pointer hover:scale-105 transition-transform">
          MP
        </div>
      </div>
    </header>
  )
}
