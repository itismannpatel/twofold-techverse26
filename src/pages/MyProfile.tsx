import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp, useCurrentUser } from '../context/AppContext'
import { listSessionsForUser, ratingFor, updateUser } from '../data/api'
import { CATEGORIES, SKILL_BY_ID, SKILLS } from '../data/catalog'
import { LEVELS, type Category, type ExchangeSkill, type Level } from '../data/types'
import { Avatar } from '../components/Avatar'
import { RatingStars } from '../components/Rating'
import { Icon } from '../components/icons'
import { useToast } from '../components/Toast'

const AVAILABILITY = [
  'Early mornings',
  'Weekday mornings',
  'Weekday afternoons',
  'Weekday evenings',
  'Weeknights after 8',
  'Saturday mornings',
  'Saturday afternoons',
  'Saturday evenings',
  'Sunday mornings',
  'Sunday afternoons',
]

interface SkillEditorProps {
  title: string
  hint: string
  tone: 'teach' | 'learn'
  value: ExchangeSkill[]
  onChange: (next: ExchangeSkill[]) => void
  defaultLevel: Level
}

function SkillEditor({ title, hint, tone, value, onChange, defaultLevel }: SkillEditorProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category | 'All'>('All')

  const selected = useMemo(() => new Set(value.map((skill) => skill.skillId)), [value])

  const options = useMemo(
    () =>
      SKILLS.filter((skill) => !selected.has(skill.id))
        .filter((skill) => category === 'All' || skill.category === category)
        .filter((skill) => skill.name.toLowerCase().includes(query.trim().toLowerCase()))
        .slice(0, 40),
    [selected, category, query],
  )

  return (
    <div className="card">
      <div className="row between gap-12">
        <div>
          <div className={`skill-panel-head ${tone}`} style={{ margin: 0 }}>
            <i className="dot-sep" style={{ background: tone === 'teach' ? 'var(--ember)' : 'var(--mint)' }} />
            {title}
          </div>
          <p className="field-hint" style={{ marginTop: 4 }}>
            {hint}
          </p>
        </div>
        <span className="chip">{value.length} listed</span>
      </div>

      {value.length > 0 && (
        <div className="stack gap-6" style={{ marginTop: 14 }}>
          {value.map((skill) => (
            <div
              key={skill.skillId}
              className="row gap-8"
              style={{
                padding: '7px 8px 7px 12px',
                borderRadius: 12,
                border: '1px solid var(--line)',
                background: 'rgba(255,255,255,0.025)',
              }}
            >
              <span className="grow" style={{ fontSize: '0.85rem' }}>
                {SKILL_BY_ID[skill.skillId]?.name ?? skill.skillId}
                <span className="faint" style={{ fontSize: '0.72rem', marginLeft: 8 }}>
                  {SKILL_BY_ID[skill.skillId]?.category}
                </span>
              </span>
              <select
                className="select"
                style={{ width: 142, height: 34, fontSize: '0.78rem', borderRadius: 9 }}
                value={skill.level}
                onChange={(event) =>
                  onChange(
                    value.map((entry) =>
                      entry.skillId === skill.skillId
                        ? { ...entry, level: event.target.value as Level }
                        : entry,
                    ),
                  )
                }
                aria-label={`Level for ${SKILL_BY_ID[skill.skillId]?.name ?? skill.skillId}`}
              >
                {LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="icon-btn icon-btn-sm"
                onClick={() => onChange(value.filter((entry) => entry.skillId !== skill.skillId))}
                aria-label={`Remove ${SKILL_BY_ID[skill.skillId]?.name ?? skill.skillId}`}
              >
                <Icon name="x" size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="divider" style={{ margin: '14px 0' }} />

      <div className="row gap-8">
        <div className="search">
          <Icon name="search" size={15} />
          <input
            className="input"
            style={{ height: 40, paddingLeft: 40, fontSize: '0.82rem' }}
            placeholder={`Search ${title.toLowerCase()}…`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <select
          className="select"
          style={{ width: 150, height: 40, fontSize: '0.8rem' }}
          value={category}
          onChange={(event) => setCategory(event.target.value as Category | 'All')}
          aria-label="Filter by category"
        >
          <option value="All">All</option>
          {CATEGORIES.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.label}
            </option>
          ))}
        </select>
      </div>

      <div className="chip-row" style={{ marginTop: 10, maxHeight: 128, overflowY: 'auto' }}>
        {options.length ? (
          options.map((skill) => (
            <button
              key={skill.id}
              type="button"
              className="chip"
              onClick={() => onChange([...value, { skillId: skill.id, level: defaultLevel }])}
            >
              <Icon name="plus" size={11} />
              {skill.name}
            </button>
          ))
        ) : (
          <span className="faint" style={{ fontSize: '0.78rem' }}>
            Nothing left to add in this filter.
          </span>
        )}
      </div>
    </div>
  )
}

export function MyProfile() {
  const { db } = useApp()
  const me = useCurrentUser()
  const toast = useToast()

  const [name, setName] = useState(me.name)
  const [branch, setBranch] = useState(me.branch)
  const [year, setYear] = useState(me.year)
  const [bio, setBio] = useState(me.bio)
  const [format, setFormat] = useState(me.format)
  const [availability, setAvailability] = useState<string[]>(me.availability)
  const [teaches, setTeaches] = useState<ExchangeSkill[]>(me.teaches)
  const [wants, setWants] = useState<ExchangeSkill[]>(me.wants)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const rating = ratingFor(me.id, db)
  const sessions = listSessionsForUser(me.id, db)
  const taught = sessions.filter((s) => s.teacherId === me.id && s.status === 'completed').length
  const learned = sessions.filter((s) => s.learnerId === me.id && s.status === 'completed').length

  const toggleAvailability = (slot: string) => {
    setAvailability((current) =>
      current.includes(slot) ? current.filter((entry) => entry !== slot) : [...current, slot],
    )
  }

  const save = async () => {
    if (saving) return
    if (!name.trim()) {
      setError('Your name cannot be empty.')
      return
    }
    setError('')
    setSaving(true)
    try {
      await updateUser(me.id, {
        name: name.trim(),
        branch: branch.trim(),
        year,
        bio: bio.trim(),
        format,
        availability,
        teaches,
        wants,
      })
      toast('Profile saved')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">My profile</h1>
          <p>Two lists, one identity. What you can teach is what someone else is searching for.</p>
        </div>
        <div className="row gap-8">
          <Link to={`/u/${me.id}`} className="btn btn-outline btn-sm">
            <Icon name="eye" size={15} />
            Preview public profile
          </Link>
          <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
            <Icon name="check" size={15} />
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </header>

      <div className="sidebar-layout">
        <div className="stack gap-16">
          <div className="card">
            <div className="row gap-16" style={{ marginBottom: 18 }}>
              <Avatar user={{ ...me, hue: me.hue }} size="xl" ring />
              <div>
                <div style={{ fontSize: '1.05rem', fontWeight: 600 }}>{name || 'Your name'}</div>
                <div className="faint" style={{ fontSize: '0.8rem', marginTop: 2 }}>
                  @{me.handle} · joined {new Date(me.joinedAt).getFullYear()}
                </div>
                <div style={{ marginTop: 6 }}>
                  <RatingStars value={rating.average} count={rating.count} size={12} />
                </div>
              </div>
            </div>

            <div className="stack gap-14">
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="field">
                  <label htmlFor="profile-name">Name</label>
                  <input
                    id="profile-name"
                    className="input"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="profile-branch">Branch</label>
                  <input
                    id="profile-branch"
                    className="input"
                    value={branch}
                    onChange={(event) => setBranch(event.target.value)}
                  />
                </div>
              </div>

              <div className="grid-2" style={{ gap: 12 }}>
                <div className="field">
                  <label htmlFor="profile-year">Year</label>
                  <select
                    id="profile-year"
                    className="select"
                    value={year}
                    onChange={(event) => setYear(event.target.value)}
                  >
                    {['1st year', '2nd year', '3rd year', '4th year', 'Postgraduate'].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="profile-format">Preferred format</label>
                  <select
                    id="profile-format"
                    className="select"
                    value={format}
                    onChange={(event) => setFormat(event.target.value as typeof format)}
                  >
                    {['Either', 'Online', 'On campus'].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field">
                <label htmlFor="profile-bio">Bio</label>
                <textarea
                  id="profile-bio"
                  className="textarea"
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  maxLength={320}
                />
                <span className="field-hint">
                  {bio.length}/320 — say how you teach, not just what you know.
                </span>
              </div>

              <div className="field">
                <span className="field-label">Availability</span>
                <div className="chip-row">
                  {AVAILABILITY.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      className={`chip${availability.includes(slot) ? ' is-on' : ''}`}
                      onClick={() => toggleAvailability(slot)}
                      aria-pressed={availability.includes(slot)}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="row gap-6" style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>
                  <Icon name="x" size={14} />
                  {error}
                </div>
              )}
            </div>
          </div>

          <SkillEditor
            title="I can teach"
            hint="Only list what you could genuinely walk someone through."
            tone="teach"
            value={teaches}
            onChange={setTeaches}
            defaultLevel="Intermediate"
          />

          <SkillEditor
            title="I want to learn"
            hint="These drive your match scores — be specific."
            tone="learn"
            value={wants}
            onChange={setWants}
            defaultLevel="Beginner"
          />

          <div className="row gap-10" style={{ justifyContent: 'flex-end' }}>
            <Link to="/matches" className="btn btn-outline">
              See my matches
            </Link>
            <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
              <Icon name="check" size={16} />
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>

        <aside className="stack gap-14">
          <div className="card card-flat">
            <div className="eyebrow" style={{ marginBottom: 12 }}>
              At a glance
            </div>
            <div className="grid-2" style={{ gap: 16 }}>
              <div className="stat">
                <span className="stat-value">{teaches.length}</span>
                <span className="stat-label">Teaching</span>
              </div>
              <div className="stat">
                <span className="stat-value">{wants.length}</span>
                <span className="stat-label">Learning</span>
              </div>
              <div className="stat">
                <span className="stat-value">{taught}</span>
                <span className="stat-label">Taught</span>
              </div>
              <div className="stat">
                <span className="stat-value">{learned}</span>
                <span className="stat-label">Learned</span>
              </div>
            </div>
          </div>

          <div className="card card-flat">
            <div className="eyebrow" style={{ marginBottom: 10 }}>
              Why levels matter
            </div>
            <p className="faint" style={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
              A beginner asking an advanced teacher is the best pairing on Twofold. Marking your own
              level honestly is what makes the match scores useful instead of flattering.
            </p>
          </div>

          <div className="card card-glow">
            <div className="row gap-8" style={{ marginBottom: 8 }}>
              <Icon name="sparkles" size={16} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Add at least one of each</span>
            </div>
            <p className="faint" style={{ fontSize: '0.8rem', lineHeight: 1.55 }}>
              With both lists populated, the engine can find two-way swaps — where you both teach and
              both learn.
            </p>
          </div>
        </aside>
      </div>
    </>
  )
}
