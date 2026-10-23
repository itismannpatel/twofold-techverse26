import type { Database, ExchangeSkill, User } from '../data/types'
import { SKILL_BY_ID } from '../data/catalog'
import { ratingFor } from '../data/api'

/**
 * The matching engine.
 *
 * A match is scored on four signals, weighted to a 0-100 total:
 *
 *   learn    45  how much of *your* wishlist this person can actually teach
 *   teach    35  how much of *their* wishlist you can teach (the reciprocity)
 *   affinity 12  shared subject areas, so adjacent interests surface too
 *   trust     8  their rating history
 *
 * The engine is pure: same inputs always produce the same score, which makes
 * it easy to test and easy to explain in the UI.
 */

export const MATCH_WEIGHTS = { learn: 45, teach: 35, affinity: 12, trust: 8 } as const

export interface MatchBreakdown {
  learn: number
  teach: number
  affinity: number
  trust: number
}

export interface MatchResult {
  user: User
  score: number
  breakdown: MatchBreakdown
  /** Their skills that are on my wishlist. */
  canLearn: ExchangeSkill[]
  /** My skills that are on their wishlist. */
  canTeach: ExchangeSkill[]
  /** True when the exchange runs in both directions. */
  reciprocal: boolean
  reasons: string[]
}

const skillName = (id: string) => SKILL_BY_ID[id]?.name ?? id
const skillCategory = (id: string) => SKILL_BY_ID[id]?.category

function names(skills: ExchangeSkill[]): string {
  const list = skills.map((s) => skillName(s.skillId))
  if (list.length <= 1) return list.join('')
  return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`
}

function categorySet(user: User): Set<string> {
  const set = new Set<string>()
  for (const skill of [...user.teaches, ...user.wants]) {
    const category = skillCategory(skill.skillId)
    if (category) set.add(category)
  }
  return set
}

export function scoreMatch(me: User, them: User, db: Database): MatchResult {
  const myWants = new Set(me.wants.map((s) => s.skillId))
  const theirWants = new Set(them.wants.map((s) => s.skillId))

  const canLearn = them.teaches.filter((s) => myWants.has(s.skillId))
  const canTeach = me.teaches.filter((s) => theirWants.has(s.skillId))

  const learn = Math.min(1, canLearn.length / 2) * MATCH_WEIGHTS.learn
  const teach = Math.min(1, canTeach.length / 2) * MATCH_WEIGHTS.teach

  const mine = categorySet(me)
  const theirs = categorySet(them)
  let shared = 0
  mine.forEach((category) => {
    if (theirs.has(category)) shared += 1
  })
  const affinity = Math.min(1, shared / 3) * MATCH_WEIGHTS.affinity

  const rating = ratingFor(them.id, db)
  const trustValue = rating.count ? rating.average / 5 : 0.6
  const trust = trustValue * MATCH_WEIGHTS.trust

  const breakdown: MatchBreakdown = {
    learn: Math.round(learn * 10) / 10,
    teach: Math.round(teach * 10) / 10,
    affinity: Math.round(affinity * 10) / 10,
    trust: Math.round(trust * 10) / 10,
  }

  const score = Math.round(learn + teach + affinity + trust)
  const reciprocal = canLearn.length > 0 && canTeach.length > 0

  const reasons: string[] = []
  if (canLearn.length) reasons.push(`Teaches ${names(canLearn)} — on your wishlist`)
  if (canTeach.length) reasons.push(`Wants to learn ${names(canTeach)} — you teach it`)
  if (reciprocal) reasons.push('Two-way swap: you both gain something')
  else if (canLearn.length && !canTeach.length) reasons.push('One-way: they have what you want')
  if (rating.count >= 3 && rating.average >= 4.5) reasons.push(`Highly rated — ${rating.average.toFixed(1)} from ${rating.count} sessions`)
  if (!reasons.length) reasons.push('Shared subject areas — worth a conversation')

  return { user: them, score, breakdown, canLearn, canTeach, reciprocal, reasons }
}

/** Everyone else, ranked. Only people who can actually teach you something. */
export function computeMatches(me: User, db: Database): MatchResult[] {
  return db.users
    .filter((u) => u.id !== me.id)
    .map((u) => scoreMatch(me, u, db))
    .filter((m) => m.canLearn.length > 0)
    .sort((a, b) => b.score - a.score || b.user.name.localeCompare(a.user.name))
}

/** All other students with a score, including zero-overlap profiles. */
export function scoreEveryone(me: User, db: Database): MatchResult[] {
  return db.users
    .filter((u) => u.id !== me.id)
    .map((u) => scoreMatch(me, u, db))
    .sort((a, b) => b.score - a.score)
}
