import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import type { Database, User } from '../data/types'
import {
  getCurrentUserId,
  getSnapshot,
  isLoaded,
  setCurrentUserId,
  startPolling,
  subscribe,
} from '../data/store'
import { resetDatabase } from '../data/api'

interface AppContextValue {
  db: Database
  user: User | null
  signIn: (userId: string) => void
  signOut: () => void
  resetDemo: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

/**
 * First paint. Shown until the first `/api/state` lands, so the app never
 * renders an empty shell against an unloaded database.
 */
function BootScreen() {
  return (
    <div className="boot" role="status" aria-live="polite">
      <div className="boot-inner">
        <span className="boot-mark">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 8.5h13l-3.2-3.2M20 15.5H7l3.2 3.2" />
          </svg>
        </span>
        <span className="boot-word">
          twofold<span>.</span>
        </span>
        <span className="boot-note">Opening the exchange…</span>
      </div>
    </div>
  )
}

export function AppProvider({ children }: { children: ReactNode }) {
  const db = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const currentUserId = getCurrentUserId()

  // Poll the server once a second; stops itself when the tab is hidden.
  useEffect(() => startPolling(), [])

  const user = useMemo(
    () => db.users.find((candidate) => candidate.id === currentUserId) ?? null,
    [db, currentUserId],
  )

  const signIn = useCallback((userId: string) => {
    setCurrentUserId(userId)
  }, [])

  const signOut = useCallback(() => {
    setCurrentUserId(null)
  }, [])

  const resetDemo = useCallback(() => {
    void resetDatabase()
  }, [])

  const value = useMemo<AppContextValue>(
    () => ({ db, user, signIn, signOut, resetDemo }),
    [db, user, signIn, signOut, resetDemo],
  )

  if (!isLoaded()) return <BootScreen />

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used inside <AppProvider>')
  return context
}

/** Convenience hook for pages that are only rendered behind the auth guard. */
export function useCurrentUser(): User {
  const { user } = useApp()
  if (!user) throw new Error('useCurrentUser called outside an authenticated route')
  return user
}
