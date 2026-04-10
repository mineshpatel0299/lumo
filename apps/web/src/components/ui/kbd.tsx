import React from 'react'
import { cn } from '@/lib/utils'

export function Kbd({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <kbd className={cn(
      "pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border-subtle bg-bg-surface px-1.5 font-mono text-[10px] font-medium text-text-tertiary opacity-100",
      className
    )}>
      {children}
    </kbd>
  )
}
