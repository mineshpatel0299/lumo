import { create } from 'zustand'

export interface WorkspaceStatus {
  id: string
  name: string
  color: string
  category: string
  position: number
  isDefault?: boolean
}

export interface WorkspaceProject {
  id: string
  name: string
  slug: string
}

export interface Workspace {
  id: string
  name: string
  slug: string
  logoUrl?: string
  projects?: WorkspaceProject[]
  statuses?: WorkspaceStatus[]
}

interface WorkspaceState {
  currentWorkspace: Workspace | null
  setCurrentWorkspace: (workspace: Workspace | null) => void
  workspaces: Workspace[]
  setWorkspaces: (workspaces: Workspace[]) => void
  isLoadingWorkspaces: boolean
  setLoadingWorkspaces: (loading: boolean) => void
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  currentWorkspace: null,
  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
  workspaces: [],
  setWorkspaces: (workspaces) => set({ workspaces }),
  isLoadingWorkspaces: true,
  setLoadingWorkspaces: (loading) => set({ isLoadingWorkspaces: loading }),
}))
