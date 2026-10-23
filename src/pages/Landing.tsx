import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { getUser } from '../data/api'
import { Avatar } from '../components/Avatar'
import { MatchRing } from '../components/MatchRing'
import { Reveal } from '../components/Reveal'
import { Icon, type IconName } from '../components/icons'

const FEATURES: Array<{ icon: IconName; title: string; text: string }> = [
  {
    icon: 'sparkles',
    title: 'Matching that understands reciprocity',
    text: 'Twofold scores every student on four signals — what they can teach you, what you can teach them, shared subject areas and their review history — so the swap runs both ways.',
  },
  {
    icon: 'calendar',
    title: 'Chat, schedule, show up',
    text: 'Message in-app, propose up to three times, and the confirmed slot drops straight into Google, Apple or Outlook calendar as a standard .ics file.',
  },
  {
    icon: 'shield',
    title: 'Trust you can measure',
    text: 'Every completed exchange ends with a rating. Those reviews are public on each profile and feed back into the matching engine, so good teachers surface first.',
  },
]

const STEPS = [
  {
    title: 'List your two sides',
    text: 'Add the skills you can actually teach and the ones you want to learn. Levels included — “beginner Rust” is not the same as “advanced”.',
  },
  {
    title: 'Meet your match',
    text: 'The engine ranks students by how much of a two-way swap they represent, and shows exactly why each score landed where it did.',
  },
  {
    title: 'Swap, then rate',
    text: 'Agree a time, meet online or on campus, and leave a short review. The next student searching that skill sees your words.',
  },
]

export function Landing() {
  const { db, user } = useApp()
  const aarav = getUser('u_aarav', db)
  const riya = getUser('u_riya', db)
  const course = user ? '/discover' : '/auth'

  const completed = db.sessions.filter((session) => session.status === 'completed').length
  const ratings = db.reviews.map((review) => review.rating)
  const average = ratings.length
    ? (ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(1)
    : '—'

  return (
    <div className="landing">
      <nav className="landing-nav">
        <Link to="/" className="brand">
          <span className="brand-mark">
            <Icon name="swap" size={17} strokeWidth={2} />
          </span>
          <span className="brand-name">
            twofold<span>.</span>
          </span>
        </Link>
        <div className="landing-links">
          <a href="#how">How it works</a>
          <a href="#why">Why it works</a>
          <Link to={course} className="btn btn-primary btn-sm">
            {user ? 'Back to app' : 'Enter the demo'}
            <Icon name="arrowRight" size={15} />
          </Link>
        </div>
      </nav>

      <header className="hero">
        <div>
          <span className="hero-badge">
            <span className="dot" />
            Live demo · no signup, no server
          </span>

          <h1>
            Trade what you know
            <br />
            for <em>what you wish you knew.</em>
          </h1>

          <p className="hero-sub">
            Twofold pairs students who can teach a skill with students who want to learn it — and the
            other way round. No money, no middlemen. Just two people and a fair swap.
          </p>

          <div className="hero-actions">
            <Link to={course} className="btn btn-primary btn-lg">
              {user ? 'Open the app' : 'Start swapping'}
              <Icon name="arrowRight" size={17} />
            </Link>
            <a href="#how" className="btn btn-outline btn-lg">
              See how it works
            </a>
          </div>

          <div className="hero-stats">
            <div className="stat">
              <span className="stat-value">{db.users.length}</span>
              <span className="stat-label">Students</span>
            </div>
            <div className="stat">
              <span className="stat-value">{db.skills.length}</span>
              <span className="stat-label">Skills listed</span>
            </div>
            <div className="stat">
              <span className="stat-value">{completed}</span>
              <span className="stat-label">Swaps made</span>
            </div>
            <div className="stat">
              <span className="stat-value">{average}</span>
              <span className="stat-label">Avg rating</span>
            </div>
          </div>
        </div>

        <div className="hero-art">
          <div className="hero-float hero-float-b">
            <Icon name="sparkles" size={14} />
            <span>
              <strong>2-way swap</strong> detected
            </span>
          </div>

          <div className="hero-panel">
            <div className="row between gap-12" style={{ marginBottom: 16 }}>
              <div className="row gap-10">
                <div style={{ display: 'flex' }}>
                  {aarav && <Avatar user={aarav} size="md" />}
                  {riya && (
                    <div style={{ marginLeft: -10 }}>
                      <Avatar user={riya} size="md" />
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 600, letterSpacing: '-0.01em' }}>
                    Aarav &amp; Riya
                  </div>
                  <div className="faint" style={{ fontSize: '0.72rem' }}>
                    Computer Science · Interaction Design
                  </div>
                </div>
              </div>
              <MatchRing score={94} size={52} stroke={3.5} />
            </div>

            <div className="exchange">
              <div className="exchange-col">
                <span className="exchange-label teach">
                  <i /> Aarav teaches
                </span>
                <span className="exchange-skill">React</span>
                <span className="chip chip-ember" style={{ alignSelf: 'flex-start' }}>
                  Advanced
                </span>
              </div>
              <span className="exchange-arrow">
                <Icon name="swap" size={15} />
              </span>
              <div className="exchange-col">
                <span className="exchange-label learn">
                  <i /> Riya teaches
                </span>
                <span className="exchange-skill">Figma</span>
                <span className="chip chip-mint" style={{ alignSelf: 'flex-start' }}>
                  Advanced
                </span>
              </div>
            </div>

            <div className="row between gap-10" style={{ marginTop: 14 }}>
              <div className="chip-row">
                <span className="chip">
                  <Icon name="calendar" size={12} />
                  Thu, 5:00 PM
                </span>
                <span className="chip">
                  <Icon name="award" size={12} />
                  4.9 rating
                </span>
              </div>
              <Link to={course} className="btn btn-primary btn-sm">
                Request
              </Link>
            </div>
          </div>

          <div className="hero-float hero-float-a">
            <span className="chip chip-mint">
              <Icon name="checkCircle" size={12} />
              Confirmed
            </span>
            <span>Calendar invite sent</span>
          </div>
        </div>
      </header>

      <section className="band" id="how">
        <Reveal>
          <div className="band-head">
            <span className="eyebrow">How it works</span>
            <h2>
              Three steps, <span className="grad-text">one fair trade.</span>
            </h2>
            <p>
              No listings, no bidding, no money changing hands. Twofold is built around the idea that
              every student already owns something worth teaching.
            </p>
          </div>
        </Reveal>

        <div className="steps">
          {STEPS.map((step, index) => (
            <Reveal key={step.title} delay={index * 90}>
              <div className="step" style={{ height: '100%' }}>
                <span className="step-num">0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="band" id="why">
        <Reveal>
          <div className="band-head">
            <span className="eyebrow">Why it works</span>
            <h2>Built to be used once a week, not once a year.</h2>
          </div>
        </Reveal>

        <div className="feature-grid">
          {FEATURES.map((feature, index) => (
            <Reveal key={feature.title} delay={index * 90}>
              <div className="feature" style={{ height: '100%' }}>
                <span className="feature-icon">
                  <Icon name={feature.icon} size={18} />
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="cta-band">
        <Reveal>
          <div className="cta-inner">
            <div>
              <h2>
                Your next skill is <span className="grad-text">one swap away.</span>
              </h2>
              <p>
                Seed accounts are already loaded with profiles, sessions and conversations. Pick a
                student and the whole flow is live.
              </p>
            </div>
            <Link to={course} className="btn btn-primary btn-lg">
              Enter the demo
              <Icon name="arrowUpRight" size={17} />
            </Link>
          </div>
        </Reveal>
      </section>

      <footer className="landing-foot">
        <span>Twofold — a local-first demo of a peer-to-peer skill exchange.</span>
        <span className="row gap-6">
          <Icon name="shield" size={13} />
          Runs entirely in your browser
        </span>
      </footer>
    </div>
  )
}
