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
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { KanbanColumn } from './kanban-column'
import { IssueCard } from './issue-card'
import { useAuth } from '@clerk/nextjs'
import { io, Socket } from 'socket.io-client'
import { useWorkspaceStore } from '@/store/workspace.store'
import { API_URL } from '@/lib/api'

// Column definitions driven by the workspace statuses fetched from API.
// Fallback static list is used when statuses haven't loaded yet.
const FALLBACK_COLUMNS = [
  { id: 'backlog',     title: 'Backlog' },
  { id: 'todo',        title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'done',        title: 'Done' },
]

function toColumnId(statusName: string): string {
  return statusName.toLowerCase().replace(/\s+/g, '-')
}

export function KanbanBoard({ workspaceSlug }: { workspaceSlug: string }) {
  const { getToken } = useAuth()
  const { currentWorkspace } = useWorkspaceStore()
  const [issues, setIssues] = useState<any[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const socketRef = React.useRef<Socket | null>(null)

  // Build columns from workspace statuses if available
  const columns = currentWorkspace?.statuses?.length
    ? currentWorkspace.statuses
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((s) => ({ id: toColumnId(s.name), title: s.name, statusId: s.id, color: s.color }))
    : FALLBACK_COLUMNS.map((c) => ({ ...c, statusId: c.id, color: undefined }))

  const fetchIssues = useCallback(async () => {
    try {
      const token = await getToken()
      const res = await fetch(API_URL + `/issues/${workspaceSlug}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setIssues(data.issues)
      }
    } catch (err) {
      console.error('Failed to fetch issues:', err)
    }
  }, [workspaceSlug, getToken])

  useEffect(() => {
    fetchIssues()

    const socket = io(API_URL)
    socketRef.current = socket
    socket.emit('join-workspace', workspaceSlug)
    socket.on('issue-moved', () => fetchIssues())

    return () => {
      socket.disconnect()
    }
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

    const activeIssue = issues.find((i) => i.id === active.id)
    if (!activeIssue) return

    const overId = over.id as string
    const isOverColumn = columns.some((col) => col.id === overId)
    const overIssue = issues.find((i) => i.id === overId)

    const newColumnId = isOverColumn
      ? overId
      : overIssue
      ? toColumnId(overIssue.status?.name ?? 'backlog')
      : null

    if (!newColumnId) return

    const currentColumnId = toColumnId(activeIssue.status?.name ?? 'backlog')
    if (newColumnId === currentColumnId) return

    // Optimistic update: change the status name so the card moves columns
    const targetColumn = columns.find((c) => c.id === newColumnId)
    setIssues((prev) =>
      prev.map((issue) =>
        issue.id === active.id
          ? {
              ...issue,
              status: {
                ...issue.status,
                id: targetColumn?.statusId ?? issue.status?.id,
                name: targetColumn?.title ?? issue.status?.name,
              },
            }
          : issue
      )
    )
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const activeIssue = issues.find((i) => i.id === active.id)
    if (!activeIssue) return

    const overId = over.id as string
    const isOverColumn = columns.some((col) => col.id === overId)
    const targetColumnId = isOverColumn
      ? overId
      : toColumnId(issues.find((i) => i.id === overId)?.status?.name ?? 'backlog')

    const targetColumn = columns.find((c) => c.id === targetColumnId)
    const newStatusId = targetColumn?.statusId ?? activeIssue.status?.id

    if (!newStatusId || newStatusId === activeIssue.status?.id) return

    try {
      const token = await getToken()
      await fetch(API_URL + `/issues/${active.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ statusId: newStatusId, sortOrder: activeIssue.sortOrder }),
      })
      socketRef.current?.emit('issue-moved', { issueId: active.id })
    } catch (err) {
      console.error('Failed to update issue:', err)
      // Revert optimistic update on failure
      fetchIssues()
    }
  }

  const getIssuesByColumn = (columnId: string) =>
    issues.filter((i) => toColumnId(i.status?.name ?? 'backlog') === columnId)

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
          {columns.map((col) => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.title}
              color={(col as any).color}
              issues={getIssuesByColumn(col.id)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeId ? (
            <IssueCard issue={issues.find((i) => i.id === activeId)} isDragOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
