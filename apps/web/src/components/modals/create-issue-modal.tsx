'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2, Sparkles, Hash, AlignLeft, BarChart, Layout } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { useWorkspaceStore } from '@/store/workspace.store'
import { API_URL } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'

export function CreateIssueModal({ onIssueCreated }: { onIssueCreated?: () => void }) {
  const { getToken } = useAuth()
  const { currentWorkspace } = useWorkspaceStore()

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'no_priority'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title) return

    // Guard: workspace must be loaded before we can create an issue
    const project = currentWorkspace?.projects?.[0]
    const status =
      currentWorkspace?.statuses?.find(
        (s) => s.name.toLowerCase() === formData.status.toLowerCase()
      ) ?? currentWorkspace?.statuses?.[0]

    if (!currentWorkspace?.id || !project?.id || !status?.id) {
      setError('Workspace is still loading. Please wait a moment and try again.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const token = await getToken()

      const response = await fetch(API_URL + '/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
          priority: formData.priority,
          workspaceId: currentWorkspace.id,
          projectId: project.id,
          statusId: status.id,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error((data as any).error ?? `Server error ${response.status}`)
      }

      setOpen(false)
      setFormData({ title: '', description: '', status: 'todo', priority: 'no_priority' })
      if (onIssueCreated) onIssueCreated()
    } catch (err: any) {
      console.error('[CreateIssue]', err)
      setError(err.message ?? 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setError(null)
      }}
    >
      <DialogTrigger
        render={
          <Button
            size="sm"
            className="bg-accent hover:bg-accent-hover text-white gap-2 shadow-lg shadow-accent/20 transition-all active:scale-95 font-semibold h-9 rounded-lg"
          />
        }
      >
        <div className="w-4 h-4 bg-white/20 rounded-md flex items-center justify-center">
          <Plus size={12} strokeWidth={3} />
        </div>
        <span className="text-xs uppercase tracking-wider">New Issue</span>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[540px] bg-bg-surface border-border-subtle shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] p-0 overflow-hidden rounded-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Custom Header with Gradient Accent */}
          <div className="h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50" />
          
          <div className="p-6">
            <DialogHeader className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                   <Sparkles size={18} />
                </div>
                <DialogTitle className="text-xl font-bold text-text-primary tracking-tight">Create new issue</DialogTitle>
              </div>
              <DialogDescription className="text-text-tertiary text-sm ml-10">
                Track your team&apos;s work by adding a new task.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Title Field */}
              <div className="space-y-2 group">
                <div className="flex items-center gap-2 text-text-secondary group-focus-within:text-accent transition-colors">
                  <Hash size={14} />
                  <Label htmlFor="title" className="text-[10px] font-bold uppercase tracking-widest cursor-pointer">Title</Label>
                </div>
                <Input 
                  id="title" 
                  placeholder="Task title..." 
                  className="bg-bg-base/50 border-border-subtle focus:border-accent focus:ring-accent/10 h-11 text-text-primary transition-all rounded-xl placeholder:text-text-tertiary/50"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  autoFocus
                />
              </div>

              {/* Description Field */}
              <div className="space-y-2 group">
                <div className="flex items-center justify-between gap-2 text-text-secondary group-focus-within:text-accent transition-colors">
                  <div className="flex items-center gap-2">
                    <AlignLeft size={14} />
                    <Label htmlFor="description" className="text-[10px] font-bold uppercase tracking-widest cursor-pointer">Description</Label>
                  </div>
                  <button 
                    type="button"
                    onClick={async () => {
                      if (!formData.title) return
                      setLoading(true)
                      try {
                        const token = await getToken()
                        const res = await fetch(API_URL + '/ai/suggest-description', {
                          method: 'POST',
                          headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` 
                          },
                          body: JSON.stringify({ title: formData.title })
                        })
                        const data = await res.json()
                        if (data.suggestion) {
                          setFormData(prev => ({ ...prev, description: data.suggestion }))
                        }
                      } finally {
                        setLoading(false)
                      }
                    }}
                    className="flex items-center gap-1 text-[9px] font-bold text-accent hover:text-accent-hover transition-colors bg-accent/5 px-2 py-0.5 rounded-full border border-accent/20"
                  >
                    <Sparkles size={10} />
                    Auto-Fill
                  </button>
                </div>
                <Textarea 
                  id="description" 
                  placeholder="Add a detailed description..." 
                  className="bg-bg-base/50 border-border-subtle min-h-[120px] focus:border-accent focus:ring-accent/10 text-sm text-text-primary transition-all rounded-xl resize-none placeholder:text-text-tertiary/50"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              {/* Meta Stats Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <BarChart size={14} />
                    <Label className="text-[10px] font-bold uppercase tracking-widest">Priority</Label>
                  </div>
                  <Select value={formData.priority} onValueChange={(val) => setFormData(prev => ({ ...prev, priority: val }))}>
                    <SelectTrigger className="bg-bg-base/50 border-border-subtle h-10 rounded-xl focus:ring-accent/10">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent className="bg-bg-surface border-border-subtle shadow-2xl rounded-xl">
                      <SelectItem value="no_priority" className="focus:bg-bg-elevated text-text-primary">No Priority</SelectItem>
                      <SelectItem value="low" className="focus:bg-bg-elevated text-text-primary">Low</SelectItem>
                      <SelectItem value="medium" className="focus:bg-bg-elevated text-text-primary">Medium</SelectItem>
                      <SelectItem value="high" className="focus:bg-bg-elevated text-text-primary">High</SelectItem>
                      <SelectItem value="urgent" className="focus:bg-bg-elevated text-red-400">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Layout size={14} className="opacity-0 w-0" /> {/* Spacer */}
                    <Label className="text-[10px] font-bold uppercase tracking-widest">Label</Label>
                  </div>
                   <div className="h-10 border border-dashed border-border-subtle rounded-xl flex items-center justify-center text-[10px] font-bold text-text-tertiary uppercase tracking-wider hover:bg-bg-elevated cursor-pointer transition-colors">
                      Add Label
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mx-6 mb-0 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Action Footer */}
          <div className="bg-bg-base/30 border-t border-border-subtle p-4 flex justify-between items-center">
            <div className="flex items-center gap-2 text-[10px] font-medium text-text-tertiary">
               <span className="bg-bg-elevated px-2 py-0.5 rounded border border-border-subtle select-none">ESC</span>
               <span>to cancel</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setOpen(false)}
                className="text-text-tertiary hover:text-text-primary hover:bg-bg-elevated h-9 rounded-lg"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading || !formData.title}
                className="bg-accent hover:bg-accent-hover text-white shadow-lg shadow-accent/20 min-w-[120px] h-9 rounded-lg transition-all active:scale-95"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : (
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} />
                    <span>Create Issue</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
