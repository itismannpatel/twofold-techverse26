import type { Level } from '../src/data/types'
import { SKILLS } from '../src/data/catalog'

/**
 * Seed dataset for the demo.
 *
 * Dates are computed relative to process startup, so the app never shows a
 * stale "in 3 days". The database is reseeded on every server boot; use the
 * "Reset demo data" button (or `npm run db:reset`) to refresh during a run.
 */

const NOW = new Date()

/** ISO timestamp at `dayOffset` days from seeding, at a given local hour. */
function at(dayOffset: number, hour = 18, minute = 0): string {
  const d = new Date(NOW)
  d.setDate(d.getDate() + dayOffset)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

interface SeedUser {
  id: string
  name: string
  handle: string
  email: string
  branch: string
  year: string
  bio: string
  teaches: Array<{ skillId: string; level: Level }>
  wants: Array<{ skillId: string; level: Level }>
  availability: string[]
  format: 'Online' | 'On campus' | 'Either'
  joinedAt: string
  hue: number
  verified: boolean
}

interface SeedSession {
  id: string
  teacherId: string
  learnerId: string
  skillId: string
  topic: string
  status: 'proposed' | 'confirmed' | 'completed'
  proposedSlots: string[]
  scheduledFor?: string
  createdAt: string
  completedAt?: string
  note?: string
}

interface SeedReview {
  id: string
  sessionId: string
  fromUserId: string
  toUserId: string
  rating: number
  text: string
  createdAt: string
  role: 'taught' | 'learned'
}

interface SeedMessage {
  id: string
  fromUserId: string
  toUserId: string
  body: string
  createdAt: string
  readBy: string[]
}

const T = (skillId: string, level: Level = 'Intermediate') => ({ skillId, level })
const W = (skillId: string, level: Level = 'Beginner') => ({ skillId, level })

export const SEED_USERS: SeedUser[] = [
  {
    id: 'u_aarav',
    name: 'Aarav Mehta',
    handle: 'aarav',
    email: 'aarav.mehta@campus.edu',
    branch: 'Computer Science',
    year: '3rd year',
    bio: 'Frontend developer who ships side projects faster than he finishes them. Happy to walk you through React from first principles — no magic, no copy-paste.',
    teaches: [T('sk_react', 'Advanced'), T('sk_pm'), T('sk_photo')],
    wants: [W('sk_speaking'), W('sk_figma'), W('sk_guitar')],
    availability: ['Weekday evenings', 'Saturday mornings'],
    format: 'Either',
    joinedAt: at(-210, 10),
    hue: 24,
    verified: true,
  },
  {
    id: 'u_riya',
    name: 'Riya Sharma',
    handle: 'riya',
    email: 'riya.sharma@campus.edu',
    branch: 'Interaction Design',
    year: '2nd year',
    bio: 'Design lead for the campus fest site. I teach Figma the way I wish someone taught me: messy first draft, then polish — never the other way around.',
    teaches: [T('sk_figma', 'Advanced'), T('sk_speaking'), T('sk_uiux', 'Advanced')],
    wants: [W('sk_react'), W('sk_photo'), W('sk_marketing')],
    availability: ['Weekday afternoons', 'Sunday evenings'],
    format: 'On campus',
    joinedAt: at(-180, 9),
    hue: 340,
    verified: true,
  },
  {
    id: 'u_kabir',
    name: 'Kabir Nair',
    handle: 'kabir',
    email: 'kabir.nair@campus.edu',
    branch: 'Music Technology',
    year: '4th year',
    bio: 'Guitarist and bedroom producer. I have taught forty people the four chords that unlock nine hundred songs. Ask me about sidechain compression.',
    teaches: [T('sk_guitar', 'Advanced'), T('sk_production'), T('sk_spanish')],
    wants: [W('sk_react'), W('sk_film'), W('sk_pitching')],
    availability: ['Weeknights after 8', 'Saturday afternoons'],
    format: 'Either',
    joinedAt: at(-300, 16),
    hue: 270,
    verified: true,
  },
  {
    id: 'u_ananya',
    name: 'Ananya Iyer',
    handle: 'ananya',
    email: 'ananya.iyer@campus.edu',
    branch: 'Computer Science',
    year: '4th year',
    bio: 'Compilers, systems, and an unreasonable amount of coffee. I will trade Rust for someone who can teach me product sense without the buzzwords.',
    teaches: [T('sk_rust', 'Advanced'), T('sk_python', 'Advanced'), T('sk_ml')],
    wants: [W('sk_pm'), W('sk_figma'), W('sk_speaking')],
    availability: ['Weekday mornings', 'Saturday evenings'],
    format: 'Online',
    joinedAt: at(-320, 11),
    hue: 190,
    verified: true,
  },
  {
    id: 'u_dev',
    name: 'Dev Patel',
    handle: 'dev',
    email: 'dev.patel@campus.edu',
    branch: 'Mechanical Engineering',
    year: '2nd year',
    bio: 'Engineering student who tutors to stay sharp. Calculus is just storytelling with symbols — I can prove it.',
    teaches: [T('sk_calculus', 'Advanced'), T('sk_physics'), T('sk_guitar')],
    wants: [W('sk_react'), W('sk_photo'), W('sk_writing')],
    availability: ['Weekday evenings', 'Sunday mornings'],
    format: 'On campus',
    joinedAt: at(-140, 15),
    hue: 45,
    verified: true,
  },
  {
    id: 'u_meera',
    name: 'Meera Krishnan',
    handle: 'meera',
    email: 'meera.krishnan@campus.edu',
    branch: 'Economics',
    year: '3rd year',
    bio: 'Debate team, three languages, one yoga mat. I break public speaking into drills you can practise alone in your room.',
    teaches: [T('sk_spanish', 'Advanced'), T('sk_speaking', 'Advanced'), T('sk_yoga')],
    wants: [W('sk_marketing'), W('sk_pm'), W('sk_excel')],
    availability: ['Early mornings', 'Weekday afternoons'],
    format: 'Either',
    joinedAt: at(-260, 8),
    hue: 10,
    verified: true,
  },
  {
    id: 'u_zoya',
    name: 'Zoya Khan',
    handle: 'zoya',
    email: 'zoya.khan@campus.edu',
    branch: 'Fine Arts',
    year: '3rd year',
    bio: 'Illustrator and motion tinkerer. I teach shape language first, software second — the other order is why most people give up.',
    teaches: [T('sk_illustration', 'Advanced'), T('sk_motion'), T('sk_figma')],
    wants: [W('sk_react'), W('sk_sql'), W('sk_writing')],
    availability: ['Weekday afternoons', 'Friday evenings'],
    format: 'Either',
    joinedAt: at(-200, 13),
    hue: 300,
    verified: true,
  },
  {
    id: 'u_arjun',
    name: 'Arjun Reddy',
    handle: 'arjun',
    email: 'arjun.reddy@campus.edu',
    branch: 'Computer Science',
    year: '2nd year',
    bio: 'Competitive programmer, second-year. I can make data structures feel obvious with a whiteboard and about forty minutes.',
    teaches: [T('sk_dsa', 'Advanced'), T('sk_cpp', 'Advanced'), T('sk_calisthenics')],
    wants: [W('sk_react'), W('sk_photo'), W('sk_writing')],
    availability: ['Weekday evenings', 'Saturday mornings'],
    format: 'On campus',
    joinedAt: at(-120, 17),
    hue: 210,
    verified: true,
  },
  {
    id: 'u_isha',
    name: 'Isha Bansal',
    handle: 'isha',
    email: 'isha.bansal@campus.edu',
    branch: 'English Literature',
    year: '3rd year',
    bio: 'Editor for the student paper. I fix writing without flattening your voice — and I will make you cut your favourite sentence.',
    teaches: [T('sk_writing', 'Advanced'), T('sk_marketing'), T('sk_excel')],
    wants: [W('sk_figma'), W('sk_photo'), W('sk_speaking')],
    availability: ['Weekday mornings', 'Sunday afternoons'],
    format: 'Online',
    joinedAt: at(-240, 12),
    hue: 160,
    verified: true,
  },
  {
    id: 'u_rohan',
    name: 'Rohan Das',
    handle: 'rohan',
    email: 'rohan.das@campus.edu',
    branch: 'Film & Media',
    year: '4th year',
    bio: 'I cut trailers for the film society. Editing is rhythm — I will teach you to feel the cut before you learn the shortcut keys.',
    teaches: [T('sk_film', 'Advanced'), T('sk_photo', 'Advanced'), T('sk_blender')],
    wants: [W('sk_guitar'), W('sk_pm'), W('sk_speaking')],
    availability: ['Weeknights after 9', 'Saturday evenings'],
    format: 'Either',
    joinedAt: at(-280, 19),
    hue: 250,
    verified: true,
  },
  {
    id: 'u_tara',
    name: 'Tara Menon',
    handle: 'tara',
    email: 'tara.menon@campus.edu',
    branch: 'Linguistics',
    year: '2nd year',
    bio: 'Japanese learner turned tutor, classically trained pianist. Language is a game of patterns and I am a very good coach.',
    teaches: [T('sk_japanese'), T('sk_piano', 'Advanced'), T('sk_singing')],
    wants: [W('sk_react'), W('sk_photo'), W('sk_speaking')],
    availability: ['Weekday afternoons', 'Sunday mornings'],
    format: 'On campus',
    joinedAt: at(-100, 14),
    hue: 120,
    verified: true,
  },
  {
    id: 'u_nikhil',
    name: 'Nikhil Rao',
    handle: 'nikhil',
    email: 'nikhil.rao@campus.edu',
    branch: 'Commerce',
    year: '4th year',
    bio: 'Analyst by day, spreadsheet evangelist by night. Ask me why your model breaks when someone inserts a column.',
    teaches: [T('sk_sql', 'Advanced'), T('sk_finance', 'Advanced'), T('sk_ml')],
    wants: [W('sk_figma'), W('sk_marketing'), W('sk_guitar')],
    availability: ['Weekday evenings', 'Saturday afternoons'],
    format: 'Online',
    joinedAt: at(-310, 10),
    hue: 30,
    verified: true,
  },
]

export const SEED_SESSIONS: SeedSession[] = [
  {
    id: 's_figma',
    teacherId: 'u_riya',
    learnerId: 'u_aarav',
    skillId: 'sk_figma',
    topic: 'Auto-layout and components for the fest site',
    status: 'confirmed',
    proposedSlots: [at(3, 17), at(4, 17)],
    scheduledFor: at(3, 17),
    createdAt: at(-2, 11),
    note: 'Bring one screen you are stuck on.',
  },
  {
    id: 's_react_kabir',
    teacherId: 'u_aarav',
    learnerId: 'u_kabir',
    skillId: 'sk_react',
    topic: 'Building a practice looper — state and audio',
    status: 'proposed',
    proposedSlots: [at(4, 18), at(6, 11), at(7, 18)],
    createdAt: at(-1, 20),
    note: 'I have a rough prototype, mostly need help with state.',
  },
  {
    id: 's_react_arjun',
    teacherId: 'u_aarav',
    learnerId: 'u_arjun',
    skillId: 'sk_react',
    topic: 'Hooks from scratch — state, effects, and when not to use them',
    status: 'completed',
    proposedSlots: [at(-7, 17)],
    scheduledFor: at(-6, 17),
    createdAt: at(-9, 12),
    completedAt: at(-6, 18),
  },
  {
    id: 's_speaking',
    teacherId: 'u_meera',
    learnerId: 'u_aarav',
    skillId: 'sk_speaking',
    topic: 'Opening 30 seconds — killing the nervous ramble',
    status: 'confirmed',
    proposedSlots: [at(6, 16)],
    scheduledFor: at(6, 16),
    createdAt: at(-1, 9),
  },
  {
    id: 's_photo_tara',
    teacherId: 'u_aarav',
    learnerId: 'u_tara',
    skillId: 'sk_photo',
    topic: 'Manual mode: aperture, shutter, and one good lens',
    status: 'completed',
    proposedSlots: [at(-22, 11)],
    scheduledFor: at(-21, 11),
    createdAt: at(-25, 15),
    completedAt: at(-21, 12),
  },
  {
    id: 's_illu',
    teacherId: 'u_zoya',
    learnerId: 'u_isha',
    skillId: 'sk_illustration',
    topic: 'Shape language before software',
    status: 'completed',
    proposedSlots: [at(-13, 15)],
    scheduledFor: at(-12, 15),
    createdAt: at(-16, 10),
    completedAt: at(-12, 16),
  },
  {
    id: 's_excel',
    teacherId: 'u_nikhil',
    learnerId: 'u_meera',
    skillId: 'sk_excel',
    topic: 'Dynamic models that survive a new column',
    status: 'completed',
    proposedSlots: [at(-31, 18)],
    scheduledFor: at(-30, 18),
    createdAt: at(-34, 11),
    completedAt: at(-30, 19),
  },
  {
    id: 's_dsa',
    teacherId: 'u_arjun',
    learnerId: 'u_dev',
    skillId: 'sk_dsa',
    topic: 'Graphs without panic — BFS and DFS',
    status: 'completed',
    proposedSlots: [at(-10, 19)],
    scheduledFor: at(-9, 19),
    createdAt: at(-12, 14),
    completedAt: at(-9, 20),
  },
  {
    id: 's_ux',
    teacherId: 'u_riya',
    learnerId: 'u_zoya',
    skillId: 'sk_uiux',
    topic: 'Wireframing a portfolio that reads in ten seconds',
    status: 'completed',
    proposedSlots: [at(-26, 16)],
    scheduledFor: at(-25, 16),
    createdAt: at(-29, 9),
    completedAt: at(-25, 17),
  },
  {
    id: 's_guitar',
    teacherId: 'u_dev',
    learnerId: 'u_kabir',
    skillId: 'sk_guitar',
    topic: 'Fingerstyle basics',
    status: 'completed',
    proposedSlots: [at(-41, 17)],
    scheduledFor: at(-40, 17),
    createdAt: at(-44, 13),
    completedAt: at(-40, 18),
  },
  {
    id: 's_sql',
    teacherId: 'u_nikhil',
    learnerId: 'u_tara',
    skillId: 'sk_sql',
    topic: 'Joins you can actually remember',
    status: 'completed',
    proposedSlots: [at(-17, 20)],
    scheduledFor: at(-16, 20),
    createdAt: at(-19, 10),
    completedAt: at(-16, 21),
  },
  {
    id: 's_spanish',
    teacherId: 'u_meera',
    learnerId: 'u_rohan',
    skillId: 'sk_spanish',
    topic: 'Survival Spanish for a film shoot',
    status: 'completed',
    proposedSlots: [at(-56, 11)],
    scheduledFor: at(-55, 11),
    createdAt: at(-59, 16),
    completedAt: at(-55, 12),
  },
]

export const SEED_REVIEWS: SeedReview[] = [
  { id: 'r_arjun_aarav', sessionId: 's_react_arjun', fromUserId: 'u_arjun', toUserId: 'u_aarav', rating: 5, text: 'Aarav debugged my state logic in ten minutes, then made me explain it back to him. That is the best kind of teacher.', createdAt: at(-6, 20), role: 'taught' },
  { id: 'r_tara_aarav', sessionId: 's_photo_tara', fromUserId: 'u_tara', toUserId: 'u_aarav', rating: 4, text: 'Made me shoot in manual for the first time and gave very specific feedback on each frame. Would do a second session.', createdAt: at(-20, 18), role: 'taught' },
  { id: 'r_aarav_tara', sessionId: 's_photo_tara', fromUserId: 'u_aarav', toUserId: 'u_tara', rating: 5, text: 'Turned up with questions already written down. Learner every tutor wants.', createdAt: at(-20, 19), role: 'learned' },
  { id: 'r_isha_zoya', sessionId: 's_illu', fromUserId: 'u_isha', toUserId: 'u_zoya', rating: 5, text: 'Two hours and my line drawings stopped wobbling. She has a real system, not just talent.', createdAt: at(-12, 18), role: 'taught' },
  { id: 'r_zoya_isha', sessionId: 's_illu', fromUserId: 'u_zoya', toUserId: 'u_isha', rating: 4, text: 'Came prepared and took notes the whole way through. Good energy.', createdAt: at(-11, 9), role: 'learned' },
  { id: 'r_meera_nikhil', sessionId: 's_excel', fromUserId: 'u_meera', toUserId: 'u_nikhil', rating: 5, text: 'Rebuilt my whole model live and explained why the old one broke. Genuinely useful, no fluff.', createdAt: at(-30, 21), role: 'taught' },
  { id: 'r_nikhil_meera', sessionId: 's_excel', fromUserId: 'u_nikhil', toUserId: 'u_meera', rating: 4, text: 'Sharp questions, quick learner. Paid me back in Spanish phrases on the spot.', createdAt: at(-29, 12), role: 'learned' },
  { id: 'r_dev_arjun', sessionId: 's_dsa', fromUserId: 'u_dev', toUserId: 'u_arjun', rating: 4, text: 'Whiteboard-first teaching really worked for graphs. Slightly fast at the end when we hit recursion.', createdAt: at(-9, 22), role: 'taught' },
  { id: 'r_arjun_dev', sessionId: 's_dsa', fromUserId: 'u_arjun', toUserId: 'u_dev', rating: 5, text: 'Asked exactly the right questions and then taught me the calculus behind the graph problem. Fair trade.', createdAt: at(-8, 10), role: 'learned' },
  { id: 'r_zoya_riya', sessionId: 's_ux', fromUserId: 'u_zoya', toUserId: 'u_riya', rating: 5, text: 'She cut my portfolio from nine screens to four and it finally made sense. Ruthless in the best way.', createdAt: at(-25, 19), role: 'taught' },
  { id: 'r_riya_zoya', sessionId: 's_ux', fromUserId: 'u_riya', toUserId: 'u_zoya', rating: 4, text: 'Lovely to teach. Already had a strong visual instinct, just needed structure.', createdAt: at(-24, 11), role: 'learned' },
  { id: 'r_kabir_dev', sessionId: 's_guitar', fromUserId: 'u_kabir', toUserId: 'u_dev', rating: 5, text: 'Dev taught me fingerstyle in a way that stuck. Patient, structured, and hilarious about my thumb.', createdAt: at(-40, 20), role: 'taught' },
  { id: 'r_tara_nikhil', sessionId: 's_sql', fromUserId: 'u_tara', toUserId: 'u_nikhil', rating: 4, text: 'Made joins visual with actual diagrams. I still look at the sketch when I write queries.', createdAt: at(-16, 22), role: 'taught' },
  { id: 'r_rohan_meera', sessionId: 's_spanish', fromUserId: 'u_rohan', toUserId: 'u_meera', rating: 5, text: 'She had me ordering food in Spanish by the end of the hour. Nothing else came close to that.', createdAt: at(-55, 14), role: 'taught' },
]

export const SEED_MESSAGES: SeedMessage[] = [
  { id: 'm_1', fromUserId: 'u_riya', toUserId: 'u_aarav', body: 'Hey! Saw Figma on your wishlist — I am running a short session on components this week if you are in.', createdAt: at(-3, 12, 4), readBy: ['u_riya', 'u_aarav'] },
  { id: 'm_2', fromUserId: 'u_aarav', toUserId: 'u_riya', body: 'Absolutely. I have been rebuilding the same card six times and calling it a design system.', createdAt: at(-3, 12, 11), readBy: ['u_riya', 'u_aarav'] },
  { id: 'm_3', fromUserId: 'u_riya', toUserId: 'u_aarav', body: 'Classic. Bring one screen you are stuck on and we will fix it live.', createdAt: at(-3, 12, 15), readBy: ['u_riya', 'u_aarav'] },
  { id: 'm_4', fromUserId: 'u_aarav', toUserId: 'u_riya', body: 'Deal. Thursday at 5?', createdAt: at(-2, 9, 40), readBy: ['u_riya', 'u_aarav'] },
  { id: 'm_5', fromUserId: 'u_riya', toUserId: 'u_aarav', body: 'Locked in. Added it to your sessions — come with the messy version, that is the useful one.', createdAt: at(-2, 10, 2), readBy: ['u_riya', 'u_aarav'] },
  { id: 'm_6', fromUserId: 'u_kabir', toUserId: 'u_aarav', body: 'Saw your React profile. I am trying to build a little looper app and state is eating me alive.', createdAt: at(-1, 20, 18), readBy: ['u_kabir', 'u_aarav'] },
  { id: 'm_7', fromUserId: 'u_aarav', toUserId: 'u_kabir', body: 'Send me what you have — I will read it before we meet so we do not spend the hour setting up.', createdAt: at(-1, 20, 44), readBy: ['u_kabir', 'u_aarav'] },
  { id: 'm_8', fromUserId: 'u_kabir', toUserId: 'u_aarav', body: 'You are a legend. Repo link incoming tonight.', createdAt: at(-1, 21, 3), readBy: ['u_kabir'] },
  { id: 'm_9', fromUserId: 'u_ananya', toUserId: 'u_aarav', body: 'Trading Rust for product sense — interested? I can start you on ownership and lifetimes without the compiler tears.', createdAt: at(0, 9, 12), readBy: ['u_ananya'] },
]

export { SKILLS }
