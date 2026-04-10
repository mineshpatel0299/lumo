'use client'

import React, { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2, RefreshCw, BarChart3 } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import ReactMarkdown from 'react-markdown'
import { useParams } from 'next/navigation'
import { API_URL } from '@/lib/api'

export function SummaryPanel() {
  const { getToken } = useAuth()
  const params = useParams()
  const workspaceSlug = Array.isArray(params.workspaceSlug)
    ? params.workspaceSlug[0]
    : (params.workspaceSlug as string | undefined)
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchSummary = async () => {
    setLoading(true)
    try {
      const token = await getToken()
      const res = await fetch(API_URL + `/ai/workspace-summary/${workspaceSlug}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setSummary(data.summary)
    } catch (err) {
      console.error(err)
      setSummary("Failed to generate summary. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet onOpenChange={(open) => open && !summary && fetchSummary()}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="border-border-subtle bg-bg-surface/50 hover:bg-bg-elevated gap-2 text-text-secondary hover:text-text-primary h-9 px-3 rounded-lg transition-all"
        >
          <BarChart3 size={16} />
          <span className="text-xs font-semibold uppercase tracking-wider">Digest</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] bg-bg-surface border-l border-border-subtle p-0 overflow-hidden shadow-2xl">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-border-subtle bg-bg-base/30">
            <SheetHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                    <Sparkles size={18} />
                </div>
                <SheetTitle className="text-xl font-bold tracking-tight text-text-primary">Lumo Digest</SheetTitle>
              </div>
              <SheetDescription className="text-text-tertiary">
                AI-generated summary of your workspace activity and health.
              </SheetDescription>
            </SheetHeader>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 prose prose-invert prose-zinc max-w-none">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-text-tertiary">
                <Loader2 size={32} className="animate-spin text-accent" />
                <p className="text-sm font-medium animate-pulse">Analyzing workspace patterns...</p>
              </div>
            ) : summary ? (
              <div className="animate-fade-up">
                 <ReactMarkdown className="text-text-secondary leading-relaxed space-y-4 text-sm">
                   {summary}
                 </ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                 <div className="w-16 h-16 rounded-full bg-bg-elevated flex items-center justify-center text-text-tertiary">
                    <RefreshCw size={24} />
                 </div>
                 <p className="text-text-tertiary text-sm">Nothing to show yet.</p>
                 <Button onClick={fetchSummary} variant="outline" size="sm">Try Again</Button>
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="p-4 border-t border-border-subtle bg-bg-base/30 flex justify-between items-center">
            <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
               Powered by Lumo AI
            </span>
            <Button 
               variant="ghost" 
               size="sm" 
               onClick={fetchSummary}
               className="text-accent hover:text-accent-hover hover:bg-accent/5 h-8 gap-1.5"
            >
               <RefreshCw size={12} />
               <span className="text-[10px] font-bold uppercase tracking-widest">Refresh</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
