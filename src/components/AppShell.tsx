import type { ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { unreadTotal } from '../data/api'
import { Avatar } from './Avatar'
import { Icon, type IconName } from './icons'
import { useToast } from './Toast'

interface NavEntry {
  to: string
  label: string
  short: string
  icon: IconName
  badge?: number
}

export function AppShell({ children }: { children: ReactNode }) {
  const { db, user, signOut, resetDemo } = useApp()
  const toast = useToast()
  const location = useLocation()

  if (!user) return null

  const unread = unreadTotal(user.id, db)
  const pending = db.sessions.filter(
    (session) => session.status === 'proposed' && session.teacherId === user.id,
  ).length

  const entries: NavEntry[] = [
    { to: '/discover', label: 'Discover', short: 'Discover', icon: 'compass' },
    { to: '/matches', label: 'Matches', short: 'Matches', icon: 'sparkles' },
    { to: '/sessions', label: 'Sessions', short: 'Sessions', icon: 'calendar', badge: pending },
    { to: '/messages', label: 'Messages', short: 'Chat', icon: 'message', badge: unread },
  ]

  const isChat = location.pathname.startsWith('/messages')

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link to="/discover" className="brand" aria-label="Twofold home">
          <span className="brand-mark">
            <Icon name="swap" size={17} strokeWidth={2} />
          </span>
          <span className="brand-name">
            twofold<span>.</span>
          </span>
        </Link>

        <nav className="nav" aria-label="Main">
          <div className="nav-label">Explore</div>
          {entries.map((entry) => (
            <NavLink
              key={entry.to}
              to={entry.to}
              className={({ isActive }) => `nav-item${isActive ? ' is-active' : ''}`}
            >
              <Icon name={entry.icon} size={18} />
              <span>{entry.label}</span>
              {entry.badge ? <span className="nav-count">{entry.badge}</span> : null}
            </NavLink>
          ))}

          <div className="nav-label" style={{ marginTop: 18 }}>
            You
          </div>
          <NavLink
            to="/profile"
            className={({ isActive }) => `nav-item${isActive ? ' is-active' : ''}`}
          >
            <Icon name="user" size={18} />
            <span>My profile</span>
          </NavLink>
        </nav>

        <div className="sidebar-foot">
          <div className="sidebar-hint">
            <div className="sidebar-hint-title">
              <Icon name="shield" size={12} />
              Local demo
            </div>
            <p>Everything runs in your browser. No account, no server, no keys.</p>
            <button
              type="button"
              className="btn btn-quiet btn-sm"
              style={{ marginTop: 6, paddingLeft: 0 }}
              onClick={() => {
                resetDemo()
                toast('Demo data restored')
              }}
            >
              <Icon name="refresh" size={13} />
              Reset demo data
            </button>
          </div>

          <div className="user-card">
            <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
              <Avatar user={user} size="sm" />
              <span className="user-card-meta">
                <span className="user-card-name">{user.name}</span>
                <span className="user-card-sub">{user.branch}</span>
              </span>
            </Link>
            <button
              type="button"
              className="icon-btn icon-btn-sm"
              onClick={signOut}
              aria-label="Sign out"
              title="Sign out"
            >
              <Icon name="logout" size={15} />
            </button>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="mobile-top">
          <Link to="/discover" className="brand" style={{ padding: 0 }}>
            <span className="brand-mark">
              <Icon name="swap" size={16} strokeWidth={2} />
            </span>
            <span className="brand-name" style={{ fontSize: '1.25rem' }}>
              twofold<span>.</span>
            </span>
          </Link>
          <Link to="/profile" aria-label="My profile">
            <Avatar user={user} size="sm" />
          </Link>
        </header>

        <main className={isChat ? 'content content-flush' : 'content'}>{children}</main>
      </div>

      <nav className="mobile-tabs" aria-label="Main">
        {[...entries, { to: '/profile', label: 'Profile', short: 'Profile', icon: 'user' as IconName }].map(
          (entry) => (
            <NavLink
              key={entry.to}
              to={entry.to}
              className={({ isActive }) => `mobile-tab${isActive ? ' is-active' : ''}`}
            >
              <Icon name={entry.icon} size={19} />
              <span>{entry.short}</span>
            </NavLink>
          ),
        )}
      </nav>
    </div>
  )
}
