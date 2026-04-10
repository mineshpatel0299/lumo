'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter, usePathname } from 'next/navigation'
import { useWorkspaceStore } from '@/store/workspace.store'
import { API_URL } from '@/lib/api'

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { workspaces, setWorkspaces, currentWorkspace, setCurrentWorkspace } = useWorkspaceStore()
  const hasFetched = useRef(false)

  useEffect(() => {
    if (!isLoaded || !isSignedIn || hasFetched.current) return

    const loadWorkspaces = async () => {
      hasFetched.current = true
      try {
        const token = await getToken()
        const res = await fetch(API_URL + '/workspaces', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return

        const data = await res.json()
        const fetched = data.workspaces ?? []

        if (fetched.length === 0) {
          router.push('/onboarding')
          return
        }

        setWorkspaces(fetched)

        // Restore the current workspace from the URL slug, or fall back to first
        const slugFromUrl = pathname.split('/')[1]
        const match = fetched.find((w: { slug: string }) => w.slug === slugFromUrl)
        if (!currentWorkspace) {
          setCurrentWorkspace(match ?? fetched[0])
        }
      } catch (err) {
        console.error('Failed to load workspaces:', err)
      }
    }

    loadWorkspaces()
  }, [isLoaded, isSignedIn, getToken, router, pathname, workspaces.length, currentWorkspace, setWorkspaces, setCurrentWorkspace])

  return <>{children}</>
}
