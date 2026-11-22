// Mirror of scoreLead()/starsFromScore() in backend/Code.gs, used ONLY to show the LifeSaver a live
// quality meter while they fill in the form. The server recomputes the real rating on submit.
// Keep this in sync with Code.gs (the parity test compares them, including the lists below).
export const STAR_THRESHOLDS = [[85, 5], [70, 4], [55, 3], [45, 2]]

export const HEALTH_CONDITIONS = [
  'Diabetes', 'Heart disease or heart attack', 'Stroke', 'Cancer (current or past)',
  'Kidney disease or renal failure', 'High blood pressure', 'COPD, emphysema or lung disease',
  'Liver disease or hepatitis', 'HIV/AIDS', "Alzheimer's or dementia", 'Alcohol or drug treatment',
]
export const NONE_OF_THESE = 'None of these'
export const RELATIONSHIPS = ['Spouse', 'Son', 'Daughter', 'Parent', 'Sibling', 'Other family', 'Friend', 'Other']
export const POLICY_TYPES = ['General life insurance', 'Final expense / burial', 'Cremation', 'Leave money / legacy',
  'Mortgage protection', 'IUL', 'Annuity', 'Safe retirement planning', 'Other / Not sure']
export const TIMELINES = ['Same day coverage', '1 week', '2 weeks', '3 weeks', '4 weeks']
export const US_STATES = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO',
  'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY']
export const CONDITIONS_MAX_POINTS = 7   // owner rule: "None of these" = 7; each condition checked takes 1 off, floor 0
export const MAX_BENEFICIARY_ROWS = 5

// "About the conversation" (asked about the referral)
export const READY_OPTIONS = ['Yes, expecting a call', 'Maybe, needs a nudge', 'Not yet']
export const CONSENT_OPTIONS = ['Yes, they agreed', 'No']
export const EXISTING_OPTIONS = ['None', 'Through employer only', 'Has an individual policy', 'Not sure']
export const AMOUNT_OPTIONS = ['Under $50k', '$50k to $100k', '$100k to $250k', '$250k to $500k', '$500k or more', 'Not sure']
export const DEPENDENTS_OPTIONS = ['None', '1', '2 or more']
export const BEST_TIME_OPTIONS = ['Morning', 'Afternoon', 'Evening', 'Weekends']

// Old timeline values stay so referrals submitted before the change still score the same way.
const TIMELINE_POINTS = { 'Same day coverage': 14, '1 week': 11, '2 weeks': 8, '3 weeks': 5, '4 weeks': 2, '1 to 3 months': 14, '3 to 6 months': 8, '6 to 12 months': 4 }
const READY_POINTS = { 'Yes, expecting a call': 8, 'Maybe, needs a nudge': 4, 'Not yet': 0 }
const CONSENT_POINTS = { 'Yes, they agreed': 6, 'No': 0 }
const EXISTING_POINTS = { 'None': 2, 'Through employer only': 2, 'Has an individual policy': 1, 'Not sure': 1 }
const AMOUNT_POINTS = { 'Under $50k': 2, '$50k to $100k': 2, '$100k to $250k': 2, '$250k to $500k': 2, '$500k or more': 2, 'Not sure': 1 }
const DEPENDENTS_POINTS = { 'None': 1, '1': 1, '2 or more': 2 }

const ptsFrom = (map, v) => {
  v = String(v ?? '')
  return Object.prototype.hasOwnProperty.call(map, v) ? map[v] : 0
}
const digits = (v) => String(v || '').replace(/\D/g, '')

// Each row: points earned now, the most it could earn, and a tip if there is room to improve.
// Contact 16 | Beneficiaries 11 | Health 17 | Policy type 12 | Timeline 14 | Notes 10 | Conversation 20 = 100
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
  const notes = String(d.notes || '').trim().length
  const smoking = String(d.smoking || '')
  const conds = d.healthConditions || []

  return [
    { key: 'phone', label: 'Phone number', max: 8, pts: digits(d.phone).length >= 10 ? 8 : 0, tip: 'Add a full 10-digit phone number' },
    { key: 'email', label: 'Email address', max: 4, pts: /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(d.email || '').trim()) ? 4 : 0, tip: 'Add an email address' },
    { key: 'location', label: 'State', max: 4, pts: US_STATES.includes(String(d.state || '').toUpperCase().trim()) ? 4 : 0, tip: "Choose the referral's state" },
    { key: 'beneficiaries', label: 'Beneficiaries listed', max: 6, pts: ben >= 2 ? 6 : ben === 1 ? 4 : 0, tip: "List the referral's beneficiaries (2 or more is best)" },
    { key: 'beneficiaryDetails', label: 'Beneficiary names and relationships', max: 5, pts: rowsListed > 0 ? Math.round((5 * complete) / rowsListed) : 0, tip: 'Name each beneficiary and say how they are related' },
    { key: 'health', label: 'Health rating', max: 6, pts: health >= 7 ? 6 : health >= 4 ? 3 : 0, tip: "Ask about the referral's overall health" },
    { key: 'conditions', label: 'Health conditions', max: CONDITIONS_MAX_POINTS, pts: conds.length === 0 ? 0 : conds.includes(NONE_OF_THESE) ? CONDITIONS_MAX_POINTS : Math.max(0, CONDITIONS_MAX_POINTS - conds.length), tip: 'Go through the health conditions list (check "None of these" if none apply)', onlyIfBlank: true },
    { key: 'smoking', label: 'Smoking status', max: 4, pts: smoking === 'Non-Smoker' ? 4 : smoking === 'Former Smoker' ? 2 : smoking === 'Smoker' ? 1 : 0, tip: 'Ask about smoking' },
    { key: 'policy', label: 'Policy type', max: 12, pts: policy && !policy.includes('Not sure') ? 12 : policy ? 2 : 0, tip: 'Find out what type of policy the referral wants' },
    { key: 'timeline', label: 'Purchase timeline', max: 14, pts: ptsFrom(TIMELINE_POINTS, d.timeline), tip: 'Find out how soon the referral wants coverage' },
    { key: 'notes', label: 'Notes', max: 10, pts: notes >= 150 ? 10 : notes >= 30 ? 6 : notes > 0 ? 3 : 0, tip: 'Write a few sentences about the referral (150+ characters)' },
    { key: 'readyForCall', label: 'Ready to take a call', max: 8, pts: ptsFrom(READY_POINTS, d.readyForCall), tip: 'Ask if the referral is ready to take a call' },
    { key: 'agreedToContact', label: 'Agreed to hear from an agent', max: 6, pts: ptsFrom(CONSENT_POINTS, d.agreedToContact), tip: 'Ask if the referral agrees to hear from an agent' },
    { key: 'existingCoverage', label: 'Existing coverage', max: 2, pts: ptsFrom(EXISTING_POINTS, d.existingCoverage), tip: "Ask about the referral's current coverage" },
    { key: 'coverageAmount', label: 'Coverage amount', max: 2, pts: ptsFrom(AMOUNT_POINTS, d.coverageAmount), tip: 'Ask how much coverage the referral has in mind' },
    { key: 'dependents', label: 'Dependents', max: 2, pts: ptsFrom(DEPENDENTS_POINTS, d.dependents), tip: "Ask who depends on the referral's income" },
  ]
}

export function starsFromScore(score) {
  for (const [min, stars] of STAR_THRESHOLDS) if (score >= min) return stars
  return 1
}

export function scoreLead(d) {
  const rows = scoreBreakdown(d)
  const score = rows.reduce((s, r) => s + r.pts, 0)
  // The conditions row only gets a tip while it is unanswered: a checked condition is a fact, not something to "fix".
  const tips = rows.filter((r) => r.pts < r.max && !(r.onlyIfBlank && (d.healthConditions || []).length > 0))
    .sort((a, b) => (b.max - b.pts) - (a.max - a.pts)).slice(0, 3)
  return { score, stars: starsFromScore(score), tips, rows }
}
