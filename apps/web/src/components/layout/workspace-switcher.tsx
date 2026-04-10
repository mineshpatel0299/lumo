'use client'

import React from 'react'
import { Check, ChevronsUpDown, Plus, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useWorkspaceStore } from '@/store/workspace.store'
import { useRouter } from 'next/navigation'

export function WorkspaceSwitcher() {
  const router = useRouter()
  const { currentWorkspace, workspaces, setCurrentWorkspace } = useWorkspaceStore()

  return (
    <div className="px-2 py-3">
      <Select 
        value={currentWorkspace?.id || ""} 
        onValueChange={(val) => {
          if (val === "create-new") {
            router.push('/onboarding')
            return
          }
          const ws = workspaces.find(w => w.id === val)
          if (ws) setCurrentWorkspace(ws)
        }}
      >
        <SelectTrigger className="w-full bg-bg-elevated/50 border-border-subtle hover:bg-bg-elevated transition-colors h-10 px-3 ring-offset-bg-base focus:ring-accent">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-5 h-5 bg-accent rounded flex items-center justify-center text-[10px] font-bold text-white shrink-0">
              {currentWorkspace?.name?.[0] || <LayoutGrid size={12} />}
            </div>
            <span className="truncate text-sm font-medium text-text-primary">
              {currentWorkspace?.name || "Select Workspace"}
            </span>
          </div>
        </SelectTrigger>
        <SelectContent className="bg-bg-surface border-border-subtle shadow-2xl">
          {workspaces.map((ws) => (
            <SelectItem 
              key={ws.id} 
              value={ws.id}
              className="hover:bg-bg-elevated focus:bg-bg-elevated"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-accent/20 rounded flex items-center justify-center text-[10px] font-bold text-accent">
                  {ws.name[0]}
                </div>
                <span className="text-sm font-medium">{ws.name}</span>
              </div>
            </SelectItem>
          ))}
          <div className="h-px bg-border-subtle my-1" />
          <SelectItem 
            value="create-new"
            className="text-accent font-medium hover:bg-accent/5 focus:bg-accent/5"
          >
            <div className="flex items-center gap-2">
              <Plus size={14} />
              <span>Create Workspace</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
