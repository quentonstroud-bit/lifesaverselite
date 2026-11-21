// Mirror of scoreLead()/starsFromScore() in backend/Code.gs, used ONLY to show the LifeSaver a live
// quality meter while they fill in the form. The server recomputes the real rating on submit.
// Keep this in sync with Code.gs (scripts/parity test compares them).
export const STAR_THRESHOLDS = [[85, 5], [70, 4], [55, 3], [45, 2]]

const digits = (v) => String(v || '').replace(/\D/g, '')

// Each row: how many points the answer earns now, the most it could earn, and a tip if there is room to improve.
export function scoreBreakdown(d) {
  const ben = parseInt(d.beneficiaries, 10) || 0
  const health = parseInt(d.healthRating, 10) || 0
  const policy = String(d.policyInterest || '')
  const tl = String(d.timeline || '')
  const notes = String(d.notes || '').trim().length
  const smoking = String(d.smoking || '')
  const rows = [
    { key: 'phone', label: 'Phone number', max: 10, pts: digits(d.phone).length >= 10 ? 10 : 0, tip: 'Add a full 10-digit phone number' },
    { key: 'email', label: 'Email address', max: 5, pts: /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(d.email || '').trim()) ? 5 : 0, tip: 'Add an email address' },
    { key: 'location', label: 'City and state', max: 5, pts: String(d.city || '').trim() && String(d.state || '').trim() ? 5 : 0, tip: 'Add city and state' },
    { key: 'beneficiaries', label: 'Beneficiaries', max: 15, pts: ben >= 2 ? 15 : ben === 1 ? 10 : 0, tip: 'List their beneficiaries (2 or more is best)' },
    { key: 'health', label: 'Health', max: 10, pts: health >= 7 ? 10 : health >= 4 ? 5 : 0, tip: 'Ask about their health' },
    { key: 'smoking', label: 'Smoking status', max: 10, pts: smoking === 'Non-Smoker' ? 10 : smoking === 'Former Smoker' ? 6 : smoking === 'Smoker' ? 3 : 0, tip: 'Ask about smoking' },
    { key: 'policy', label: 'Policy interest', max: 15, pts: policy && !policy.includes('Not sure') ? 15 : policy ? 3 : 0, tip: 'Find out what type of policy they want' },
    { key: 'timeline', label: 'Purchase timeline', max: 20, pts: tl === '1 to 3 months' ? 20 : tl === '3 to 6 months' ? 12 : tl === '6 to 12 months' ? 6 : 0, tip: 'Find out how soon they want coverage' },
    { key: 'notes', label: 'Notes', max: 10, pts: notes >= 100 ? 10 : notes >= 30 ? 6 : notes > 0 ? 3 : 0, tip: 'Write a few sentences about their situation (100+ characters)' },
  ]
  return rows
}

export function starsFromScore(score) {
  for (const [min, stars] of STAR_THRESHOLDS) if (score >= min) return stars
  return 1
}

export function scoreLead(d) {
  const rows = scoreBreakdown(d)
  const score = rows.reduce((s, r) => s + r.pts, 0)
  const tips = rows.filter((r) => r.pts < r.max).sort((a, b) => (b.max - b.pts) - (a.max - a.pts)).slice(0, 3)
  return { score, stars: starsFromScore(score), tips, rows }
}
