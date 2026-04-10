'use client'

import React, { useEffect } from 'react'
import { usePresenceStore } from '@/store/presence.store'
import { motion, AnimatePresence } from 'framer-motion'
import { MousePointer2 } from 'lucide-react'
import { useSocket } from '@/hooks/use-socket'

export function CursorRenderer({ workspaceId }: { workspaceId?: string }) {
  const { cursors } = usePresenceStore()
  const { broadcastCursor } = useSocket(workspaceId)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Calculate relative percentage for cross-screen consistency
      const x = (e.clientX / window.innerWidth) * 100
      const y = (e.clientY / window.innerHeight) * 100
      broadcastCursor(x, y)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [broadcastCursor])

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      <AnimatePresence>
        {Object.values(cursors).map((cursor) => (
          <motion.div
            key={cursor.userId}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              x: `${cursor.x}vw`,
              y: `${cursor.y}vh`
            }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ 
              type: "spring", 
              damping: 30, 
              stiffness: 300, 
              mass: 0.5 
            }}
            className="absolute top-0 left-0"
          >
            <MousePointer2 
              size={20} 
              style={{ color: cursor.color }} 
              fill={cursor.color}
              className="drop-shadow-sm" 
            />
            <div 
              className="ml-4 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-lg flex items-center gap-1"
              style={{ backgroundColor: cursor.color }}
            >
              <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
              {cursor.userName}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
