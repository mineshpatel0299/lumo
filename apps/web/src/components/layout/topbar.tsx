'use client'

import React from 'react'
import { Search, Bell, Command } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
import { UserButton } from '@clerk/nextjs'
import { CreateIssueModal } from '../modals/create-issue-modal'
import { SummaryPanel } from '../dashboard/summary-panel'
import { SearchModal } from '../modals/search-modal'

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
        <SearchModal />

        <CreateIssueModal />
        <SummaryPanel />

        <Button variant="ghost" size="sm" className="relative p-2">
          <Bell size={18} className="text-text-secondary" />
          <div className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border-2 border-bg-base" />
        </Button>

        <UserButton 
          afterSignOutUrl="/sign-in"
          appearance={{
            elements: {
              userButtonAvatarBox: "w-8 h-8 hover:scale-105 transition-transform",
              userButtonPopoverCard: "bg-bg-surface border border-border-subtle shadow-2xl",
              userButtonPopoverActionButton: "hover:bg-bg-elevated text-text-primary",
              userButtonPopoverActionButtonText: "text-text-primary",
              userButtonPopoverFooter: "hidden"
            }
          }}
        />
      </div>
    </header>
  )
}
