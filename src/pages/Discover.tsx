import { useMemo, useState } from 'react'
import { useApp, useCurrentUser } from '../context/AppContext'
import { CATEGORIES, SKILL_BY_ID } from '../data/catalog'
import type { Category } from '../data/types'
import { ratingFor } from '../data/api'
import { scoreEveryone } from '../lib/matching'
import { PersonCard } from '../components/PersonCard'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/icons'

type SortKey = 'match' | 'rating' | 'new'

export function Discover() {
  const { db } = useApp()
  const me = useCurrentUser()

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category | 'All'>('All')
  const [sort, setSort] = useState<SortKey>('match')
  const [twoWayOnly, setTwoWayOnly] = useState(false)

  const scored = useMemo(() => {
    const results = scoreEveryone(me, db)
    return new Map(results.map((match) => [match.user.id, match]))
  }, [me, db])

  const people = useMemo(() => {
    const needle = query.trim().toLowerCase()

    const filtered = db.users
      .filter((person) => person.id !== me.id)
      .filter((person) => {
        if (category !== 'All') {
          const inCategory = [...person.teaches, ...person.wants].some(
            (skill) => SKILL_BY_ID[skill.skillId]?.category === category,
          )
          if (!inCategory) return false
        }
        if (twoWayOnly && !scored.get(person.id)?.reciprocal) return false

        if (!needle) return true

        const skillNames = [...person.teaches, ...person.wants]
          .map((skill) => SKILL_BY_ID[skill.skillId]?.name ?? '')
          .join(' ')
          .toLowerCase()

        return (
          person.name.toLowerCase().includes(needle) ||
          person.branch.toLowerCase().includes(needle) ||
          person.bio.toLowerCase().includes(needle) ||
          skillNames.includes(needle)
        )
      })

    return filtered.sort((a, b) => {
      if (sort === 'match') return (scored.get(b.id)?.score ?? 0) - (scored.get(a.id)?.score ?? 0)
      if (sort === 'rating') return ratingFor(b.id, db).average - ratingFor(a.id, db).average
      return b.joinedAt.localeCompare(a.joinedAt)
    })
  }, [db, me.id, category, twoWayOnly, query, sort, scored])

  const clearFilters = () => {
    setQuery('')
    setCategory('All')
    setTwoWayOnly(false)
  }

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">Discover</h1>
          <p>
            {db.users.length - 1} students trading {db.skills.length} skills. Search a subject, a
            name, or just browse what your campus knows.
          </p>
        </div>
        <div className="row gap-8">
          <span className="chip chip-lg">
            <Icon name="users" size={14} />
            {people.length} shown
          </span>
        </div>
      </header>

      <div className="discover-bar">
        <div className="search">
          <Icon name="search" size={17} />
          <input
            className="input"
            placeholder="Search skills, people or branches…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search students"
          />
          {query && (
            <button type="button" className="search-clear" onClick={() => setQuery('')} aria-label="Clear search">
              <Icon name="x" size={14} />
            </button>
          )}
        </div>

        <select
          className="select"
          style={{ width: 168 }}
          value={sort}
          onChange={(event) => setSort(event.target.value as SortKey)}
          aria-label="Sort results"
        >
          <option value="match">Best match</option>
          <option value="rating">Highest rated</option>
          <option value="new">Newest</option>
        </select>

        <button
          type="button"
          className={`chip chip-lg${twoWayOnly ? ' is-on' : ''}`}
          onClick={() => setTwoWayOnly((value) => !value)}
          aria-pressed={twoWayOnly}
        >
          <Icon name="swap" size={14} />
          Two-way only
        </button>
      </div>

      <div className="category-scroll">
        <button
          type="button"
          className={`chip chip-lg${category === 'All' ? ' is-on' : ''}`}
          onClick={() => setCategory('All')}
        >
          All subjects
        </button>
        {CATEGORIES.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={`chip chip-lg${category === entry.id ? ' is-on' : ''}`}
            onClick={() => setCategory(entry.id)}
          >
            <span aria-hidden="true" style={{ opacity: 0.65, fontSize: '0.9em' }}>
              {entry.glyph}
            </span>
            {entry.label}
          </button>
        ))}
      </div>

      {people.length === 0 ? (
        <EmptyState
          icon="search"
          title="Nothing matches that yet"
          text="Try a broader search, a different subject, or clear the filters to see everyone."
          action={
            <button type="button" className="btn btn-ghost btn-sm" onClick={clearFilters}>
              Clear filters
            </button>
          }
        />
      ) : (
        <div className="grid-cards">
          {people.map((person) => (
            <PersonCard key={person.id} person={person} match={scored.get(person.id)} />
          ))}
        </div>
      )}
    </>
  )
}
