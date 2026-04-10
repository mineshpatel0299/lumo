'use client'

import React, { useState, useEffect } from 'react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Search, Sparkles, Loader2, Hash } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { useParams, useRouter } from 'next/navigation'
import { Kbd } from '../ui/kbd'

export function SearchModal() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  const { getToken } = useAuth()
  const { workspaceSlug } = useParams()
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const handleSearch = async (val: string) => {
    setQuery(val)
    if (val.length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const token = await getToken()
      const res = await fetch('http://localhost:3001/ai/search', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ query: val, workspaceSlug })
      })
      const data = await res.json()
      setResults(data.issues || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div 
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center bg-bg-surface border border-border-subtle rounded-md px-2 py-1 gap-4 cursor-pointer hover:border-border-default hover:bg-bg-elevated transition-all group"
      >
        <div className="flex items-center gap-2 text-text-tertiary group-hover:text-text-secondary">
          <Search size={14} />
          <span className="text-xs font-medium">Search or ask Lumo...</span>
        </div>
        <div className="flex items-center gap-0.5 opacity-60">
          <Kbd>⌘K</Kbd>
        </div>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="relative">
          <CommandInput 
            placeholder="Search issues, ask for 'high priority bugs'..." 
            onValueChange={handleSearch}
          />
          {loading && (
            <div className="absolute right-4 top-4">
              <Loader2 size={16} className="animate-spin text-accent" />
            </div>
          )}
        </div>
        <CommandList className="max-h-[400px]">
          <CommandEmpty className="py-12 flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-2">
               <Sparkles size={24} />
            </div>
            <p className="text-sm font-medium text-text-primary">No results found.</p>
            <p className="text-xs text-text-tertiary max-w-[200px] text-center">
              Try a natural query like &quot;show me urgent tasks&quot;
            </p>
          </CommandEmpty>
          
          {results.length > 0 && (
            <CommandGroup heading="Issues">
              {results.map((issue) => (
                <CommandItem 
                  key={issue.id}
                  onSelect={() => {
                    setOpen(false)
                    router.push(`/${workspaceSlug}/issue/${issue.id}`)
                  }}
                  className="flex items-center justify-between py-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-text-tertiary">
                      <Hash size={12} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{issue.identifier}</span>
                    </div>
                    <span className="text-sm font-medium text-text-primary">{issue.title}</span>
                  </div>
                  {issue.status && (
                    <div 
                      className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border"
                      style={{ borderColor: `${issue.status.color}40`, color: issue.status.color, backgroundColor: `${issue.status.color}10` }}
                    >
                      {issue.status.name}
                    </div>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <div className="p-4 border-t border-border-subtle bg-bg-base/30">
             <div className="flex items-center justify-between text-[10px] font-bold text-text-tertiary uppercase tracking-widest leading-none">
                <div className="flex items-center gap-1.5">
                   <Sparkles size={10} className="text-accent" />
                   <span>Lumo Smart Search Active</span>
                </div>
                <span>↵ to select</span>
             </div>
          </div>
        </CommandList>
      </CommandDialog>
    </>
  )
}
