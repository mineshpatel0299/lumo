'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { KanbanColumn } from './kanban-column'
import { IssueCard } from './issue-card'
import { useAuth } from '@clerk/nextjs'
import { io, Socket } from 'socket.io-client'

const COLUMNS = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'done', title: 'Done' }
]

export function KanbanBoard({ workspaceSlug }: { workspaceSlug: string }) {
  const { getToken } = useAuth()
  const [issues, setIssues] = useState<any[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const socketRef = React.useRef<Socket | null>(null)

  const fetchIssues = useCallback(async () => {
    const token = await getToken()
    const res = await fetch(`http://localhost:3001/issues/${workspaceSlug}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.ok) {
      const data = await res.json()
      setIssues(data.issues)
    }
  }, [workspaceSlug, getToken])

  useEffect(() => {
    fetchIssues()
    
    // Setup socket for real-time moves
    const socket = io('http://localhost:3001')
    socketRef.current = socket
    socket.emit('join-workspace', workspaceSlug)
    
    socket.on('issue-moved', () => fetchIssues())
    
    return () => { socket.disconnect() }
  }, [workspaceSlug, fetchIssues])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeIssue = issues.find(i => i.id === activeId)
    const overIssue = issues.find(i => i.id === overId)

    // If hovering over a column
    const isOverAColumn = COLUMNS.some(col => col.id === overId)

    if (activeIssue && (overIssue || isOverAColumn)) {
      const newStatus = isOverAColumn ? overId : overIssue?.status?.name.toLowerCase().replace(' ', '-') || 'todo'
      const oldStatus = activeIssue.status?.name.toLowerCase().replace(' ', '-') || 'todo'

      if (newStatus !== oldStatus) {
        setIssues((prev) => {
          return prev.map(issue => {
            if (issue.id === activeId) {
              return { ...issue, status: { ...issue.status, name: newStatus.replace('-', ' ') } }
            }
            return issue
          })
        })
      }
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeIssue = issues.find(i => i.id === activeId)
    if (!activeIssue) return

    // Update status and sort order in DB
    const token = await getToken()
    const newStatusId = overId === 'todo' ? 'todo-id' : overId === 'in-progress' ? 'ip-id' : 'done-id' // Placeholder

    try {
      await fetch(`http://localhost:3001/issues/${activeId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          statusId: overId.replace('-', ' '), // Simplified for now
          sortOrder: 0 // Will implement proper ordering logic
        })
      })
      
      socketRef.current?.emit('issue-moved', { issueId: activeId })
    } catch (err) {
      console.error(err)
    }
  }

  const getIssuesByStatus = (status: string) => {
    return issues.filter(i => {
      const s = i.status?.name.toLowerCase().replace(' ', '-') || 'todo'
      return s === status
    })
  }

  return (
    <div className="h-full flex overflow-x-auto gap-6 pb-4 scrollbar-hide">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 min-h-full">
          {COLUMNS.map((col) => (
            <KanbanColumn 
              key={col.id} 
              id={col.id} 
              title={col.title} 
              issues={getIssuesByStatus(col.id)} 
            />
          ))}
        </div>

        <DragOverlay>
          {activeId ? (
            <IssueCard issue={issues.find(i => i.id === activeId)} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
