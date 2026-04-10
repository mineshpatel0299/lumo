'use client'

import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { IssueCard } from './issue-card'
import { MoreHorizontal, Plus } from 'lucide-react'

interface KanbanColumnProps {
  id: string
  title: string
  issues: any[]
}

export function KanbanColumn({ id, title, issues }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id })

  return (
    <div className="flex flex-col w-80 shrink-0 h-full">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest">{title}</h3>
          <span className="text-[10px] font-bold bg-bg-elevated px-2 py-0.5 rounded-full text-text-tertiary">
            {issues.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1 text-text-tertiary hover:text-text-primary hover:bg-bg-elevated rounded transition-colors">
            <Plus size={14} />
          </button>
          <button className="p-1 text-text-tertiary hover:text-text-primary hover:bg-bg-elevated rounded transition-colors">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      <div 
        ref={setNodeRef}
        className="flex-1 bg-transparent rounded-lg p-2 min-h-[500px]"
      >
        <SortableContext 
          id={id}
          items={issues.map(i => i.id)} 
          strategy={verticalListSortingStrategy}
        >
          {issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}
