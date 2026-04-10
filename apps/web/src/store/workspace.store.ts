import { create } from 'zustand'

interface Workspace {
  id: string
  name: string
  slug: string
  logoUrl?: string
}

interface WorkspaceState {
  currentWorkspace: Workspace | null
  setCurrentWorkspace: (workspace: Workspace | null) => void
  workspaces: Workspace[]
  setWorkspaces: (workspaces: Workspace[]) => void
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  currentWorkspace: null,
  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
  workspaces: [],
  setWorkspaces: (workspaces) => set({ workspaces }),
}))
