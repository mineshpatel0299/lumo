'use client'

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar'
import { MoreHorizontal, GripVertical } from 'lucide-react'

interface IssueCardProps {
  issue: any // Using any for now, will type with generated Prisma types
}

export function IssueCard({ issue }: IssueCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: issue.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className="group mb-2 border-border-subtle bg-bg-surface hover:border-border-default transition-all cursor-grab active:cursor-grabbing shadow-sm">
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 overflow-hidden">
               <GripVertical size={14} className="text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" {...listeners} />
               <span className="text-[10px] font-bold text-text-tertiary tracking-wider uppercase truncate">
                 {issue.identifier}
               </span>
            </div>
            <button className="text-text-tertiary hover:text-text-primary">
              <MoreHorizontal size={14} />
            </button>
          </div>
          
          <h4 className="text-sm font-medium text-text-primary mb-3 leading-snug">
            {issue.title}
          </h4>

          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {issue.priority && (
                 <Badge variant="secondary" className="text-[10px] px-1.5 h-5 bg-bg-elevated border-border-subtle">
                   {issue.priority}
                 </Badge>
              )}
            </div>
            
            <div className="flex items-center -space-x-1.5">
              {issue.assignee ? (
                 <div className="w-5 h-5 rounded-full border-2 border-bg-surface bg-accent text-[8px] flex items-center justify-center font-bold text-white overflow-hidden">
                   {issue.assignee.name[0]}
                 </div>
              ) : (
                <div className="w-5 h-5 rounded-full border border-dashed border-border-default bg-bg-base" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
