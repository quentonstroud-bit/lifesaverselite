// Mirror of scoreLead()/starsFromScore() in backend/Code.gs, used ONLY to show the LifeSaver a live
// quality meter while they fill in the form. The server recomputes the real rating on submit.
// Keep this in sync with Code.gs (the parity test compares them, including the lists below).
export const STAR_THRESHOLDS = [[85, 5], [70, 4], [55, 3], [45, 2]]

export const HEALTH_CONDITIONS = [
  'Diabetes', 'Heart disease or heart attack', 'Stroke', 'Cancer (current or past)',
  'Kidney disease or renal failure', 'High blood pressure', 'COPD, emphysema or lung disease',
  'Liver disease or hepatitis', "Alzheimer's or dementia", 'Alcohol or drug treatment',
]
export const NONE_OF_THESE = 'None of these'
export const RELATIONSHIPS = ['Spouse', 'Child', 'Parent', 'Sibling', 'Other family', 'Friend', 'Other']
export const MAX_BENEFICIARY_ROWS = 5

const digits = (v) => String(v || '').replace(/\D/g, '')

// Each row: points earned now, the most it could earn, and a tip if there is room to improve.
export function scoreBreakdown(d) {
  const ben = parseInt(d.beneficiaries, 10) || 0
  const rowsListed = Math.min(ben, MAX_BENEFICIARY_ROWS)
  const det = d.beneficiaryDetails || []
  let complete = 0
  for (let i = 0; i < rowsListed && i < det.length; i++) {
    if (det[i] && String(det[i].name || '').trim().length >= 2 && String(det[i].relationship || '').trim()) complete++
  }
  const health = parseInt(d.healthRating, 10) || 0
  const policy = String(d.policyInterest || '')
  const tl = String(d.timeline || '')
  const notes = String(d.notes || '').trim().length
  const smoking = String(d.smoking || '')
  const conds = d.healthConditions || []

  return [
    { key: 'phone', label: 'Phone number', max: 10, pts: digits(d.phone).length >= 10 ? 10 : 0, tip: 'Add a full 10-digit phone number' },
    { key: 'email', label: 'Email address', max: 5, pts: /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(d.email || '').trim()) ? 5 : 0, tip: 'Add an email address' },
    { key: 'location', label: 'City and state', max: 5, pts: String(d.city || '').trim() && String(d.state || '').trim() ? 5 : 0, tip: 'Add city and state' },
    { key: 'beneficiaries', label: 'Beneficiaries listed', max: 8, pts: ben >= 2 ? 8 : ben === 1 ? 5 : 0, tip: 'List their beneficiaries (2 or more is best)' },
    { key: 'beneficiaryDetails', label: 'Beneficiary names and relationships', max: 7, pts: rowsListed > 0 ? Math.round((7 * complete) / rowsListed) : 0, tip: 'Name each beneficiary and say how they are related' },
    { key: 'health', label: 'Health rating', max: 8, pts: health >= 7 ? 8 : health >= 4 ? 4 : 0, tip: 'Ask about their overall health' },
    { key: 'conditions', label: 'Health conditions', max: 7, pts: conds.length > 0 ? 7 : 0, tip: 'Go through the health conditions list (check "None of these" if none apply)' },
    { key: 'smoking', label: 'Smoking status', max: 5, pts: smoking === 'Non-Smoker' ? 5 : smoking === 'Former Smoker' ? 3 : smoking === 'Smoker' ? 2 : 0, tip: 'Ask about smoking' },
    { key: 'policy', label: 'Policy interest', max: 15, pts: policy && !policy.includes('Not sure') ? 15 : policy ? 3 : 0, tip: 'Find out what type of policy they want' },
    { key: 'timeline', label: 'Purchase timeline', max: 20, pts: tl === '1 to 3 months' ? 20 : tl === '3 to 6 months' ? 12 : tl === '6 to 12 months' ? 6 : 0, tip: 'Find out how soon they want coverage' },
    { key: 'notes', label: 'Notes', max: 10, pts: notes >= 150 ? 10 : notes >= 30 ? 6 : notes > 0 ? 3 : 0, tip: 'Write a few sentences about their situation (150+ characters)' },
  ]
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
