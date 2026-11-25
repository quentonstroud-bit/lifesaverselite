// Authenticated gateway: the ONLY way the browser reaches the Google Apps Script backend.
//   POST /api/gw  { type: 'get',  query, params? }   or   { type: 'post', formType, ...fields }
// Every call needs a valid session (except the two public forms), is role-checked, and has the caller's
// identity injected from the session, never trusted from the request body.
import { getSession, sameOrigin, clientIp } from './_lib/session.js'
import { gasGet, gasPost, lookupUser, throttle, BackendError, backendErrorResponse } from './_lib/gas.js'

const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]))
const MAX_BODY = 20000

// query -> { role, build(user, params) -> params sent to Apps Script }
const GETS = {
  ls_data:            { role: 'lifesaver', build: (u) => ({ email: u.email }) },
  agent_leads:        { role: 'agent',      build: (u) => ({ email: u.email }) },
  agent_lifesavers:   { role: 'agent',      build: (u) => ({ email: u.email }) },
  agent_spend:        { role: 'agent',      build: (u) => ({ email: u.email }) },
  pool_leads:         { role: 'agent',      build: () => ({}) },
  dashboard_stats:    { role: 'admin',      build: () => ({}) },
  admin_lifesavers:   { role: 'admin',      build: () => ({}) },
  admin_agents:       { role: 'admin',      build: () => ({}) },
  admin_leads:        { role: 'admin',      build: () => ({}) },
  admin_revenue:      { role: 'admin',      build: () => ({}) },
  admin_payout_report:{ role: 'admin',      build: (u, p) => (isIso(p.through) ? { through: p.through } : {}) },
  admin_finance:      { role: 'admin',      build: (u, p) => (/^\d{4}$/.test(String(p.year || '')) ? { year: String(p.year) } : {}) },
}

const REFERRAL_FIELDS = ['firstName', 'lastName', 'phone', 'email', 'city', 'state', 'age', 'beneficiaries', 'beneficiaryDetails', 'healthRating', 'healthConditions', 'smoking', 'policyInterest', 'timeline', 'notes',
  'readyForCall', 'agreedToContact', 'existingCoverage', 'coverageAmount', 'dependents', 'bestTime']

// formType -> { role | null (public), build(user, body) -> fields sent to Apps Script }
const POSTS = {
  application: { role: null, public: true, build: (u, b) => pick(b, ['name', 'email', 'phone', 'facebook', 'positions', 'employment', 'insurance', 'referral', 'excites', 'resumeAttached']) },
  agent_enrollment: { role: null, public: true, build: (u, b) => pick(b, ['name', 'agency', 'email', 'phone', 'license', 'states', 'years', 'lines', 'payoutStructure', 'hearAbout', 'paymentMethod']) },
  referral_submit: {
    role: 'lifesaver',
    build: (u, b) => ({
      ...pick(b, REFERRAL_FIELDS),
      beneficiaryDetails: Array.isArray(b.beneficiaryDetails) ? b.beneficiaryDetails.slice(0, 10).map((x) => ({ name: String(x?.name ?? '').slice(0, 80), relationship: String(x?.relationship ?? '').slice(0, 40) })) : [],
      healthConditions: Array.isArray(b.healthConditions) ? b.healthConditions.slice(0, 20).map((x) => String(x).slice(0, 80)) : [],
      lifesaverId: u.id, lifesaverHandle: u.handle, lifesaverEmail: u.email,
    }),
  },
  lead_decline:    { role: 'agent', build: (u, b) => ({ leadId: b.leadId, agentEmail: u.email }) },
  lead_accept:     { role: 'agent', build: (u, b) => ({ leadId: b.leadId, agentEmail: u.email }) },
  claim_from_pool: { role: 'agent', build: (u, b) => ({ leadId: b.leadId, agentEmail: u.email }) },
  lead_rating:     { role: 'admin', build: (u, b) => ({ leadId: b.leadId, stars: b.stars }) },
  approve_lifesaver: { role: 'admin', build: (u, b) => ({ id: b.id }) },
  admin_mark_paid: {
    role: 'admin',
    build: (u, b) => ({
      batchId: b.batchId, through: isIso(b.through) ? b.through : undefined,
      expectedTotal: Number(b.expectedTotal),
      lsIds: Array.isArray(b.lsIds) ? b.lsIds.map(String).slice(0, 2000) : undefined,
    }),
  },
}

function isIso(v) { return typeof v === 'string' && v.length <= 40 && !Number.isNaN(Date.parse(v)) }

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!sameOrigin(req)) return res.status(403).json({ error: 'Forbidden' })
  if (JSON.stringify(req.body || {}).length > MAX_BODY) return res.status(413).json({ error: 'Too large' })
  const body = req.body || {}

  const rule = body.type === 'get' ? GETS[body.query] : body.type === 'post' ? POSTS[body.formType] : null
  if (!rule) return res.status(400).json({ error: 'Unknown request' })

  try {
    let user = null
    if (!rule.public) {
      const s = getSession(req)
      if (!s) return res.status(401).json({ error: 'Please sign in.' })
      user = await lookupUser(s.email)                       // fresh role every time
      if (!user) return res.status(401).json({ error: 'Please sign in.' })
      if (user.role !== rule.role) return res.status(403).json({ error: 'Not allowed.' })
      if (body.formType === 'referral_submit' && String(user.id).startsWith('ls-')) {
        return res.status(403).json({ error: 'Your account is pending activation.' })
      }
    } else {
      const allowed = await throttle(`pub:${clientIp(req)}`, 10, 3600)
      if (!allowed) return res.status(429).json({ error: 'Too many submissions. Try again later.' })
    }

    if (body.type === 'get') {
      const out = await gasGet(body.query, rule.build(user, body.params || {}))
      // Pass backend errors through as errors, so pages never treat an error body as data.
      return res.status(out && out.status >= 400 ? out.status : 200).json(out)
    }
    const out = await gasPost(body.formType, rule.build(user, body))
    return res.status(out && out.status >= 400 ? out.status : 200).json(out)
  } catch (e) {
    if (e instanceof BackendError) return backendErrorResponse(res, e)
    console.error('[gw]', e.message)
    return res.status(502).json({ error: 'Could not reach the server.' })
  }
}
