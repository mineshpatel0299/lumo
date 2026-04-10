import { create } from 'zustand'

export type Cursor = {
  x: number
  y: number
  userId: string
  userName: string
  color: string
}

interface PresenceState {
  cursors: Record<string, Cursor>
  setCursors: (cursors: Record<string, Cursor>) => void
  updateCursor: (userId: string, cursor: Cursor) => void
  removeCursor: (userId: string) => void
}

export const usePresenceStore = create<PresenceState>((set) => ({
  cursors: {},
  setCursors: (cursors) => set({ cursors }),
  updateCursor: (userId, cursor) => 
    set((state) => ({ 
      cursors: { ...state.cursors, [userId]: cursor } 
    })),
  removeCursor: (userId) => 
    set((state) => {
      const newCursors = { ...state.cursors }
      delete newCursors[userId]
      return { cursors: newCursors }
    }),
}))
