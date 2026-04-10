'use client'

import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth, useUser } from '@clerk/nextjs'
import { usePresenceStore } from '@/store/presence.store'
import { API_URL } from '@/lib/api'

export const useSocket = (workspaceId?: string) => {
  const socketRef = useRef<Socket | null>(null)
  const { getToken } = useAuth()
  const { user } = useUser()
  const { updateCursor, removeCursor } = usePresenceStore()

  useEffect(() => {
    if (!workspaceId || !user) return

    const socket = io(API_URL, {
      auth: async (cb) => {
        const token = await getToken()
        cb({ token })
      }
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('Connected to real-time server')
      socket.emit('join-workspace', workspaceId)
    })

    socket.on('cursor-move', (data: { userId: string, x: number, y: number, name: string, color: string }) => {
      if (data.userId === user.id) return
      updateCursor(data.userId, {
        x: data.x,
        y: data.y,
        userId: data.userId,
        userName: data.name,
        color: data.color
      })
    })

    socket.on('user-disconnected', (userId: string) => {
      removeCursor(userId)
    })

    return () => {
      socket.disconnect()
    }
  }, [workspaceId, user, getToken, updateCursor, removeCursor])

  const broadcastCursor = useCallback((x: number, y: number) => {
    if (socketRef.current && user) {
      socketRef.current.emit('cursor-move', {
        x,
        y,
        name: user.fullName || user.username || 'User',
        color: '#7C3AED',
      })
    }
  }, [user])

  return { broadcastCursor }
}
