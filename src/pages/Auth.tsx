import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { createUser } from '../data/api'
import { SKILL_BY_ID } from '../data/catalog'
import { Avatar } from '../components/Avatar'
import { Icon } from '../components/icons'
import { useToast } from '../components/Toast'
import type { User } from '../data/types'

const DEMO_IDS = ['u_aarav', 'u_riya', 'u_ananya', 'u_kabir', 'u_meera', 'u_zoya']
const YEARS = ['1st year', '2nd year', '3rd year', '4th year', 'Postgraduate']

function summary(user: User): string {
  const teaches = user.teaches[0] ? SKILL_BY_ID[user.teaches[0].skillId]?.name : null
  const wants = user.wants[0] ? SKILL_BY_ID[user.wants[0].skillId]?.name : null
  if (teaches && wants) return `${teaches} → ${wants}`
  if (teaches) return `Teaches ${teaches}`
  return user.branch
}

export function Auth() {
  const { db, user, signIn } = useApp()
  const navigate = useNavigate()
  const toast = useToast()

  const [mode, setMode] = useState<'demo' | 'create'>('demo')
  const [selectedId, setSelectedId] = useState(DEMO_IDS[0])
  const [form, setForm] = useState({
    name: '',
    email: '',
    branch: '',
    year: YEARS[2],
    bio: '',
  })
  const [error, setError] = useState('')

  const demoUsers = DEMO_IDS.map((id) => db.users.find((candidate) => candidate.id === id)).filter(
    (candidate): candidate is User => Boolean(candidate),
  )

  const enter = () => {
    signIn(selectedId)
    const chosen = db.users.find((candidate) => candidate.id === selectedId)
    toast(`Welcome, ${chosen?.name.split(' ')[0] ?? 'student'}`)
    navigate('/discover')
  }

  const create = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      setError('Name and email are required.')
      return
    }
    if (!/.+@.+\..+/.test(form.email.trim())) {
      setError('That email does not look right.')
      return
    }
    // createUser also signs the new student in.
    await createUser(form)
    toast('Profile created — add your skills next')
    navigate('/profile')
  }

  return (
    <div className="auth">
      <aside className="auth-side">
        <Link to="/" className="brand" style={{ padding: 0 }}>
          <span className="brand-mark">
            <Icon name="swap" size={17} strokeWidth={2} />
          </span>
          <span className="brand-name">
            twofold<span>.</span>
          </span>
        </Link>

        <div>
          <p className="auth-quote">
            “I have taught forty people the four chords that unlock <em>nine hundred songs.</em>”
          </p>
          <div className="row gap-10" style={{ marginTop: 20 }}>
            {db.users
              .filter((candidate) => candidate.id === 'u_kabir')
              .map((candidate) => (
                <div key={candidate.id} className="row gap-10">
                  <Avatar user={candidate} size="md" />
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 550 }}>{candidate.name}</div>
                    <div className="faint" style={{ fontSize: '0.72rem' }}>
                      {candidate.branch} · {candidate.year}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="auth-side-foot">
          <div className="stat">
            <span className="stat-value">{db.users.length}</span>
            <span className="stat-label">Students</span>
          </div>
          <div className="stat">
            <span className="stat-value">{db.skills.length}</span>
            <span className="stat-label">Skills</span>
          </div>
          <div className="stat">
            <span className="stat-value">{db.sessions.length}</span>
            <span className="stat-label">Sessions</span>
          </div>
        </div>
      </aside>

      <main className="auth-panel">
        <div className="auth-card">
          <h1 className="page-title">{mode === 'demo' ? 'Step inside.' : 'Create your profile.'}</h1>
          <p className="muted" style={{ marginTop: 8, marginBottom: 22, fontSize: '0.88rem' }}>
            {mode === 'demo'
              ? 'Pick a student to explore the app as them. Every profile is already populated with skills, sessions and conversations.'
              : 'New profiles start empty — you will add what you teach and want to learn next.'}
          </p>

          {user && (
            <div
              className="row gap-10"
              style={{
                padding: '10px 12px',
                marginBottom: 16,
                borderRadius: 12,
                border: '1px solid var(--mint-line)',
                background: 'var(--mint-soft)',
                fontSize: '0.8rem',
              }}
            >
              <Icon name="checkCircle" size={15} />
              <span className="grow">
                Signed in as <strong>{user.name}</strong>. Pick someone else to switch.
              </span>
              <Link to="/discover" className="btn btn-quiet btn-sm">
                Continue
              </Link>
            </div>
          )}

          <div className="auth-switch">
            <button
              type="button"
              className={mode === 'demo' ? 'is-on' : ''}
              onClick={() => setMode('demo')}
            >
              Demo students
            </button>
            <button
              type="button"
              className={mode === 'create' ? 'is-on' : ''}
              onClick={() => setMode('create')}
            >
              Create profile
            </button>
          </div>

          {mode === 'demo' ? (
            <>
              <div className="demo-grid">
                {demoUsers.map((candidate) => (
                  <button
                    key={candidate.id}
                    type="button"
                    className={`demo-account${selectedId === candidate.id ? ' is-on' : ''}`}
                    onClick={() => setSelectedId(candidate.id)}
                  >
                    <Avatar user={candidate} size="sm" />
                    <span style={{ minWidth: 0 }}>
                      <span className="demo-account-name" style={{ display: 'block' }}>
                        {candidate.name}
                      </span>
                      <span className="demo-account-sub" style={{ display: 'block' }}>
                        {summary(candidate)}
                      </span>
                    </span>
                  </button>
                ))}
              </div>

              <button type="button" className="btn btn-primary btn-lg btn-block" style={{ marginTop: 18 }} onClick={enter}>
                Continue
                <Icon name="arrowRight" size={17} />
              </button>

              <p className="faint" style={{ fontSize: '0.72rem', marginTop: 14, lineHeight: 1.5 }}>
                Tip: open a second tab and sign in as another student to see chat and session
                requests sync live between them.
              </p>
            </>
          ) : (
            <div className="stack gap-14">
              <div className="field">
                <label htmlFor="signup-name">Full name</label>
                <input
                  id="signup-name"
                  className="input"
                  placeholder="Priya Nambiar"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
              </div>

              <div className="field">
                <label htmlFor="signup-email">Campus email</label>
                <input
                  id="signup-email"
                  className="input"
                  placeholder="priya@campus.edu"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                />
              </div>

              <div className="grid-2" style={{ gap: 12 }}>
                <div className="field">
                  <label htmlFor="signup-branch">Branch</label>
                  <input
                    id="signup-branch"
                    className="input"
                    placeholder="Computer Science"
                    value={form.branch}
                    onChange={(event) => setForm({ ...form, branch: event.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="signup-year">Year</label>
                  <select
                    id="signup-year"
                    className="select"
                    value={form.year}
                    onChange={(event) => setForm({ ...form, year: event.target.value })}
                  >
                    {YEARS.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field">
                <label htmlFor="signup-bio">One line about you</label>
                <textarea
                  id="signup-bio"
                  className="textarea"
                  style={{ minHeight: 74 }}
                  placeholder="What do you build, play or study?"
                  value={form.bio}
                  onChange={(event) => setForm({ ...form, bio: event.target.value })}
                />
              </div>

              {error && (
                <div className="row gap-6" style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>
                  <Icon name="x" size={14} />
                  {error}
                </div>
              )}

              <button type="button" className="btn btn-primary btn-lg btn-block" onClick={create}>
                Create profile
                <Icon name="arrowRight" size={17} />
              </button>
            </div>
          )}

          <p className="faint" style={{ fontSize: '0.72rem', marginTop: 18, textAlign: 'center' }}>
            <Link to="/" style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}>
              Back to home
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
