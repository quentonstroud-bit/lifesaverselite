/**
 * LifeSavers Elite - Google Apps Script Backend
 * Deploy as Web App: Execute as Me, Access: Anyone
 *
 * Sheet tabs required:
 *   LifeSaver_Applications
 *   Agent_Broker_Applications
 *   Leads
 *   Transactions
 *   Users
 */

// ----------------------------------------------
// CONFIGURATION
// ----------------------------------------------
var SPREADSHEET_ID = '1aQ6PZ5zoSfnHZ0XkluZXwLFWjxwPPgeNVy1zKCQU0WA'
var ADMIN_EMAIL    = 'qcandoit@gmail.com'
var CAL_URL        = 'https://cal.com/quenton-stroud/30min'
var SIGN_OFF       = 'Sincerely,<br><strong>Quenton Stroud</strong><br>Executive Manager, LifeSavers Elite'
var LEAD_FEE       = 5.00   // LSE service fee on every paid lead
var PRICE_BY_STARS = { 1: 0, 2: 5, 3: 18, 4: 24, 5: 30 }  // lead price the agent pays, by star rating
var STRIPE_PCT     = 0.029  // fallback estimate only; real fee is read from Stripe
var STRIPE_FLAT    = 0.30

// Star score thresholds (score is 0-100, see scoreLead). First match wins; anything lower = 1 star.
var STAR_THRESHOLDS = [ [85, 5], [70, 4], [55, 3], [45, 2] ]

// LifeSaver levels by count of leads rated 2+ stars. Cash bonus is one-time.
var LEVELS = [
  { name: 'Supporter',  min: 0,   bonus: 0   },
  { name: 'Steward',    min: 25,  bonus: 50  },
  { name: 'Specialist', min: 60,  bonus: 100 },
  { name: 'Sentinel',   min: 100, bonus: 250 }
]
var SUPREME_MIN   = 500   // lifetime qualifying leads needed to be eligible for Supreme
var SUPREME_BONUS = 500   // One-time per LifeSaver, ever (owner decision).

// ----------------------------------------------
// PRICING, SCORING AND LEVELS (pure functions)
// ----------------------------------------------
function round2(n) { return Math.round(n * 100) / 100 }

function leadPrice(stars) { return PRICE_BY_STARS[stars] || 0 }
function leadFee(stars)   { return leadPrice(stars) > 0 ? LEAD_FEE : 0 }
function leadTotal(stars) { return round2(leadPrice(stars) + leadFee(stars)) }

// Health conditions a LifeSaver can check off (important for life insurance underwriting).
var HEALTH_CONDITIONS = [
  'Diabetes', 'Heart disease or heart attack', 'Stroke', 'Cancer (current or past)',
  'Kidney disease or renal failure', 'High blood pressure', 'COPD, emphysema or lung disease',
  'Liver disease or hepatitis', 'HIV/AIDS', "Alzheimer's or dementia", 'Alcohol or drug treatment'
]
var NONE_OF_THESE = 'None of these'
var RELATIONSHIPS = ['Spouse', 'Son', 'Daughter', 'Parent', 'Sibling', 'Other family', 'Friend', 'Other']
var POLICY_TYPES = ['General life insurance', 'Final expense / burial', 'Cremation', 'Leave money / legacy',
  'Mortgage protection', 'IUL', 'Annuity', 'Safe retirement planning', 'Other / Not sure']
var TIMELINES = ['Same day coverage', '1 week', '2 weeks', '3 weeks', '4 weeks']
// Points for the purchase timeline (max 20). The three old values are kept so leads submitted before the change still score.
var TIMELINE_POINTS = { 'Same day coverage': 14, '1 week': 11, '2 weeks': 8, '3 weeks': 5, '4 weeks': 2,
  '1 to 3 months': 14, '3 to 6 months': 8, '6 to 12 months': 4 }

// "About the conversation" questions (asked about the referral). Lists are what the form offers; maps are points.
var READY_OPTIONS    = ['Yes, expecting a call', 'Maybe, needs a nudge', 'Not yet']
var READY_POINTS     = { 'Yes, expecting a call': 8, 'Maybe, needs a nudge': 4, 'Not yet': 0 }
var CONSENT_OPTIONS  = ['Yes, they agreed', 'No']
var CONSENT_POINTS   = { 'Yes, they agreed': 6, 'No': 0 }
var EXISTING_OPTIONS = ['None', 'Through employer only', 'Has an individual policy', 'Not sure']
var EXISTING_POINTS  = { 'None': 2, 'Through employer only': 2, 'Has an individual policy': 1, 'Not sure': 1 }
var AMOUNT_OPTIONS   = ['Under $50k', '$50k to $100k', '$100k to $250k', '$250k to $500k', '$500k or more', 'Not sure']
var AMOUNT_POINTS    = { 'Under $50k': 2, '$50k to $100k': 2, '$100k to $250k': 2, '$250k to $500k': 2, '$500k or more': 2, 'Not sure': 1 }
var DEPENDENTS_OPTIONS = ['None', '1', '2 or more']
var DEPENDENTS_POINTS  = { 'None': 1, '1': 1, '2 or more': 2 }
var BEST_TIME_OPTIONS  = ['Morning', 'Afternoon', 'Evening', 'Weekends']   // not scored; helps the agent reach them
var US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO',
  'MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']
var CONDITIONS_MAX_POINTS = 7   // "None of these" = 7; each condition checked takes 1 point off, floor 0
var MAX_BENEFICIARY_ROWS = 5

// Strip characters that would break the stored text format or an email, and cap length.
function cleanText(v, max) {
  return String(v === undefined || v === null ? '' : v).replace(/[;()\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
}

// Keep a value only if it is one of the allowed options.
function cleanChoice(v, list) {
  v = String(v === undefined || v === null ? '' : v).trim()
  return list.indexOf(v) !== -1 ? v : ''
}
function cleanState(v) {
  v = String(v === undefined || v === null ? '' : v).toUpperCase().trim()
  return US_STATES.indexOf(v) !== -1 ? v : ''
}
function firstNameOf(full) { return String(full || '').trim().split(/\s+/)[0] || '' }
function lastInitialOf(full) {
  var parts = String(full || '').trim().split(/\s+/)
  return parts.length > 1 ? parts[parts.length - 1].charAt(0) : 'X'
}

function cleanConditions(arr) {
  var out = [], hasNone = false
  if (Object.prototype.toString.call(arr) !== '[object Array]') return out
  for (var i = 0; i < arr.length && i < 20; i++) {
    var c = String(arr[i])
    if (c === NONE_OF_THESE) hasNone = true
    else if (HEALTH_CONDITIONS.indexOf(c) !== -1 && out.indexOf(c) === -1) out.push(c)
  }
  if (!out.length && hasNone) out.push(NONE_OF_THESE)   // "None" only counts when nothing else is checked
  return out
}

function cleanBeneficiaries(arr) {
  var out = []
  if (Object.prototype.toString.call(arr) !== '[object Array]') return out
  for (var i = 0; i < arr.length && out.length < MAX_BENEFICIARY_ROWS; i++) {
    var b = arr[i] || {}
    var rel = String(b.relationship || '')
    out.push({ name: cleanText(b.name, 60), relationship: RELATIONSHIPS.indexOf(rel) !== -1 ? rel : (rel ? 'Other' : '') })
  }
  return out
}

// Stored in the Leads sheet as readable text: "Jane Doe (Spouse); Sam Doe (Child)" and "Diabetes; Stroke".
function beneficiariesToText(list) {
  return list.filter(function (b) { return b.name || b.relationship })
    .map(function (b) { return (b.name || '?') + ' (' + (b.relationship || '?') + ')' }).join('; ')
}
function parseBeneficiaries(text) {
  var out = []
  String(text || '').split('; ').forEach(function (part) {
    var m = /^(.*) \((.+)\)$/.exec(part)
    if (m) out.push({ name: m[1] === '?' ? '' : m[1], relationship: m[2] === '?' ? '' : m[2] })
  })
  return out
}
function parseConditions(text) {
  return String(text || '').split('; ').filter(function (c) { return c === NONE_OF_THESE || HEALTH_CONDITIONS.indexOf(c) !== -1 })
}

function ptsFrom(map, v) {
  v = String(v === undefined || v === null ? '' : v)
  return Object.prototype.hasOwnProperty.call(map, v) ? map[v] : 0
}

// Score a referral from how complete and strong the submitted form is. 0-100.
// Contact 16 | Beneficiaries 11 | Health 17 | Policy type 12 | Timeline 14 | Notes 10 | Conversation 20
function scoreLead(d) {
  var pts = 0
  // Contact: phone 8, email 4, state 4 (agents are licensed by state; city is optional and unscored)
  if (String(d.phone || '').replace(/\D/g, '').length >= 10) pts += 8
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(d.email || '').trim())) pts += 4
  if (cleanState(d.state)) pts += 4

  // Beneficiaries 11: count (2+ = 6, 1 = 4) + each listed beneficiary named with a relationship (up to 5)
  var ben = parseInt(d.beneficiaries, 10) || 0
  if (ben >= 2) pts += 6
  else if (ben === 1) pts += 4
  var rows = Math.min(ben, MAX_BENEFICIARY_ROWS)
  if (rows > 0) {
    var det = d.beneficiaryDetails || [], complete = 0
    for (var b = 0; b < rows && b < det.length; b++) {
      if (det[b] && String(det[b].name || '').trim().length >= 2 && String(det[b].relationship || '').trim()) complete++
    }
    pts += Math.round(5 * complete / rows)
  }

  // Health 17: rating (7+ = 6, 4-6 = 3) + conditions (owner rule: "None of these" = 7, minus 1 per condition, floor 0) + smoking (4/2/1)
  var health = parseInt(d.healthRating, 10) || 0
  if (health >= 7) pts += 6
  else if (health >= 4) pts += 3
  var conds = d.healthConditions
  if (conds && conds.length > 0) {
    pts += conds.indexOf(NONE_OF_THESE) !== -1 ? CONDITIONS_MAX_POINTS : Math.max(0, CONDITIONS_MAX_POINTS - conds.length)
  }
  var smoking = String(d.smoking || '')
  if (smoking === 'Non-Smoker') pts += 4
  else if (smoking === 'Former Smoker') pts += 2
  else if (smoking === 'Smoker') pts += 1

  // Policy type 12 ("Other / Not sure" = 2) and purchase timeline (up to 14)
  var policy = String(d.policyInterest || '')
  if (policy && policy.indexOf('Not sure') === -1) pts += 12
  else if (policy) pts += 2
  pts += ptsFrom(TIMELINE_POINTS, d.timeline)

  // Notes (owner rule: 150+ characters = 10)
  var notesLen = String(d.notes || '').trim().length
  if (notesLen >= 150) pts += 10
  else if (notesLen >= 30) pts += 6
  else if (notesLen > 0) pts += 3

  // About the conversation 20: ready for a call 8, agreed to hear from an agent 6, coverage 2, amount 2, dependents 2
  pts += ptsFrom(READY_POINTS, d.readyForCall)
  pts += ptsFrom(CONSENT_POINTS, d.agreedToContact)
  pts += ptsFrom(EXISTING_POINTS, d.existingCoverage)
  pts += ptsFrom(AMOUNT_POINTS, d.coverageAmount)
  pts += ptsFrom(DEPENDENTS_POINTS, d.dependents)
  return pts
}

function starsFromScore(score) {
  for (var i = 0; i < STAR_THRESHOLDS.length; i++) {
    if (score >= STAR_THRESHOLDS[i][0]) return STAR_THRESHOLDS[i][1]
  }
  return 1
}

// Rebuild the scoring input from a Leads sheet row (used for leads submitted before auto-scoring).
function leadFromRow(row) {
  return { phone: row[3], email: row[4], city: row[5], state: row[6], age: row[7],
           beneficiaries: row[8], healthRating: row[9], smoking: row[10],
           policyInterest: row[11], timeline: row[12], notes: row[13],
           beneficiaryDetails: parseBeneficiaries(row[21]), healthConditions: parseConditions(row[22]),
           readyForCall: row[23], agreedToContact: row[24], existingCoverage: row[25], coverageAmount: row[26], dependents: row[27] }
}

function starsForRow(row) {
  var saved = Number(row[17]) || 0
  if (saved >= 1 && saved <= 5) return saved
  return starsFromScore(scoreLead(leadFromRow(row)))
}

function levelForCount(n) {
  var lvl = LEVELS[0]
  for (var i = 0; i < LEVELS.length; i++) { if (n >= LEVELS[i].min) lvl = LEVELS[i] }
  return lvl
}

function nextLevelInfo(n) {
  for (var i = 0; i < LEVELS.length; i++) {
    if (n < LEVELS[i].min) return { name: LEVELS[i].name, at: LEVELS[i].min, remaining: LEVELS[i].min - n }
  }
  if (n < SUPREME_MIN) return { name: 'Supreme', at: SUPREME_MIN, remaining: SUPREME_MIN - n }
  return null
}

function escHtml(v) {
  return String(v === undefined || v === null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function serverKeyOk(key) {
  var expected = PropertiesService.getScriptProperties().getProperty('SERVER_KEY')
  return !!expected && String(key || '') === expected
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}

// ----------------------------------------------
// ENTRY POINT
// ----------------------------------------------
function doGet(e) {
  var query = e && e.parameter && e.parameter.query
  // Health check only. Every data/auth query needs the shared SERVER_KEY (browsers never call this directly).
  if (query && !serverKeyOk(e.parameter.key)) return respond(403, 'Forbidden')
  if (query === 'dashboard_stats')    return getDashboardStats()
  if (query === 'validate_login')     return validateLogin(e.parameter)
  if (query === 'ls_data')            return getLSData(e.parameter)
  if (query === 'agent_leads')        return getAgentLeads(e.parameter)
  if (query === 'agent_lifesavers')   return getAgentLifeSavers(e.parameter)
  if (query === 'agent_spend')        return getAgentSpend(e.parameter)
  if (query === 'pool_leads')         return getPoolLeads()
  if (query === 'admin_lifesavers')   return getAdminLifeSavers()
  if (query === 'admin_agents')       return getAdminAgents()
  if (query === 'admin_leads')        return getAdminLeads()
  if (query === 'admin_revenue')      return getAdminRevenue()
  if (query === 'lead_quote')         return getLeadQuote(e.parameter)
  if (query === 'auth_lookup')        return jsonOut({ status: 200, user: lookupUser(e.parameter.email) })
  if (query === 'auth_credential')    return authGetCredential(e.parameter)
  if (query === 'admin_payout_report') return getPayoutReport(e.parameter)
  if (query === 'admin_finance')      return getAdminFinance(e.parameter)
  return ContentService
    .createTextOutput(JSON.stringify({ status: 200, message: 'LifeSavers Elite API is live.' }))
    .setMimeType(ContentService.MimeType.JSON)
}

// ----------------------------------------------
// VALIDATE LOGIN
// ----------------------------------------------
function validateLogin(params) {
  var email = (params.email || '').toLowerCase().trim()
  if (!email) return respond(400, 'Email required')

  var ss = SpreadsheetApp.openById(SPREADSHEET_ID)

  // Check Agent_Broker_Applications (col 3 = email)
  var agSheet = ss.getSheetByName('Agent_Broker_Applications')
  if (agSheet) {
    var agData = agSheet.getDataRange().getValues()
    for (var i = 1; i < agData.length; i++) {
      if ((agData[i][3] || '').toLowerCase().trim() === email) {
        return ContentService.createTextOutput(JSON.stringify({
          status: 200, role: 'agent',
          id: 'ag-' + i,
          name: agData[i][1], agency: agData[i][2],
          email: agData[i][3], phone: agData[i][4]
        })).setMimeType(ContentService.MimeType.JSON)
      }
    }
  }

  // Check Users sheet for approved LifeSavers (col 3 = email, col 2 = 'lifesaver')
  var usersSheet = ss.getSheetByName('Users')
  if (usersSheet) {
    var usersData = usersSheet.getDataRange().getValues()
    for (var j = 1; j < usersData.length; j++) {
      if ((usersData[j][3] || '').toLowerCase().trim() === email && usersData[j][2] === 'lifesaver') {
        return ContentService.createTextOutput(JSON.stringify({
          status: 200, role: 'lifesaver',
          id: usersData[j][0], name: usersData[j][1],
          email: usersData[j][3], handle: usersData[j][4],
          tier: usersData[j][5], agentEmail: usersData[j][6]
        })).setMimeType(ContentService.MimeType.JSON)
      }
    }
  }

  // Check LifeSaver_Applications (col 2 = email) - pending applicants
  var lsSheet = ss.getSheetByName('LifeSaver_Applications')
  if (lsSheet) {
    var lsData = lsSheet.getDataRange().getValues()
    for (var k = 1; k < lsData.length; k++) {
      if ((lsData[k][2] || '').toLowerCase().trim() === email) {
        return ContentService.createTextOutput(JSON.stringify({
          status: 200, role: 'lifesaver',
          id: 'ls-' + k, name: lsData[k][1],
          email: lsData[k][2], phone: lsData[k][3],
          handle: '', tier: 'Pending Activation', agentEmail: ''
        })).setMimeType(ContentService.MimeType.JSON)
      }
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ status: 404, message: 'No account found.' }))
    .setMimeType(ContentService.MimeType.JSON)
}

// ----------------------------------------------
// LS DATA (referrals + earnings for a LifeSaver)
// ----------------------------------------------
function getLSData(params) {
  var email = (params.email || '').toLowerCase().trim()
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID)

  // Resolve lifesaver ID and handle from Users sheet
  var lsId = '', lsHandle = '', agentEmail = '', tier = 'Star 1'
  var usersSheet = ss.getSheetByName('Users')
  if (usersSheet) {
    var usersData = usersSheet.getDataRange().getValues()
    for (var u = 1; u < usersData.length; u++) {
      if ((usersData[u][3] || '').toLowerCase().trim() === email && usersData[u][2] === 'lifesaver') {
        lsId       = usersData[u][0]
        lsHandle   = usersData[u][4]
        tier       = usersData[u][5] || 'Star 1'
        agentEmail = usersData[u][6]
        break
      }
    }
  }
  // Fallback: use row index from LifeSaver_Applications
  if (!lsId) {
    var lsSheet = ss.getSheetByName('LifeSaver_Applications')
    if (lsSheet) {
      var lsData = lsSheet.getDataRange().getValues()
      for (var k = 1; k < lsData.length; k++) {
        if ((lsData[k][2] || '').toLowerCase().trim() === email) {
          lsId = 'ls-' + k
          break
        }
      }
    }
  }

  // Look up assigned agent info
  var agentInfo = null
  if (agentEmail) {
    var agSheet = ss.getSheetByName('Agent_Broker_Applications')
    if (agSheet) {
      var agData = agSheet.getDataRange().getValues()
      for (var a = 1; a < agData.length; a++) {
        if ((agData[a][3] || '').toLowerCase().trim() === agentEmail.toLowerCase().trim()) {
          agentInfo = { name: agData[a][1], agency: agData[a][2], email: agData[a][3], phone: agData[a][4] }
          break
        }
      }
    }
  }

  // Leads
  var leadsSheet = ss.getSheetByName('Leads')
  var leadsData  = leadsSheet ? leadsSheet.getDataRange().getValues() : []
  var referrals  = []
  var totalAccepted = 0
  var qualified  = 0

  // Net payout actually banked per lead (from the ledger)
  var payoutByLead = {}
  var txSheet0 = ss.getSheetByName('Transactions')
  var txData0  = txSheet0 ? txSheet0.getDataRange().getValues() : []
  for (var q = 1; q < txData0.length; q++) {
    if (txData0[q][3] === 'LIFESAVER_PAYOUT') payoutByLead[String(txData0[q][1])] = (payoutByLead[String(txData0[q][1])] || 0) + (parseFloat(txData0[q][4]) || 0)
  }
  var now   = new Date()
  var weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  var weeklyLeadsCount = 0

  for (var i = 1; i < leadsData.length; i++) {
    var row = leadsData[i]
    var rowLsId     = String(row[14] || '')
    var rowHandle   = String(row[15] || '')
    var matchById   = lsId     && rowLsId   === lsId
    var matchHandle = lsHandle && rowHandle === lsHandle
    if (!matchById && !matchHandle) continue

    var status = row[16]
    var stars  = starsForRow(row)
    if (stars >= 2) qualified++
    var ts     = new Date(row[1])
    if (status === 'ACCEPTED') totalAccepted++
    if (ts >= weekAgo && (status === 'ACCEPTED' || status === 'PENDING')) weeklyLeadsCount++

    referrals.push({
      id:     row[0],
      name:   row[2],
      policy: row[11],
      status: status,
      stars:  stars,
      earned: status === 'ACCEPTED' ? (payoutByLead[String(row[0])] || 0) : null,
      date:   ts.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    })
  }

  // Sort newest first
  referrals.sort(function(a, b) { return new Date(b.date) - new Date(a.date) })

  // Earnings from Transactions
  var txSheet = ss.getSheetByName('Transactions')
  var txData  = txSheet ? txSheet.getDataRange().getValues() : []
  var totalEarned = 0, weeklyEarned = 0, starsBalance = 0

  for (var j = 1; j < txData.length; j++) {
    var tx = txData[j]
    if ((tx[3] === 'LIFESAVER_PAYOUT' || tx[3] === 'LEVEL_BONUS') && String(tx[5]) === lsId) {
      var amt = parseFloat(tx[4]) || 0
      totalEarned += amt
      if (new Date(tx[0]) >= weekAgo) weeklyEarned += amt
    }
    if (tx[3] === 'STARS_AWARD' && String(tx[5]) === lsId) {
      starsBalance += parseInt(tx[4]) || 0
    }
  }

  // Leaderboard from Users + Leads
  var leaderboard = buildLeaderboard(ss, leadsData, lsId, lsHandle)

  // Badge checks
  var earnedBadges = {}
  if (referrals.length >= 1)                      earnedBadges['first_referral'] = true
  if (referrals.some(function(r){ return r.stars === 5 })) earnedBadges['five_star'] = true
  if (totalAccepted >= 100)                       earnedBadges['century_club'] = true

  return ContentService.createTextOutput(JSON.stringify({
    status: 200,
    referrals: referrals,
    totalEarned: totalEarned,
    weeklyEarned: weeklyEarned,
    starsBalance: starsBalance,
    totalSubmitted: referrals.length,
    totalAccepted: totalAccepted,
    qualifiedLeads: qualified,
    level: levelForCount(qualified).name,
    nextLevel: nextLevelInfo(qualified),
    isSupreme: (function () { var sp = getMonthlySupreme(leadsData, new Date()); return !!(sp && lsId && String(sp.lsId) === String(lsId)) })(),
    weeklyLeadsCount: weeklyLeadsCount,
    totals: (function () { var t = lifesaverTotals(ss, txData, lsId, new Date()); return t })(),
    weeklyBreakdown: [],
    agent: agentInfo,
    leaderboard: leaderboard,
    badges: earnedBadges
  })).setMimeType(ContentService.MimeType.JSON)
}

function buildLeaderboard(ss, leadsData, myLsId, myHandle) {
  var usersSheet = ss.getSheetByName('Users')
  if (!usersSheet) return []
  var usersData = usersSheet.getDataRange().getValues()
  var scores = {}

  // Count accepted leads per lifesaver
  for (var i = 1; i < leadsData.length; i++) {
    if (leadsData[i][16] === 'ACCEPTED') {
      var lsId = String(leadsData[i][14])
      scores[lsId] = (scores[lsId] || 0) + Number(leadsData[i][17] || 1)
    }
  }

  var board = []
  for (var j = 1; j < usersData.length; j++) {
    if (usersData[j][2] !== 'lifesaver') continue
    var id     = String(usersData[j][0])
    var handle = usersData[j][4] || usersData[j][1]
    var stars  = scores[id] || 0
    board.push({ id: id, handle: handle, stars: stars, you: (id === myLsId || handle === myHandle) })
  }

  board.sort(function(a, b) { return b.stars - a.stars })
  board.forEach(function(item, idx) { item.rank = idx + 1 })
  return board.slice(0, 10)
}

// ----------------------------------------------
// AGENT LEADS (pending leads for this agent)
// ----------------------------------------------
function getAgentLeads(params) {
  var agentEmail = (params.email || '').toLowerCase().trim()
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID)

  // Find LifeSavers assigned to this agent via Users sheet (col 6 = agentEmail)
  var lsIds = []
  var usersSheet = ss.getSheetByName('Users')
  if (usersSheet) {
    var usersData = usersSheet.getDataRange().getValues()
    for (var u = 1; u < usersData.length; u++) {
      if ((usersData[u][6] || '').toLowerCase().trim() === agentEmail && usersData[u][2] === 'lifesaver') {
        lsIds.push(String(usersData[u][0]))
      }
    }
  }

  var now      = new Date()
  var leadsSheet = ss.getSheetByName('Leads')
  var leadsData  = leadsSheet ? leadsSheet.getDataRange().getValues() : []
  var leads      = []
  var accepted   = 0, declined = 0

  for (var i = 1; i < leadsData.length; i++) {
    var row    = leadsData[i]
    var status = row[16]
    var lsId   = String(row[14])

    if (lsIds.indexOf(lsId) === -1) continue

    if (status === 'ACCEPTED') accepted++
    if (status === 'DECLINED' || status === 'POOL') declined++

    if (status === 'PENDING') {
      var expiry    = new Date(row[18])
      var hoursLeft = Math.max(0, Math.round((expiry - now) / 3600000))
      leads.push({
        id: row[0],
        firstName: firstNameOf(row[2]),
        lastInitial: lastInitialOf(row[2]),
        city: row[5], state: row[6],
        hoursLeft: hoursLeft,
        stars: starsForRow(row),
        price: leadPrice(starsForRow(row)), fee: leadFee(starsForRow(row)), total: leadTotal(starsForRow(row)),
        age: row[7], health: row[9], smoking: row[10],
        beneficiaries: row[8], policy: row[11], timeline: row[12],
        conditions: parseConditions(row[22]),
        readyForCall: row[23] || '', agreedToContact: row[24] || '', existingCoverage: row[25] || '',
        coverageAmount: row[26] || '', dependents: row[27] || '', bestTime: row[28] || '',
        beneficiaryRelationships: parseBeneficiaries(row[21]).map(function (b) { return b.relationship }),
        lifesaverHandle: row[15], notes: row[13]
      })
    }
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: 200, leads: leads, accepted: accepted, declined: declined
  })).setMimeType(ContentService.MimeType.JSON)
}

// ----------------------------------------------
// AGENT LIFESAVERS
// ----------------------------------------------
function getAgentLifeSavers(params) {
  var agentEmail = (params.email || '').toLowerCase().trim()
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID)

  var usersSheet = ss.getSheetByName('Users')
  var lifesavers = []
  if (!usersSheet) return ContentService.createTextOutput(JSON.stringify({ status: 200, lifesavers: [] })).setMimeType(ContentService.MimeType.JSON)

  var usersData  = usersSheet.getDataRange().getValues()
  var leadsSheet = ss.getSheetByName('Leads')
  var leadsData  = leadsSheet ? leadsSheet.getDataRange().getValues() : []
  var txSheet    = ss.getSheetByName('Transactions')
  var txData     = txSheet ? txSheet.getDataRange().getValues() : []

  for (var u = 1; u < usersData.length; u++) {
    if (usersData[u][2] !== 'lifesaver') continue
    if ((usersData[u][6] || '').toLowerCase().trim() !== agentEmail) continue

    var lsId = String(usersData[u][0])
    var submitted = 0, accepted = 0, payout = 0

    for (var i = 1; i < leadsData.length; i++) {
      if (String(leadsData[i][14]) === lsId) {
        submitted++
        if (leadsData[i][16] === 'ACCEPTED') accepted++
      }
    }
    for (var j = 1; j < txData.length; j++) {
      if (txData[j][3] === 'LIFESAVER_PAYOUT' && String(txData[j][5]) === lsId) {
        payout += parseFloat(txData[j][4]) || 0
      }
    }

    lifesavers.push({
      id: lsId, name: usersData[u][1], email: usersData[u][3],
      handle: usersData[u][4], tier: usersData[u][5],
      submitted: submitted, accepted: accepted, payout: payout
    })
  }

  return ContentService.createTextOutput(JSON.stringify({ status: 200, lifesavers: lifesavers }))
    .setMimeType(ContentService.MimeType.JSON)
}

// ----------------------------------------------
// AGENT SPEND
// ----------------------------------------------
function getAgentSpend(params) {
  var agentEmail = (params.email || '').toLowerCase().trim()
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID)
  var txSheet = ss.getSheetByName('Transactions')
  var leadsSheet = ss.getSheetByName('Leads')
  if (!txSheet) return ContentService.createTextOutput(JSON.stringify({ status: 200, transactions: [], totalLSEFees: 0, totalPayouts: 0, acceptedCount: 0 })).setMimeType(ContentService.MimeType.JSON)

  var txData    = txSheet.getDataRange().getValues()
  var leadsData = leadsSheet ? leadsSheet.getDataRange().getValues() : []
  var weekAgo   = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  var totalLSEFees = 0, totalPayouts = 0, acceptedCount = 0
  var txMap = {} // leadId -> { lseFee, lifesaverPayout, status, lifesaverId }

  for (var j = 1; j < txData.length; j++) {
    var tx = txData[j]
    if ((tx[2] || '').toLowerCase().trim() !== agentEmail) continue
    var txTs = new Date(tx[0])
    if (txTs < weekAgo) continue

    var leadId = String(tx[1])
    if (!txMap[leadId]) txMap[leadId] = { leadId: leadId, lseFee: 0, lifesaverPayout: 0, charged: 0, refunded: 0, status: tx[6], lifesaverId: String(tx[5]) }
    if (tx[3] === 'AGENT_CHARGE') txMap[leadId].charged += parseFloat(tx[4]) || 0
    if (tx[3] === 'REFUND') txMap[leadId].refunded += parseFloat(tx[4]) || 0

    if (tx[3] === 'LSE_FEE') {
      txMap[leadId].lseFee += parseFloat(tx[4]) || 0
      totalLSEFees += parseFloat(tx[4]) || 0
      txMap[leadId].status = tx[6]
      acceptedCount++
    }
    if (tx[3] === 'LIFESAVER_PAYOUT') {
      txMap[leadId].lifesaverPayout += parseFloat(tx[4]) || 0
      totalPayouts += parseFloat(tx[4]) || 0
    }
  }

  // Enrich with lead names and LifeSaver handles
  var leadsIndex = {}
  for (var i = 1; i < leadsData.length; i++) {
    leadsIndex[String(leadsData[i][0])] = { name: leadsData[i][2], handle: leadsData[i][15], ts: leadsData[i][1] }
  }

  var transactions = Object.values(txMap).map(function(t) {
    var lead = leadsIndex[t.leadId] || {}
    return {
      leadName: lead.name || t.leadId,
      lifesaverHandle: lead.handle || t.lifesaverId,
      lseFee: t.lseFee,
      lifesaverPayout: t.lifesaverPayout,
      charged: round2(t.charged),
      refunded: round2(t.refunded),
      status: String(t.status).indexOf('STRIPE:') === 0 ? 'PURCHASED' : t.status,
      date: lead.ts ? new Date(lead.ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
    }
  })

  return ContentService.createTextOutput(JSON.stringify({
    status: 200,
    transactions: transactions,
    totalLSEFees: totalLSEFees,
    totalPayouts: totalPayouts,
    acceptedCount: acceptedCount,
    periods: agentTotals(txData, agentEmail, new Date())
  })).setMimeType(ContentService.MimeType.JSON)
}

// ----------------------------------------------
// POOL LEADS
// ----------------------------------------------
function getPoolLeads() {
  var ss         = SpreadsheetApp.openById(SPREADSHEET_ID)
  var leadsSheet = ss.getSheetByName('Leads')
  if (!leadsSheet) return ContentService.createTextOutput(JSON.stringify({ status: 200, leads: [] })).setMimeType(ContentService.MimeType.JSON)

  var leadsData = leadsSheet.getDataRange().getValues()
  var now  = new Date()
  var leads = []

  for (var i = 1; i < leadsData.length; i++) {
    var row = leadsData[i]
    if (row[16] !== 'POOL') continue

    var expiry    = new Date(row[18])
    var hoursLeft = Math.max(0, Math.round((expiry - now) / 3600000))

    leads.push({
      id: row[0],
      firstName: firstNameOf(row[2]),
      lastInitial: lastInitialOf(row[2]),
      city: row[5], state: row[6],
      hoursLeft: hoursLeft,
      stars: starsForRow(row),
      price: leadPrice(starsForRow(row)), fee: leadFee(starsForRow(row)), total: leadTotal(starsForRow(row)),
      age: row[7], health: row[9], smoking: row[10],
      beneficiaries: row[8], policy: row[11], timeline: row[12],
      conditions: parseConditions(row[22]),
        readyForCall: row[23] || '', agreedToContact: row[24] || '', existingCoverage: row[25] || '',
        coverageAmount: row[26] || '', dependents: row[27] || '', bestTime: row[28] || '',
      beneficiaryRelationships: parseBeneficiaries(row[21]).map(function (b) { return b.relationship }),
      lifesaverHandle: row[15],
      source: String(row[19] || 'Available in pool')
    })
  }

  leads.sort(function(a, b) { return a.hoursLeft - b.hoursLeft })
  return ContentService.createTextOutput(JSON.stringify({ status: 200, leads: leads }))
    .setMimeType(ContentService.MimeType.JSON)
}

// ----------------------------------------------
// ADMIN - LIFESAVERS
// ----------------------------------------------
function getAdminLifeSavers() {
  var ss         = SpreadsheetApp.openById(SPREADSHEET_ID)
  var lsSheet    = ss.getSheetByName('LifeSaver_Applications')
  var usersSheet = ss.getSheetByName('Users')
  var leadsSheet = ss.getSheetByName('Leads')
  var txSheet    = ss.getSheetByName('Transactions')

  var lsData    = lsSheet    ? lsSheet.getDataRange().getValues()    : []
  var usersData = usersSheet ? usersSheet.getDataRange().getValues()  : []
  var leadsData = leadsSheet ? leadsSheet.getDataRange().getValues()  : []
  var txData    = txSheet    ? txSheet.getDataRange().getValues()     : []

  // Build email->userId map from Users sheet
  var emailToUser = {}
  for (var u = 1; u < usersData.length; u++) {
    if (usersData[u][2] === 'lifesaver') {
      emailToUser[(usersData[u][3] || '').toLowerCase().trim()] = {
        id: String(usersData[u][0]), handle: usersData[u][4],
        tier: usersData[u][5], agentEmail: usersData[u][6]
      }
    }
  }

  // Leads index by lsId
  var leadsById = {}
  for (var i = 1; i < leadsData.length; i++) {
    var lsId = String(leadsData[i][14])
    if (!leadsById[lsId]) leadsById[lsId] = { submitted: 0, accepted: 0 }
    leadsById[lsId].submitted++
    if (leadsData[i][16] === 'ACCEPTED') leadsById[lsId].accepted++
  }

  // Earnings by lsId
  var earningsById = {}
  for (var j = 1; j < txData.length; j++) {
    if (txData[j][3] === 'LIFESAVER_PAYOUT') {
      var lsId2 = String(txData[j][5])
      earningsById[lsId2] = (earningsById[lsId2] || 0) + (parseFloat(txData[j][4]) || 0)
    }
  }

  var pending = [], active = []

  for (var k = 1; k < lsData.length; k++) {
    var email = (lsData[k][2] || '').toLowerCase().trim()
    var ts    = new Date(lsData[k][0])
    var user  = emailToUser[email]

    if (user) {
      var stats = leadsById[user.id] || { submitted: 0, accepted: 0 }
      active.push({
        id: user.id, name: lsData[k][1], email: lsData[k][2],
        handle: user.handle, tier: user.tier, agentEmail: user.agentEmail,
        submitted: stats.submitted, accepted: stats.accepted,
        earnings: earningsById[user.id] || 0
      })
    } else {
      pending.push({
        id: 'ls-app-' + k, name: lsData[k][1], email: lsData[k][2],
        phone: lsData[k][3],
        submitted: ts.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      })
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ status: 200, pending: pending, active: active }))
    .setMimeType(ContentService.MimeType.JSON)
}

// ----------------------------------------------
// ADMIN - AGENTS
// ----------------------------------------------
function getAdminAgents() {
  var ss      = SpreadsheetApp.openById(SPREADSHEET_ID)
  var agSheet = ss.getSheetByName('Agent_Broker_Applications')
  if (!agSheet) return ContentService.createTextOutput(JSON.stringify({ status: 200, pending: [], active: [] })).setMimeType(ContentService.MimeType.JSON)

  var agData     = agSheet.getDataRange().getValues()
  var txSheet    = ss.getSheetByName('Transactions')
  var leadsSheet = ss.getSheetByName('Leads')
  var usersSheet = ss.getSheetByName('Users')

  var txData    = txSheet    ? txSheet.getDataRange().getValues()    : []
  var leadsData = leadsSheet ? leadsSheet.getDataRange().getValues() : []
  var usersData = usersSheet ? usersSheet.getDataRange().getValues() : []

  // Count LifeSavers per agent
  var lsPerAgent = {}
  for (var u = 1; u < usersData.length; u++) {
    if (usersData[u][2] === 'lifesaver') {
      var ae = (usersData[u][6] || '').toLowerCase().trim()
      lsPerAgent[ae] = (lsPerAgent[ae] || 0) + 1
    }
  }

  // All rows are "active" for now (approval workflow pending)
  var active  = []
  var pending = []

  for (var i = 1; i < agData.length; i++) {
    var email   = (agData[i][3] || '').toLowerCase().trim()
    var spend   = 0, accepted = 0, declined = 0

    for (var j = 1; j < txData.length; j++) {
      if ((txData[j][2] || '').toLowerCase().trim() === email) {
        if (txData[j][3] === 'LSE_FEE') { spend += parseFloat(txData[j][4]) || 0; accepted++ }
      }
    }
    for (var k = 1; k < leadsData.length; k++) {
      // declined by this agent's LifeSavers - rough approximation via pool moves
      if ((leadsData[k][16] === 'DECLINED' || leadsData[k][16] === 'POOL') && leadsData[k][19] === 'Declined by assigned Agent') {
        declined++
      }
    }

    var ts = new Date(agData[i][0])
    var row = {
      id: 'ag-' + i, name: agData[i][1], agency: agData[i][2],
      email: agData[i][3], phone: agData[i][4],
      license: agData[i][5], states: agData[i][6], lines: agData[i][8],
      budget: 0, remaining: 0,
      lifesavers: lsPerAgent[email] || 0,
      accepted: accepted, declined: declined, spend: spend,
      submitted: ts.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
    active.push(row)
  }

  return ContentService.createTextOutput(JSON.stringify({ status: 200, pending: pending, active: active }))
    .setMimeType(ContentService.MimeType.JSON)
}

// ----------------------------------------------
// ADMIN - ALL LEADS
// ----------------------------------------------
function getAdminLeads() {
  var ss         = SpreadsheetApp.openById(SPREADSHEET_ID)
  var leadsSheet = ss.getSheetByName('Leads')
  if (!leadsSheet) return ContentService.createTextOutput(JSON.stringify({ status: 200, leads: [] })).setMimeType(ContentService.MimeType.JSON)

  var leadsData = leadsSheet.getDataRange().getValues()

  // Build lsId->agentEmail map from Users sheet
  var lsToAgent = {}
  var usersSheet = ss.getSheetByName('Users')
  if (usersSheet) {
    var usersData = usersSheet.getDataRange().getValues()
    for (var u = 1; u < usersData.length; u++) {
      if (usersData[u][2] === 'lifesaver') {
        lsToAgent[String(usersData[u][0])] = usersData[u][6]
      }
    }
  }

  // Build agentEmail->agency map
  var agentInfo = {}
  var agSheet = ss.getSheetByName('Agent_Broker_Applications')
  if (agSheet) {
    var agData = agSheet.getDataRange().getValues()
    for (var a = 1; a < agData.length; a++) {
      agentInfo[(agData[a][3] || '').toLowerCase().trim()] = agData[a][2] || agData[a][1]
    }
  }

  var leads = []
  for (var i = 1; i < leadsData.length; i++) {
    var row       = leadsData[i]
    var lsId      = String(row[14])
    var agEmail   = lsToAgent[lsId] || ''
    var agAgency  = agEmail ? (agentInfo[agEmail.toLowerCase()] || agEmail) : '--'
    var ts        = new Date(row[1])
    leads.push({
      id:        row[0],
      name:      firstNameOf(row[2]) + ' ' + lastInitialOf(row[2]) + '.',
      policy:    row[11],
      lifesaver: row[15] || lsId,
      agent:     agAgency,
      status:    row[16],
      stars:     Number(row[17]) || 0,
      date:      ts.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    })
  }

  leads.sort(function(a, b) { return new Date(b.date) - new Date(a.date) })
  return ContentService.createTextOutput(JSON.stringify({ status: 200, leads: leads }))
    .setMimeType(ContentService.MimeType.JSON)
}

// ----------------------------------------------
// ADMIN - REVENUE
// ----------------------------------------------
function getAdminRevenue() {
  var ss      = SpreadsheetApp.openById(SPREADSHEET_ID)
  var txSheet = ss.getSheetByName('Transactions')
  if (!txSheet) return ContentService.createTextOutput(JSON.stringify({ status: 200, allTime: 0, thisWeek: 0, monthlyPace: 0, byAgent: [], monthly: [] })).setMimeType(ContentService.MimeType.JSON)

  var txData  = txSheet.getDataRange().getValues()
  var now     = new Date()
  var weekAgo = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000)
  var dayOfWeek = now.getDay()
  var daysIntoWeek = dayOfWeek === 0 ? 7 : dayOfWeek

  var allTime = 0, thisWeek = 0
  var byAgentMap = {}, monthMap = {}

  // Build agent email->agency map
  var agentInfo = {}
  var agSheet = ss.getSheetByName('Agent_Broker_Applications')
  if (agSheet) {
    var agData = agSheet.getDataRange().getValues()
    for (var a = 1; a < agData.length; a++) {
      agentInfo[(agData[a][3] || '').toLowerCase().trim()] = agData[a][2] || agData[a][1]
    }
  }

  for (var j = 1; j < txData.length; j++) {
    var tx = txData[j]
    if (tx[3] !== 'LSE_FEE') continue

    var amt   = parseFloat(tx[4]) || 0
    var txTs  = new Date(tx[0])
    var month = txTs.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    var agEm  = (tx[2] || '').toLowerCase().trim()

    allTime += amt
    if (txTs >= weekAgo) thisWeek += amt

    if (!byAgentMap[agEm]) byAgentMap[agEm] = { accepted: 0, fees: 0 }
    byAgentMap[agEm].accepted++
    byAgentMap[agEm].fees += amt

    if (!monthMap[month]) monthMap[month] = { revenue: 0, leads: 0 }
    monthMap[month].revenue += amt
    monthMap[month].leads++
  }

  var byAgent = Object.keys(byAgentMap).map(function(em) {
    return { agency: agentInfo[em] || em, accepted: byAgentMap[em].accepted, fees: byAgentMap[em].fees }
  }).sort(function(a, b) { return b.fees - a.fees })

  var monthly = Object.keys(monthMap).map(function(m) {
    return { month: m, revenue: monthMap[m].revenue, leads: monthMap[m].leads }
  }).sort(function(a, b) { return new Date('1 ' + b.month) - new Date('1 ' + a.month) }).slice(0, 6)

  var monthlyPace = daysIntoWeek > 0 ? (thisWeek / daysIntoWeek) * 30 : 0

  return ContentService.createTextOutput(JSON.stringify({
    status: 200,
    allTime: allTime,
    thisWeek: thisWeek,
    monthlyPace: monthlyPace,
    byAgent: byAgent,
    monthly: monthly,
    lastSettled: null,
    nextSettled: getNextSunday()
  })).setMimeType(ContentService.MimeType.JSON)
}

function getNextSunday() {
  var d = new Date()
  d.setDate(d.getDate() + (7 - d.getDay()) % 7 || 7)
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

// ----------------------------------------------
// ADMIN OVERVIEW STATS
// ----------------------------------------------
function getDashboardStats() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID)

  var lsSheet = ss.getSheetByName('LifeSaver_Applications')
  var lsCount = lsSheet ? Math.max(0, lsSheet.getLastRow() - 1) : 0

  var agSheet = ss.getSheetByName('Agent_Broker_Applications')
  var agCount = agSheet ? Math.max(0, agSheet.getLastRow() - 1) : 0

  var leadsSheet = ss.getSheetByName('Leads')
  var leadsData  = leadsSheet ? leadsSheet.getDataRange().getValues() : []
  var now        = new Date()
  var weekAgo    = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  var leadsThisWeek = 0, inPool = 0

  for (var i = 1; i < leadsData.length; i++) {
    var ts = new Date(leadsData[i][1])
    if (ts >= weekAgo) leadsThisWeek++
    if (leadsData[i][16] === 'POOL') inPool++
  }

  var txSheet = ss.getSheetByName('Transactions')
  var txData  = txSheet ? txSheet.getDataRange().getValues() : []
  var weeklyRevenue = 0
  for (var j = 1; j < txData.length; j++) {
    var txTs = new Date(txData[j][0])
    if (txTs >= weekAgo && txData[j][3] === 'LSE_FEE') {
      weeklyRevenue += parseFloat(txData[j][4]) || 0
    }
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: 200,
    lsCount: lsCount, agCount: agCount,
    leadsThisWeek: leadsThisWeek, inPool: inPool,
    weeklyRevenue: weeklyRevenue
  })).setMimeType(ContentService.MimeType.JSON)
}

// ----------------------------------------------
// POST HANDLERS
// ----------------------------------------------
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents)
    var type = data.formType
    // The public landing page (lifesaverselite.com) posts LifeSaver applications straight to this URL, so 'application'
    // is the ONE form type accepted without the server key. handlePublicApplication validates, spam-traps and rate-limits it.
    // Everything else still requires the key.
    if (type === 'application' && !serverKeyOk(data.serverKey)) return handlePublicApplication(data)
    if (!serverKeyOk(data.serverKey)) return respond(403, 'Forbidden')

    if (type === 'application')        return handleApplication(data)
    if (type === 'agent_enrollment')   return handleAgentEnrollment(data)
    if (type === 'referral_submit')    return handleReferralSubmit(data)
    if (type === 'lead_rating')        return handleLeadRating(data)
    if (type === 'lead_accept')        return handleFreeUnlock(data)
    if (type === 'lead_decline')       return handleLeadDecline(data)
    if (type === 'claim_from_pool')    return handleFreeUnlock(data)
    if (type === 'payment_complete')   return handlePaymentComplete(data)
    if (type === 'auth_set_credential') return authSetCredential(data)
    if (type === 'auth_throttle')      return authThrottle(data)
    if (type === 'auth_consume')       return authConsume(data)
    if (type === 'send_magic_link')    return sendMagicLink(data)
    if (type === 'admin_mark_paid')    return handleMarkPaid(data)
    if (type === 'refund_recorded')    return handleRefundRecorded(data)
    if (type === 'approve_lifesaver')  return respond(200, 'Noted - add to Users sheet manually to activate')

    return respond(400, 'Unknown form type: ' + type)
  } catch (err) {
    return respond(500, 'Server error: ' + err.message)
  }
}

// ----------------------------------------------
// LIFESAVER APPLICATION
// ----------------------------------------------
// Free text: keep punctuation and line breaks, drop other control characters, cap the length.
function cleanFree(v, max) {
  return String(v === undefined || v === null ? '' : v).replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, ' ').trim().slice(0, max)
}

// Counts one attempt against key; false once the limit for the window is reached.
function throttleHit(key, limit, windowSec) {
  var cache = CacheService.getScriptCache()
  var n = parseInt(cache.get(key) || '0', 10)
  if (n >= limit) return false
  cache.put(key, String(n + 1), Math.min(21600, windowSec))
  return true
}

function resumeFolder() {
  var props = PropertiesService.getScriptProperties()
  var id = props.getProperty('RESUME_FOLDER_ID')
  if (id) { try { return DriveApp.getFolderById(id) } catch (e) { /* folder deleted: make a new one */ } }
  var folder = DriveApp.createFolder('LifeSavers Elite - Resumes')   // private to the script owner
  props.setProperty('RESUME_FOLDER_ID', folder.getId())
  return folder
}

var RESUME_TYPES = { 'application/pdf': 1, 'application/msword': 1, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 1 }

// Saves an uploaded resume to the private Drive folder and returns what goes in the sheet's Resume column.
function saveResume(d) {
  if (!d.resumeData) return d.resumeAttached === 'Yes' ? 'Yes (file not received)' : 'No'
  var name = cleanText(d.resumeName, 80)
  if (!RESUME_TYPES[d.resumeType] && !/\.(pdf|docx?)$/i.test(name)) return 'Attached, but not a PDF or Word file (not saved)'
  try {
    var bytes = Utilities.base64Decode(String(d.resumeData))
    if (bytes.length > 5 * 1024 * 1024) return 'Attached, but over 5 MB (not saved)'
    var type = RESUME_TYPES[d.resumeType] ? d.resumeType : 'application/octet-stream'
    var file = resumeFolder().createFile(Utilities.newBlob(bytes, type, cleanText(d.name, 60) + ' - ' + (name || 'resume')))
    return file.getUrl()
  } catch (e) {
    return 'Attached, but saving failed (run installTriggers once to allow Drive access)'
  }
}

// LifeSaver application from the public landing page (no server key).
function handlePublicApplication(d) {
  // Spam trap: real people never see or fill the hidden "website" field. Pretend success, save nothing.
  if (String(d.website || '').trim()) return respond(200, 'Application received')

  var c = {
    name: cleanText(d.name, 80), email: String(d.email || '').toLowerCase().trim().slice(0, 120), phone: cleanFree(d.phone, 30),
    facebook: cleanFree(d.facebook, 200), positions: cleanFree(d.positions, 200), employment: cleanFree(d.employment, 80),
    insurance: cleanFree(d.insurance, 80), referral: cleanFree(d.referral, 80), excites: cleanFree(d.excites, 2000)
  }
  if (c.name.length < 2) return respond(400, 'Please enter your full name.')
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email)) return respond(400, 'Please enter a valid email address.')
  if (c.phone.replace(/\D/g, '').length < 7) return respond(400, 'Please enter a valid phone number.')

  var lock = LockService.getScriptLock(); lock.waitLock(20000)
  try {
    if (!throttleHit('app:email:' + c.email, 3, 21600) || !throttleHit('app:all', 60, 3600)) {
      return respond(429, 'We received several applications in a short time. Please try again later or email us.')
    }
  } finally { lock.releaseLock() }

  c.resumeAttached = saveResume(d)
  return handleApplication(c)
}

function handleApplication(d) {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID)
  var sheet = ss.getSheetByName('LifeSaver_Applications')
  var ts    = new Date().toISOString()

  sheet.appendRow([
    ts, d.name, d.email, d.phone, d.facebook,
    d.positions, d.employment, d.insurance,
    d.referral, d.excites, d.resumeAttached
  ])

  sendEmail(ADMIN_EMAIL, 'New LifeSavers Application - ' + d.name, adminAppEmailBody(d))
  var firstName = d.name.split(' ')[0]
  sendEmail(d.email, "You're One Step Closer, " + firstName + " - Here's What's Next", applicantConfirmationBody(firstName))

  return respond(200, 'Application received')
}

// ----------------------------------------------
// AGENT ENROLLMENT
// ----------------------------------------------
function handleAgentEnrollment(d) {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID)
  var sheet = ss.getSheetByName('Agent_Broker_Applications')
  var ts    = new Date().toISOString()

  sheet.appendRow([
    ts, d.name, d.agency, d.email, d.phone,
    d.license, d.states, d.years, d.lines,
    d.payoutStructure, d.hearAbout, d.paymentMethod
  ])

  sendEmail(ADMIN_EMAIL, 'New Agent/Broker Application - ' + d.agency, agentAppEmailBody(d))

  return respond(200, 'Agent enrollment received')
}

// ----------------------------------------------
// REFERRAL SUBMISSION
// ----------------------------------------------
// Digits only (checkout validates /^LD-\d+$/). Milliseconds plus 3 random digits, re-rolled if it already exists.
function newLeadId(sheet) {
  var used = {}, rows = sheet.getDataRange().getValues()
  for (var i = 1; i < rows.length; i++) used[String(rows[i][0])] = true
  var id
  do { id = 'LD-' + (Date.now() * 1000 + Math.floor(Math.random() * 1000)) } while (used[id])
  return id
}

function handleReferralSubmit(d) {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID)
  var sheet = ss.getSheetByName('Leads')
  var ts    = new Date().toISOString()
  var leadId = ''
  var expiry = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
  var first = cleanText(d.firstName, 40), last = cleanText(d.lastName, 40)
  if (!first || !last) return respond(400, 'First and last name are required')
  d.leadName = first + ' ' + last
  d.state = cleanState(d.state)
  d.city = cleanText(d.city, 60)
  d.policyInterest = cleanChoice(d.policyInterest, POLICY_TYPES)
  d.timeline = cleanChoice(d.timeline, TIMELINES)
  d.beneficiaryDetails = cleanBeneficiaries(d.beneficiaryDetails)
  d.healthConditions   = cleanConditions(d.healthConditions)
  d.readyForCall       = cleanChoice(d.readyForCall, READY_OPTIONS)
  d.agreedToContact    = cleanChoice(d.agreedToContact, CONSENT_OPTIONS)
  d.existingCoverage   = cleanChoice(d.existingCoverage, EXISTING_OPTIONS)
  d.coverageAmount     = cleanChoice(d.coverageAmount, AMOUNT_OPTIONS)
  d.dependents         = cleanChoice(d.dependents, DEPENDENTS_OPTIONS)
  d.bestTime           = cleanChoice(d.bestTime, BEST_TIME_OPTIONS)
  var stars  = starsFromScore(scoreLead(d))

  // Unique id, generated and saved under a lock so two simultaneous referrals can never share one.
  var lock = LockService.getScriptLock()
  lock.waitLock(20000)
  try {
  leadId = newLeadId(sheet)
  // Columns 21-23: PoolSource (unused here), BeneficiaryDetails, HealthConditions
  sheet.appendRow([
    leadId, ts, d.leadName, d.phone, d.email || '',
    d.city || '', d.state || '', d.age, d.beneficiaries || 0,
    d.healthRating, d.smoking, d.policyInterest, d.timeline,
    d.notes || '', d.lifesaverId, d.lifesaverHandle,
    'PENDING', stars, expiry, leadFee(stars),
    '', beneficiariesToText(d.beneficiaryDetails), d.healthConditions.join('; '),
    d.readyForCall, d.agreedToContact, d.existingCoverage, d.coverageAmount, d.dependents, d.bestTime
  ])
  } finally {
    lock.releaseLock()
  }

  if (stars >= 2) awardLevelBonuses(ss, d.lifesaverId, d.lifesaverHandle)

  sendEmail(d.lifesaverEmail || ADMIN_EMAIL,
    'Your referral for ' + d.leadName.split(' ')[0] + ' was submitted successfully',
    lifesaverSubmitBody(d, leadId, expiry))

  var agentEmail = getAgentEmailForLifeSaver(d.lifesaverId)
  if (agentEmail) {
    sendEmail(agentEmail,
      'New Referral from ' + d.lifesaverHandle + ' - Action Required Within 48 Hours',
      agentNewLeadBody(d, leadId, expiry))
  }

  return respond(200, 'Referral submitted: ' + leadId)
}

// ----------------------------------------------
// LEAD RATING
// ----------------------------------------------
function handleLeadRating(d) {
  // Reached only through the authenticated gateway, which restricts this action to admins.
  var stars = parseInt(d.stars, 10)
  if (!(stars >= 1 && stars <= 5)) return respond(400, 'Stars must be 1-5')
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID)
  var sheet = ss.getSheetByName('Leads')
  var data  = sheet.getDataRange().getValues()
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === d.leadId) {
      if (data[i][16] === 'ACCEPTED') return respond(409, 'Lead already purchased')
      sheet.getRange(i + 1, 18).setValue(stars)
      sheet.getRange(i + 1, 20).setValue(leadFee(stars))
      return respond(200, 'Rating saved')
    }
  }
  return respond(404, 'Lead not found')
}

// ----------------------------------------------
// PURCHASE ELIGIBILITY + QUOTE
// ----------------------------------------------
function getLSEmailById(ss, lsId) {
  var usersSheet = ss.getSheetByName('Users')
  if (!usersSheet) return null
  var data = usersSheet.getDataRange().getValues()
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === lsId) return data[i][3]
  }
  return null
}

function isAgentEmail(ss, email) {
  var sh = ss.getSheetByName('Agent_Broker_Applications')
  if (!sh) return false
  var rows = sh.getDataRange().getValues()
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][3] || '').toLowerCase().trim() === email) return true
  }
  return false
}

// Returns '' if the agent may buy this lead, otherwise a reason string.
function purchaseBlockReason(ss, row, agentEmail) {
  if (!agentEmail || !isAgentEmail(ss, agentEmail)) return 'Unknown agent'
  var status = row[16]
  if (status === 'ACCEPTED') return 'Lead already purchased'
  if (status === 'PENDING') {
    var assigned = String(getAgentEmailForLifeSaver(row[14]) || '').toLowerCase().trim()
    if (assigned !== agentEmail) return 'Lead is assigned to another agent'
    return ''
  }
  if (status === 'POOL') return ''
  return 'Lead is not available'
}

// Called only by the Vercel checkout function (shared secret). Never trust amounts from a browser.
function getLeadQuote(params) {
  if (!serverKeyOk(params.key)) return jsonOut({ ok: false, error: 'Not authorized' })
  var agentEmail = String(params.agentEmail || '').toLowerCase().trim()
  var ss   = SpreadsheetApp.openById(SPREADSHEET_ID)
  var data = ss.getSheetByName('Leads').getDataRange().getValues()
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === params.leadId) {
      var reason = purchaseBlockReason(ss, data[i], agentEmail)
      if (reason) return jsonOut({ ok: false, error: reason })
      var stars = starsForRow(data[i])
      return jsonOut({
        ok: true, leadId: params.leadId, stars: stars,
        price: leadPrice(stars), fee: leadFee(stars), total: leadTotal(stars),
        label: String(data[i][2]).split(' ')[0] + ' - ' + data[i][11]
      })
    }
  }
  return jsonOut({ ok: false, error: 'Lead not found' })
}

function agentPurchaseBody(row, stars) {
  return '<h2 style="color:#4ade80;">Lead unlocked: ' + escHtml(row[2]) + '</h2>'
    + '<p><strong>Name:</strong> ' + escHtml(row[2]) + '</p>'
    + '<p><strong>Phone:</strong> ' + escHtml(row[3]) + '</p>'
    + '<p><strong>Email:</strong> ' + escHtml(row[4]) + '</p>'
    + '<p><strong>Location:</strong> ' + escHtml(row[5]) + ', ' + escHtml(row[6]) + '</p>'
    + '<p><strong>Age:</strong> ' + escHtml(row[7]) + ' | <strong>Beneficiaries:</strong> ' + escHtml(row[8])
    + ' | <strong>Health:</strong> ' + escHtml(row[9]) + '/10 | <strong>Smoking:</strong> ' + escHtml(row[10]) + '</p>'
    + '<p><strong>Beneficiaries:</strong> ' + escHtml(row[21] || 'Not provided') + '</p>'
    + '<p><strong>Health conditions:</strong> ' + escHtml(row[22] || 'Not provided') + '</p>'
    + '<p><strong>Ready to take a call:</strong> ' + escHtml(row[23] || 'Not asked') + ' | <strong>Agreed to hear from an agent:</strong> ' + escHtml(row[24] || 'Not asked') + '</p>'
    + '<p><strong>Existing coverage:</strong> ' + escHtml(row[25] || 'Not asked') + ' | <strong>Coverage amount:</strong> ' + escHtml(row[26] || 'Not asked')
    + ' | <strong>Dependents:</strong> ' + escHtml(row[27] || 'Not asked') + ' | <strong>Best time to reach:</strong> ' + escHtml(row[28] || 'Not asked') + '</p>'
    + '<p><strong>Policy interest:</strong> ' + escHtml(row[11]) + ' | <strong>Timeline:</strong> ' + escHtml(row[12]) + '</p>'
    + '<p><strong>Star rating:</strong> ' + stars + ' / 5</p>'
    + '<p><strong>Notes:</strong> ' + escHtml(row[13]) + '</p>'
    + '<p><strong>Referred by:</strong> ' + escHtml(row[15]) + '</p>'
}

function lifesaverPaidBody(row, stars, payout) {
  return '<h2 style="color:#4ade80;">Your referral was purchased.</h2>'
    + '<p>Your referral for <strong>' + escHtml(row[2]) + '</strong> was purchased by an agent.</p>'
    + '<p><strong>Star Rating:</strong> ' + stars + ' / 5</p>'
    + '<p><strong>You Earned:</strong> $' + payout.toFixed(2) + ' (after processing fees)</p>'
    + '<p><strong>Payout Date:</strong> Next Sunday</p>'
}

// ----------------------------------------------
// FREE (1-STAR) UNLOCK. Paid leads must go through Stripe Checkout.
// ----------------------------------------------
function handleFreeUnlock(d) {
  var lock = LockService.getScriptLock()
  lock.waitLock(20000)
  try {
    var ss         = SpreadsheetApp.openById(SPREADSHEET_ID)
    var leadsSheet = ss.getSheetByName('Leads')
    var txSheet    = ss.getSheetByName('Transactions')
    var data       = leadsSheet.getDataRange().getValues()
    var agentEmail = String(d.agentEmail || d.agentId || '').toLowerCase().trim()
    var ts         = new Date().toISOString()

    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== d.leadId) continue
      var row = data[i]
      var reason = purchaseBlockReason(ss, row, agentEmail)
      if (reason) return respond(409, reason)
      var stars = starsForRow(row)
      if (leadTotal(stars) > 0) return respond(402, 'Payment required')

      leadsSheet.getRange(i + 1, 17).setValue('ACCEPTED')
      txSheet.appendRow([ts, d.leadId, agentEmail, 'FREE_UNLOCK', 0, row[14], 'FREE'])
      sendEmail(agentEmail, 'Lead unlocked: ' + String(row[2]).split(' ')[0], agentPurchaseBody(row, stars))
      var lsEmail = getLSEmailById(ss, String(row[14]))
      if (lsEmail) sendEmail(lsEmail, 'Your referral for ' + String(row[2]).split(' ')[0] + ' was accepted', lifesaverPaidBody(row, stars, 0))
      return respond(200, 'Lead unlocked')
    }
    return respond(404, 'Lead not found')
  } finally {
    lock.releaseLock()
  }
}

// ----------------------------------------------
// PAYMENT COMPLETE (called by the Vercel Stripe webhook, shared secret)
// ----------------------------------------------
function handlePaymentComplete(d) {
  if (!serverKeyOk(d.serverKey)) return respond(403, 'Not authorized')
  var lock = LockService.getScriptLock()
  lock.waitLock(20000)
  try {
    var ss         = SpreadsheetApp.openById(SPREADSHEET_ID)
    var leadsSheet = ss.getSheetByName('Leads')
    var txSheet    = ss.getSheetByName('Transactions')
    var source     = 'STRIPE:' + d.sessionId
    var ts         = new Date().toISOString()
    var agentEmail = String(d.agentEmail || '').toLowerCase().trim()

    var piTag      = '|pi:' + String(d.paymentIntent || '')

    // Idempotency: Stripe retries webhooks. Compare the session part exactly.
    var txData = txSheet.getDataRange().getValues()
    for (var t = 1; t < txData.length; t++) {
      if (String(txData[t][6]).split('|')[0] === source) return respond(200, 'Already processed')
    }

    var data = leadsSheet.getDataRange().getValues()
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== d.leadId) continue
      var row   = data[i]
      var stars = starsForRow(row)
      var price = leadPrice(stars), fee = leadFee(stars), total = leadTotal(stars)
      var paid  = round2((Number(d.amountTotal) || 0) / 100)

      // Paid the wrong amount, or someone else already bought it: do not unlock. Flag for refund.
      var blocked = ''
      if (Math.abs(paid - total) > 0.005) blocked = 'AMOUNT_MISMATCH'
      else if (row[16] === 'ACCEPTED') blocked = 'ALREADY_PURCHASED'
      var stripeFee = (d.stripeFee === undefined || d.stripeFee === null || d.stripeFee === '')
        ? round2(paid * STRIPE_PCT + STRIPE_FLAT) : round2(Number(d.stripeFee))

      // Every charge is gross income, whether or not the lead unlocks.
      txSheet.appendRow([ts, d.leadId, agentEmail, 'AGENT_CHARGE', paid, row[14], source + piTag])
      if (blocked) {
        txSheet.appendRow([ts, d.leadId, agentEmail, 'STRIPE_FEE', stripeFee, row[14], source + piTag])
        txSheet.appendRow([ts, d.leadId, agentEmail, 'NEEDS_REFUND', paid, row[14], source + piTag + '|' + blocked])
        sendEmail(ADMIN_EMAIL, 'ACTION: refund needed (' + blocked + ') for ' + d.leadId,
          '<p>Stripe session ' + escHtml(d.sessionId) + ' paid $' + paid.toFixed(2) + ' for lead ' + escHtml(d.leadId)
          + ' (' + blocked + '). Agent: ' + escHtml(agentEmail) + '. Refund this payment in Stripe.</p>')
        return respond(200, 'Flagged for refund')
      }

      var payout = Math.max(0, round2(price - stripeFee))   // LifeSaver bears the Stripe fee on the whole charge

      leadsSheet.getRange(i + 1, 17).setValue('ACCEPTED')
      txSheet.appendRow([ts, d.leadId, agentEmail, 'LSE_FEE',          fee,       row[14], source])
      txSheet.appendRow([ts, d.leadId, agentEmail, 'LIFESAVER_PAYOUT', payout,    row[14], source])
      txSheet.appendRow([ts, d.leadId, agentEmail, 'STRIPE_FEE',       stripeFee, row[14], source])

      sendEmail(agentEmail, 'Lead unlocked: ' + String(row[2]).split(' ')[0], agentPurchaseBody(row, stars))
      var lsEmail = getLSEmailById(ss, String(row[14]))
      if (lsEmail) sendEmail(lsEmail, 'Your referral for ' + String(row[2]).split(' ')[0] + ' was purchased', lifesaverPaidBody(row, stars, payout))
      return respond(200, 'Purchase recorded')
    }
    return respond(404, 'Lead not found')
  } finally {
    lock.releaseLock()
  }
}

// ----------------------------------------------
// LEVEL BONUSES (one-time cash, banked in the ledger for the weekly payout)
// ----------------------------------------------
function qualifiedCount(leadsData, lsId, lsHandle) {
  var n = 0
  for (var i = 1; i < leadsData.length; i++) {
    var byId = lsId && String(leadsData[i][14]) === String(lsId)
    var byHandle = lsHandle && String(leadsData[i][15]) === String(lsHandle)
    if (!byId && !byHandle) continue
    if (starsForRow(leadsData[i]) >= 2) n++
  }
  return n
}

function awardLevelBonuses(ss, lsId, lsHandle) {
  var txSheet = ss.getSheetByName('Transactions')
  if (!txSheet || !lsId) return
  var leadsData = ss.getSheetByName('Leads').getDataRange().getValues()
  var count = qualifiedCount(leadsData, lsId, lsHandle)
  var txData = txSheet.getDataRange().getValues()
  var ts = new Date().toISOString()
  for (var i = 0; i < LEVELS.length; i++) {
    var lvl = LEVELS[i]
    if (!lvl.bonus || count < lvl.min) continue
    var source = 'LEVEL:' + lvl.name
    var done = false
    for (var t = 1; t < txData.length; t++) {
      if (txData[t][3] === 'LEVEL_BONUS' && String(txData[t][5]) === String(lsId) && String(txData[t][6]) === source) { done = true; break }
    }
    if (!done) txSheet.appendRow([ts, '', '', 'LEVEL_BONUS', lvl.bonus, lsId, source])
  }
}

// Supreme = the LifeSaver with the most qualifying leads submitted in the month, among those with
// SUPREME_MIN+ lifetime. Pass a Date inside the month to evaluate. Returns { lsId, handle, count } or null.
function getMonthlySupreme(leadsData, monthDate) {
  var y = monthDate.getFullYear(), m = monthDate.getMonth()
  var life = {}, month = {}, handles = {}
  for (var i = 1; i < leadsData.length; i++) {
    var id = String(leadsData[i][14] || '')
    if (!id || starsForRow(leadsData[i]) < 2) continue
    life[id] = (life[id] || 0) + 1
    handles[id] = leadsData[i][15]
    var d = new Date(leadsData[i][1])
    if (d.getFullYear() === y && d.getMonth() === m) month[id] = (month[id] || 0) + 1
  }
  var best = null
  for (var k in life) {
    if (life[k] < SUPREME_MIN) continue
    var c = month[k] || 0
    if (!best || c > best.count) best = { lsId: k, handle: handles[k], count: c }
  }
  return best
}

// True if this LifeSaver already received the Supreme bonus in any month (one-time per LifeSaver, ever).
function hasSupremeBonus(txData, lsId) {
  for (var t = 1; t < txData.length; t++) {
    if (txData[t][3] === 'LEVEL_BONUS' && String(txData[t][5]) === String(lsId) && String(txData[t][6]).indexOf('SUPREME:') === 0) return true
  }
  return false
}

// Monthly job (installTriggers schedules it for the 1st). Banks the one-time Supreme bonus for the
// month just ended. The title still rotates monthly, but a LifeSaver is only ever paid the bonus once.
function awardSupremeMonthly(forDate) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID)
  var prev = forDate ? new Date(forDate) : new Date()
  if (!forDate) { prev.setDate(1); prev.setMonth(prev.getMonth() - 1) }
  var leadsData = ss.getSheetByName('Leads').getDataRange().getValues()
  var sup = getMonthlySupreme(leadsData, prev)
  if (!sup || sup.count === 0) return null
  var txSheet = ss.getSheetByName('Transactions')
  var txData = txSheet.getDataRange().getValues()
  if (hasSupremeBonus(txData, sup.lsId)) return null
  var source = 'SUPREME:' + prev.getFullYear() + '-' + ('0' + (prev.getMonth() + 1)).slice(-2)
  txSheet.appendRow([new Date().toISOString(), '', '', 'LEVEL_BONUS', SUPREME_BONUS, sup.lsId, source])
  return sup
}

// ----------------------------------------------
// AUTH SUPPORT (called only by the Vercel auth functions, with SERVER_KEY)
// Passwords are hashed in Vercel (scrypt). Apps Script only stores the hash.
// ----------------------------------------------
function adminEmails() {
  var raw = PropertiesService.getScriptProperties().getProperty('ADMIN_EMAILS') || 'reverendqs@gmail.com'
  return raw.toLowerCase().split(',').map(function (x) { return x.trim() }).filter(Boolean)
}

// Returns a user object or null. Same account rules as the old validate_login, plus admins.
function lookupUser(email) {
  email = String(email || '').toLowerCase().trim()
  if (!email) return null
  if (adminEmails().indexOf(email) !== -1) {
    return { role: 'admin', id: 'adm1', name: 'Quenton Stroud', email: email }
  }
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID)

  var agSheet = ss.getSheetByName('Agent_Broker_Applications')
  if (agSheet) {
    var agData = agSheet.getDataRange().getValues()
    for (var i = 1; i < agData.length; i++) {
      if (String(agData[i][3] || '').toLowerCase().trim() === email) {
        return { role: 'agent', id: 'ag-' + i, name: agData[i][1], agency: agData[i][2], email: agData[i][3], phone: agData[i][4] }
      }
    }
  }
  var usersSheet = ss.getSheetByName('Users')
  if (usersSheet) {
    var u = usersSheet.getDataRange().getValues()
    for (var j = 1; j < u.length; j++) {
      if (String(u[j][3] || '').toLowerCase().trim() === email && u[j][2] === 'lifesaver') {
        return { role: 'lifesaver', id: u[j][0], name: u[j][1], email: u[j][3], handle: u[j][4], tier: u[j][5], agentEmail: u[j][6] }
      }
    }
  }
  var lsSheet = ss.getSheetByName('LifeSaver_Applications')
  if (lsSheet) {
    var l = lsSheet.getDataRange().getValues()
    for (var k = 1; k < l.length; k++) {
      if (String(l[k][2] || '').toLowerCase().trim() === email) {
        return { role: 'lifesaver', id: 'ls-' + k, name: l[k][1], email: l[k][2], phone: l[k][3], handle: '', tier: 'Pending Activation', agentEmail: '' }
      }
    }
  }
  return null
}

function credentialsSheet(ss) {
  var sh = ss.getSheetByName('Credentials')
  if (!sh) { sh = ss.insertSheet('Credentials'); sh.appendRow(['Email', 'PasswordHash', 'UpdatedAt']) }
  return sh
}

function authGetCredential(params) {
  var email = String(params.email || '').toLowerCase().trim()
  var sh = credentialsSheet(SpreadsheetApp.openById(SPREADSHEET_ID))
  var rows = sh.getDataRange().getValues()
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).toLowerCase().trim() === email) return jsonOut({ found: true, hash: String(rows[i][1]) })
  }
  return jsonOut({ found: false })
}

function authSetCredential(d) {
  var email = String(d.email || '').toLowerCase().trim()
  if (!email || !d.hash) return respond(400, 'Bad request')
  if (!lookupUser(email)) return respond(404, 'No account')
  var lock = LockService.getScriptLock(); lock.waitLock(20000)
  try {
    var sh = credentialsSheet(SpreadsheetApp.openById(SPREADSHEET_ID))
    var rows = sh.getDataRange().getValues()
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).toLowerCase().trim() === email) {
        sh.getRange(i + 1, 2).setValue(String(d.hash)); sh.getRange(i + 1, 3).setValue(new Date().toISOString())
        return respond(200, 'Password updated')
      }
    }
    sh.appendRow([email, String(d.hash), new Date().toISOString()])
    return respond(200, 'Password set')
  } finally { lock.releaseLock() }
}

// Sliding counter in the script cache. Returns { allowed } and counts this attempt.
function authThrottle(d) {
  var cache = CacheService.getScriptCache()
  var key = 'thr:' + String(d.key || '')
  var lock = LockService.getScriptLock(); lock.waitLock(10000)
  try {
    var n = parseInt(cache.get(key) || '0', 10)
    if (n >= (Number(d.limit) || 5)) return jsonOut({ allowed: false })
    cache.put(key, String(n + 1), Math.min(21600, Number(d.windowSec) || 900))
    return jsonOut({ allowed: true })
  } finally { lock.releaseLock() }
}

// Single-use token ids. First call for a jti returns ok:true, later calls ok:false.
function authConsume(d) {
  var cache = CacheService.getScriptCache()
  var key = 'jti:' + String(d.jti || '')
  if (!d.jti) return jsonOut({ ok: false })
  var lock = LockService.getScriptLock(); lock.waitLock(10000)
  try {
    if (cache.get(key)) return jsonOut({ ok: false })
    cache.put(key, '1', 21600)
    return jsonOut({ ok: true })
  } finally { lock.releaseLock() }
}

function sendMagicLink(d) {
  var email = String(d.email || '').toLowerCase().trim()
  if (!lookupUser(email)) return respond(404, 'No account')
  var link = String(d.link || '')
  if (link.indexOf('https://') !== 0) return respond(400, 'Bad link')
  sendEmail(email, 'Your LifeSavers Elite sign-in link',
    '<h2 style="color:#fff;">Sign in to LifeSavers Elite</h2>'
    + '<p>Click the button to sign in. This link works once and expires in 15 minutes.</p>'
    + '<div style="text-align:center;margin:32px 0;"><a href="' + escHtml(link) + '" style="background:#C01428;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;">Sign In</a></div>'
    + '<p style="color:#9ca3af;font-size:12px;">If you did not ask for this, you can ignore this email. Nobody can sign in without it.</p>')
  return respond(200, 'Sent')
}

// ----------------------------------------------
// PAYOUT REPORT FOR PAYROLL
// Owed = LIFESAVER_PAYOUT + LEVEL_BONUS earned up to `through`, minus everything already marked PAYOUT_PAID.
// ----------------------------------------------
function buildPayoutReport(ss, through) {
  var cutoff = through ? new Date(through) : new Date()
  var txData = ss.getSheetByName('Transactions').getDataRange().getValues()
  var by = {}
  function slot(id) { return by[id] || (by[id] = { lsId: id, leads: 0, commissions: 0, bonuses: 0, paid: 0 }) }
  for (var i = 1; i < txData.length; i++) {
    var tx = txData[i], type = tx[3], id = String(tx[5] || '')
    if (!id) continue
    var amt = parseFloat(tx[4]) || 0
    if (type === 'PAYOUT_PAID') { slot(id).paid += amt; continue }
    if (type !== 'LIFESAVER_PAYOUT' && type !== 'LEVEL_BONUS') continue
    if (new Date(tx[0]) > cutoff) continue
    if (type === 'LIFESAVER_PAYOUT') { slot(id).leads++; slot(id).commissions += amt }
    else slot(id).bonuses += amt
  }
  var people = {}
  var users = ss.getSheetByName('Users') ? ss.getSheetByName('Users').getDataRange().getValues() : []
  for (var u = 1; u < users.length; u++) people[String(users[u][0])] = { name: users[u][1], email: users[u][3], handle: users[u][4] }
  var rows = [], total = 0
  for (var k in by) {
    var r = by[k], p = people[k] || {}
    r.commissions = round2(r.commissions); r.bonuses = round2(r.bonuses); r.paid = round2(r.paid)
    r.due = Math.max(0, round2(r.commissions + r.bonuses - r.paid))
    r.name = p.name || ''; r.email = p.email || ''; r.handle = p.handle || ''
    if (r.commissions || r.bonuses || r.paid) { rows.push(r); total += r.due }
  }
  rows.sort(function (a, b) { return b.due - a.due })
  return { through: cutoff.toISOString(), rows: rows, totalDue: round2(total) }
}

function getPayoutReport(params) {
  var rep = buildPayoutReport(SpreadsheetApp.openById(SPREADSHEET_ID), params.through)
  rep.status = 200
  return jsonOut(rep)
}

// Marks everything currently due (up to `through`) as paid. Pass expectedTotal from the report the admin
// reviewed: if the numbers moved since, nothing is recorded. Idempotent per batchId.
function handleMarkPaid(d) {
  if (!d.batchId || !/^[A-Za-z0-9_-]{6,60}$/.test(String(d.batchId))) return respond(400, 'Bad batch id')
  var lock = LockService.getScriptLock(); lock.waitLock(20000)
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID)
    var txSheet = ss.getSheetByName('Transactions')
    var tx = txSheet.getDataRange().getValues()
    for (var i = 1; i < tx.length; i++) {
      if (tx[i][3] === 'PAYOUT_PAID' && String(tx[i][6]).indexOf('BATCH:' + d.batchId + '|') === 0) return respond(200, 'Already marked')
    }
    var rep = buildPayoutReport(ss, d.through)
    var only = d.lsIds && d.lsIds.length ? d.lsIds.map(String) : null
    var rows = rep.rows.filter(function (r) { return r.due > 0.004 && (!only || only.indexOf(String(r.lsId)) !== -1) })
    var total = round2(rows.reduce(function (s, r) { return s + r.due }, 0))
    if (Math.abs(total - (Number(d.expectedTotal) || 0)) > 0.009) {
      return jsonOut({ status: 409, message: 'Totals changed since you opened the report', totalDue: total })
    }
    var ts = new Date().toISOString()
    rows.forEach(function (r) {
      txSheet.appendRow([ts, '', '', 'PAYOUT_PAID', r.due, r.lsId, 'BATCH:' + d.batchId + '|through:' + rep.through])
    })
    return jsonOut({ status: 200, message: 'Marked paid', count: rows.length, total: total })
  } finally { lock.releaseLock() }
}

// ----------------------------------------------
// FINANCE: gross, corrected gross, LSE fees, net income, by period
// Definitions (owner decision 2026-11-22):
//   Gross income     = everything agents paid (AGENT_CHARGE)
//   Corrected gross  = gross - refunds - Stripe processing fees
//   LSE net income   = corrected gross - LifeSaver commissions - level bonuses
//   LSE fees         = the $5 service fees earned (shown on their own line)
// Weeks run Sunday to Saturday in the script's time zone.
// ----------------------------------------------
var TAX_1099_THRESHOLD = 600

function startOfWeek(d) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - x.getDay()); return x }
function addDays(d, n) { var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x }

function periodBounds(now) {
  var wk = startOfWeek(now)
  var mo = new Date(now.getFullYear(), now.getMonth(), 1)
  return {
    thisWeek:  { label: 'This week',    start: wk, end: addDays(wk, 7) },
    lastWeek:  { label: 'Last week',    start: addDays(wk, -7), end: wk },
    thisMonth: { label: 'This month',   start: mo, end: new Date(now.getFullYear(), now.getMonth() + 1, 1) },
    lastMonth: { label: 'Last month',   start: new Date(now.getFullYear(), now.getMonth() - 1, 1), end: mo },
    ytd:       { label: 'Year to date', start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear() + 1, 0, 1) }
  }
}

function inRange(ts, start, end) { var d = new Date(ts); return d >= start && d < end }

// Pure: totals for one period from the ledger (Transactions) and the Leads sheet.
function computeFinance(txData, leadsData, start, end) {
  var t = { gross: 0, refunds: 0, stripeFees: 0, correctedGross: 0, lseFees: 0, commissions: 0, bonuses: 0, lseNet: 0,
            payoutsPaid: 0, paidLeads: 0, freeUnlocks: 0, leadsSubmitted: 0 }
  for (var i = 1; i < txData.length; i++) {
    var tx = txData[i]
    if (!inRange(tx[0], start, end)) continue
    var amt = parseFloat(tx[4]) || 0
    switch (tx[3]) {
      case 'AGENT_CHARGE':     t.gross += amt; t.paidLeads++; break
      case 'REFUND':           t.refunds += amt; break
      case 'STRIPE_FEE':       t.stripeFees += amt; break
      case 'LSE_FEE':          t.lseFees += amt; break
      case 'LIFESAVER_PAYOUT': t.commissions += amt; break
      case 'LEVEL_BONUS':      t.bonuses += amt; break
      case 'PAYOUT_PAID':      t.payoutsPaid += amt; break
      case 'FREE_UNLOCK':      t.freeUnlocks++; break
    }
  }
  for (var j = 1; j < (leadsData || []).length; j++) if (leadsData[j][0] && inRange(leadsData[j][1], start, end)) t.leadsSubmitted++
  ;['gross', 'refunds', 'stripeFees', 'lseFees', 'commissions', 'bonuses', 'payoutsPaid'].forEach(function (k) { t[k] = round2(t[k]) })
  t.correctedGross = round2(t.gross - t.refunds - t.stripeFees)
  t.lseNet = round2(t.correctedGross - t.commissions - t.bonuses)
  return t
}

function withBounds(p, totals) {
  totals.label = p.label; totals.start = p.start.toISOString(); totals.end = p.end.toISOString()
  return totals
}

function piOf(source) { var m = /\|pi:([^|]+)/.exec(String(source || '')); return m ? m[1] : '' }

// Charges that must be refunded (lead not unlocked) and have not been fully refunded yet.
function pendingRefunds(txData) {
  var need = {}, done = {}
  for (var i = 1; i < txData.length; i++) {
    var tx = txData[i], pi = piOf(tx[6]), amt = parseFloat(tx[4]) || 0
    if (tx[3] === 'NEEDS_REFUND') need[pi || ('row' + i)] = { leadId: tx[1], agentEmail: tx[2], amount: round2(amt), reason: String(tx[6]).split('|').pop(), date: new Date(tx[0]).toISOString() }
    if (tx[3] === 'REFUND' && pi) done[pi] = (done[pi] || 0) + amt
  }
  var out = []
  for (var k in need) if ((done[k] || 0) + 0.004 < need[k].amount) out.push(need[k])
  return out
}

// 1099-NEC tracking: what was actually paid to each LifeSaver in a calendar year (cash basis).
function tax1099(txData, ss, year) {
  var by = {}
  for (var i = 1; i < txData.length; i++) {
    var tx = txData[i]
    if (tx[3] !== 'PAYOUT_PAID' || new Date(tx[0]).getFullYear() !== year) continue
    var id = String(tx[5] || ''); if (!id) continue
    by[id] = (by[id] || 0) + (parseFloat(tx[4]) || 0)
  }
  var people = {}, users = ss.getSheetByName('Users') ? ss.getSheetByName('Users').getDataRange().getValues() : []
  for (var u = 1; u < users.length; u++) people[String(users[u][0])] = { name: users[u][1], email: users[u][3], handle: users[u][4] }
  var rows = Object.keys(by).map(function (id) {
    var p = people[id] || {}, paid = round2(by[id])
    return { lsId: id, name: p.name || '', email: p.email || '', handle: p.handle || '', paid: paid,
             needs1099: paid >= TAX_1099_THRESHOLD, approaching: paid >= TAX_1099_THRESHOLD - 100 && paid < TAX_1099_THRESHOLD }
  }).sort(function (a, b) { return b.paid - a.paid })
  return { year: year, threshold: TAX_1099_THRESHOLD, rows: rows, count: rows.filter(function (r) { return r.needs1099 }).length }
}

function buildFinance(ss, now, year) {
  var txData = ss.getSheetByName('Transactions').getDataRange().getValues()
  var leadsData = ss.getSheetByName('Leads') ? ss.getSheetByName('Leads').getDataRange().getValues() : []
  var b = periodBounds(now), periods = {}
  Object.keys(b).forEach(function (k) { periods[k] = withBounds(b[k], computeFinance(txData, leadsData, b[k].start, b[k].end)) })
  var weekly = []
  for (var w = 7; w >= 0; w--) {
    var ws = addDays(b.thisWeek.start, -7 * w)
    weekly.push(withBounds({ label: 'Week of ' + (ws.getMonth() + 1) + '/' + ws.getDate(), start: ws, end: addDays(ws, 7) }, computeFinance(txData, leadsData, ws, addDays(ws, 7))))
  }
  var monthly = []
  for (var m = 0; m <= now.getMonth(); m++) {
    var ms = new Date(now.getFullYear(), m, 1), me = new Date(now.getFullYear(), m + 1, 1)
    monthly.push(withBounds({ label: ms.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), start: ms, end: me }, computeFinance(txData, leadsData, ms, me)))
  }
  var payroll = buildPayoutReport(ss)
  return {
    generatedAt: now.toISOString(), periods: periods, weekly: weekly, monthly: monthly,
    refundsPending: pendingRefunds(txData),
    tax1099: tax1099(txData, ss, year || now.getFullYear()),
    payroll: { totalDue: payroll.totalDue, people: payroll.rows.filter(function (r) { return r.due > 0.004 }).length }
  }
}

function getAdminFinance(params) {
  var now = new Date()
  var year = parseInt(params.year, 10)
  if (!(year >= 2020 && year <= now.getFullYear())) year = now.getFullYear()
  var out = buildFinance(SpreadsheetApp.openById(SPREADSHEET_ID), now, year)
  out.status = 200
  return jsonOut(out)
}

// Personal totals for a LifeSaver (earned = commissions + level bonuses).
function lifesaverTotals(ss, txData, lsId, now) {
  var b = periodBounds(now), res = { week: 0, month: 0, ytd: 0, paidThisYear: 0, owedNow: 0, weekly: [] }
  if (!lsId) return res
  for (var i = 1; i < txData.length; i++) {
    var tx = txData[i]
    if (String(tx[5]) !== String(lsId)) continue
    var amt = parseFloat(tx[4]) || 0
    if (tx[3] === 'LIFESAVER_PAYOUT' || tx[3] === 'LEVEL_BONUS') {
      if (inRange(tx[0], b.thisWeek.start, b.thisWeek.end)) res.week += amt
      if (inRange(tx[0], b.thisMonth.start, b.thisMonth.end)) res.month += amt
      if (inRange(tx[0], b.ytd.start, b.ytd.end)) res.ytd += amt
    }
    if (tx[3] === 'PAYOUT_PAID' && inRange(tx[0], b.ytd.start, b.ytd.end)) res.paidThisYear += amt
  }
  for (var w = 7; w >= 0; w--) {
    var ws = addDays(b.thisWeek.start, -7 * w), we = addDays(ws, 7), leads = 0, comm = 0, bon = 0
    for (var j = 1; j < txData.length; j++) {
      var t = txData[j]
      if (String(t[5]) !== String(lsId) || !inRange(t[0], ws, we)) continue
      if (t[3] === 'LIFESAVER_PAYOUT') { leads++; comm += parseFloat(t[4]) || 0 }
      if (t[3] === 'LEVEL_BONUS') bon += parseFloat(t[4]) || 0
    }
    res.weekly.push({ week: 'Week of ' + (ws.getMonth() + 1) + '/' + ws.getDate(), leads: leads, commissions: round2(comm), bonuses: round2(bon), total: round2(comm + bon) })
  }
  var mine = buildPayoutReport(ss).rows.filter(function (r) { return String(r.lsId) === String(lsId) })[0]
  res.owedNow = mine ? mine.due : 0
  ;['week', 'month', 'ytd', 'paidThisYear'].forEach(function (k) { res[k] = round2(res[k]) })
  return res
}

// Personal totals for an agent (what they paid, minus refunds), by period.
function agentTotals(txData, agentEmail, now) {
  var b = periodBounds(now), out = {}
  ;['thisWeek', 'thisMonth', 'ytd'].forEach(function (k) { out[k] = { label: b[k].label, spent: 0, refunded: 0, net: 0, leads: 0, freeLeads: 0 } })
  for (var i = 1; i < txData.length; i++) {
    var tx = txData[i]
    if (String(tx[2] || '').toLowerCase().trim() !== agentEmail) continue
    var amt = parseFloat(tx[4]) || 0
    ;['thisWeek', 'thisMonth', 'ytd'].forEach(function (k) {
      if (!inRange(tx[0], b[k].start, b[k].end)) return
      if (tx[3] === 'AGENT_CHARGE') { out[k].spent += amt; out[k].leads++ }
      if (tx[3] === 'REFUND') out[k].refunded += amt
      if (tx[3] === 'FREE_UNLOCK') out[k].freeLeads++
    })
  }
  Object.keys(out).forEach(function (k) { out[k].spent = round2(out[k].spent); out[k].refunded = round2(out[k].refunded); out[k].net = round2(out[k].spent - out[k].refunded) })
  return out
}

// ----------------------------------------------
// REFUNDS (called by the Vercel Stripe webhook on charge.refunded, shared secret)
// amountRefunded is Stripe's running total for the charge, so repeated or partial refunds record only the difference.
// ----------------------------------------------
function handleRefundRecorded(d) {
  if (!d.chargeId) return respond(400, 'Missing charge')
  var lock = LockService.getScriptLock(); lock.waitLock(20000)
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID)
    var txSheet = ss.getSheetByName('Transactions')
    var tx = txSheet.getDataRange().getValues()
    var prefix = 'REFUND:' + d.chargeId + '|', already = 0, session = '', hadPayout = false
    for (var i = 1; i < tx.length; i++) {
      if (tx[i][3] === 'REFUND' && String(tx[i][6]).indexOf(prefix) === 0) already += parseFloat(tx[i][4]) || 0
      if (tx[i][3] === 'AGENT_CHARGE' && d.paymentIntent && piOf(tx[i][6]) === d.paymentIntent) session = String(tx[i][6]).split('|')[0]
    }
    var delta = round2((Number(d.amountRefunded) || 0) / 100 - already)
    if (delta <= 0.004) return respond(200, 'Already recorded')
    if (session) for (var k = 1; k < tx.length; k++) if (tx[k][3] === 'LIFESAVER_PAYOUT' && String(tx[k][6]) === session) hadPayout = true
    var lsId = ''
    var leads = ss.getSheetByName('Leads').getDataRange().getValues()
    for (var j = 1; j < leads.length; j++) if (leads[j][0] === d.leadId) { lsId = leads[j][14]; break }
    var agentEmail = String(d.agentEmail || '').toLowerCase().trim()
    txSheet.appendRow([new Date().toISOString(), d.leadId || '', agentEmail, 'REFUND', delta, lsId, prefix + 'pi:' + (d.paymentIntent || '')])
    if (hadPayout) {
      sendEmail(ADMIN_EMAIL, 'Refund on a purchased lead: ' + (d.leadId || d.chargeId),
        '<p>A refund of $' + delta.toFixed(2) + ' was issued for lead ' + escHtml(d.leadId) + ', which had already been unlocked and credited to the LifeSaver.</p>'
        + '<p>The LifeSaver commission was <strong>not</strong> reversed automatically. Decide whether to adjust it before the next payout.</p>')
    }
    return respond(200, 'Refund recorded')
  } finally { lock.releaseLock() }
}

// ----------------------------------------------
// WEEKLY EMAIL SUMMARY (Sunday morning, via installTriggers)
// ----------------------------------------------
function money2(n) { return '$' + (Number(n) || 0).toFixed(2) }

function weeklySummaryHtml(f) {
  var rows = [['Gross income', 'gross'], ['Refunds', 'refunds'], ['Stripe fees', 'stripeFees'], ['Corrected gross', 'correctedGross'],
              ['LSE service fees', 'lseFees'], ['LifeSaver commissions', 'commissions'], ['Level bonuses', 'bonuses'], ['LSE net income', 'lseNet'],
              ['Paid leads', 'paidLeads'], ['Referrals submitted', 'leadsSubmitted']]
  var cols = [['Last week', f.periods.lastWeek], ['This month', f.periods.thisMonth], ['Year to date', f.periods.ytd]]
  var cell = 'padding:6px 10px;border-bottom:1px solid #333;text-align:right;'
  var html = '<h2 style="color:#fff;">Weekly summary</h2><table style="border-collapse:collapse;width:100%;font-size:14px;"><tr><th style="' + cell + 'text-align:left;"></th>'
  cols.forEach(function (c) { html += '<th style="' + cell + '">' + c[0] + '</th>' })
  html += '</tr>'
  rows.forEach(function (r) {
    var isCount = r[1] === 'paidLeads' || r[1] === 'leadsSubmitted'
    var bold = r[1] === 'correctedGross' || r[1] === 'lseNet'
    html += '<tr><td style="' + cell + 'text-align:left;' + (bold ? 'font-weight:bold;' : '') + '">' + r[0] + '</td>'
    cols.forEach(function (c) { var v = c[1][r[1]]; html += '<td style="' + cell + (bold ? 'font-weight:bold;' : '') + '">' + (isCount ? v : money2(v)) + '</td>' })
    html += '</tr>'
  })
  html += '</table>'
  html += '<p><strong>Payroll due now:</strong> ' + money2(f.payroll.totalDue) + ' to ' + f.payroll.people + ' LifeSaver(s). Pay them, then mark paid in Admin &gt; Revenue.</p>'
  if (f.refundsPending.length) html += '<p style="color:#f59e0b;"><strong>Refunds still to issue:</strong> ' + f.refundsPending.length + ' (' + money2(f.refundsPending.reduce(function (s, r) { return s + r.amount }, 0)) + '). Refund them in Stripe.</p>'
  if (f.tax1099.count) html += '<p><strong>1099-NEC:</strong> ' + f.tax1099.count + ' LifeSaver(s) have been paid ' + money2(TAX_1099_THRESHOLD) + ' or more in ' + f.tax1099.year + '.</p>'
  return html
}

function sendWeeklySummary() {
  var f = buildFinance(SpreadsheetApp.openById(SPREADSHEET_ID), new Date())
  sendEmail(ADMIN_EMAIL, 'LifeSavers Elite weekly summary: corrected gross ' + money2(f.periods.lastWeek.correctedGross), weeklySummaryHtml(f))
}

// ----------------------------------------------
// SHEET SETUP: creates any missing tab and fills in blank header cells. Never renames or deletes anything.
// ----------------------------------------------
var SHEET_HEADERS = {
  LifeSaver_Applications: ['Timestamp', 'Name', 'Email', 'Phone', 'MainSocialMedia', 'Positions', 'Employment', 'Insurance', 'Referral', 'Excites', 'Resume'],
  Agent_Broker_Applications: ['Timestamp', 'Name', 'Agency', 'Email', 'Phone', 'NPN', 'States', 'Years', 'Lines', 'PayoutStructure', 'HearAbout', 'PaymentMethod'],
  Leads: ['LeadID', 'Timestamp', 'LeadName', 'Phone', 'Email', 'City', 'State', 'Age', 'Beneficiaries', 'HealthRating', 'Smoking', 'PolicyType', 'Timeline', 'Notes',
          'LifeSaverID', 'LifeSaverHandle', 'Status', 'StarRating', 'Expiry', 'LSEFee', 'PoolSource', 'BeneficiaryDetails', 'HealthConditions',
          'ReadyForCall', 'AgreedToContact', 'ExistingCoverage', 'CoverageAmount', 'Dependents', 'BestTime'],
  Transactions: ['Timestamp', 'LeadID', 'AgentEmail', 'Type', 'Amount', 'LifeSaverID', 'Source'],
  Users: ['UserID', 'Name', 'Role', 'Email', 'Handle', 'Tier', 'AssignedAgentEmail'],
  Credentials: ['Email', 'PasswordHash', 'UpdatedAt']
}

function setupSheets() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID), report = []
  Object.keys(SHEET_HEADERS).forEach(function (name) {
    var want = SHEET_HEADERS[name], sh = ss.getSheetByName(name)
    if (!sh) { sh = ss.insertSheet(name); sh.appendRow(want); report.push('Created ' + name); return }
    var values = sh.getDataRange().getValues()
    var header = values.length ? values[0] : []
    var empty = !header.length || header.every(function (c) { return String(c).trim() === '' })
    if (empty && values.length <= 1) { if (values.length) for (var c0 = 0; c0 < want.length; c0++) sh.getRange(1, c0 + 1).setValue(want[c0]); else sh.appendRow(want); report.push('Added headers to ' + name); return }
    var filled = 0
    for (var c = 0; c < want.length; c++) {
      if (String(header[c] === undefined ? '' : header[c]).trim() === '') { sh.getRange(1, c + 1).setValue(want[c]); filled++ }
    }
    if (filled) report.push('Filled ' + filled + ' blank header(s) in ' + name)
  })
  return report
}

// Run ONCE from the Apps Script editor (select installTriggers > Run). It sets up the Sheet tabs and schedules:
//   awardSupremeMonthly (1st of the month), autoDeclineExpiredLeads (hourly), sendWeeklySummary (Sunday 7am).
function installTriggers() {
  var report = setupSheets()
  try { resumeFolder(); report.push('Resume folder ready in Google Drive') } catch (e) { report.push('Resume folder not created: ' + e.message) }
  var existing = ScriptApp.getProjectTriggers().map(function (t) { return t.getHandlerFunction() })
  if (existing.indexOf('awardSupremeMonthly') === -1) {
    ScriptApp.newTrigger('awardSupremeMonthly').timeBased().onMonthDay(1).atHour(6).create(); report.push('Scheduled awardSupremeMonthly')
  }
  if (existing.indexOf('autoDeclineExpiredLeads') === -1) {
    ScriptApp.newTrigger('autoDeclineExpiredLeads').timeBased().everyHours(1).create(); report.push('Scheduled autoDeclineExpiredLeads')
  }
  if (existing.indexOf('sendWeeklySummary') === -1) {
    ScriptApp.newTrigger('sendWeeklySummary').timeBased().onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(7).create(); report.push('Scheduled sendWeeklySummary')
  }
  return report
}
function installMonthlyTriggers() { return installTriggers() }   // old name, kept so existing instructions still work

// ----------------------------------------------
// LEAD DECLINE
// ----------------------------------------------
function handleLeadDecline(d) {
  var ss         = SpreadsheetApp.openById(SPREADSHEET_ID)
  var leadsSheet = ss.getSheetByName('Leads')
  var data       = leadsSheet.getDataRange().getValues()
  var agentEmail = String(d.agentEmail || '').toLowerCase().trim()

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === d.leadId) {
      var row = data[i]
      if (row[16] !== 'PENDING') return respond(409, 'Lead is not pending')
      var assigned = String(getAgentEmailForLifeSaver(row[14]) || '').toLowerCase().trim()
      if (!agentEmail || assigned !== agentEmail) return respond(403, 'Not your lead')
      leadsSheet.getRange(i + 1, 17).setValue('POOL')
      leadsSheet.getRange(i + 1, 20).setValue('Declined by assigned Agent')

      var lsEmail = getLSEmailById(ss, String(row[14]))
      if (lsEmail) {
        sendEmail(lsEmail,
          'Your referral for ' + String(row[2]).split(' ')[0] + ' was declined - but it is not over yet',
          lifesaverDeclineBody(row))
      }
      break
    }
  }
  return respond(200, 'Lead declined - moved to pool')
}

// ----------------------------------------------
// AUTO-DECLINE TRIGGER (set as hourly time-based trigger)
// ----------------------------------------------
function autoDeclineExpiredLeads() {
  var ss         = SpreadsheetApp.openById(SPREADSHEET_ID)
  var leadsSheet = ss.getSheetByName('Leads')
  var data       = leadsSheet.getDataRange().getValues()
  var now        = new Date()

  for (var i = 1; i < data.length; i++) {
    var status = data[i][16]
    var expiry = new Date(data[i][18])
    if (status === 'PENDING' && now > expiry) {
      leadsSheet.getRange(i + 1, 17).setValue('POOL')
      leadsSheet.getRange(i + 1, 20).setValue('48hr window expired - auto-released')
    }
  }
}

// ----------------------------------------------
// HELPERS
// ----------------------------------------------
function respond(code, message) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: code, message: message }))
    .setMimeType(ContentService.MimeType.JSON)
}

function sendEmail(to, subject, htmlBody) {
  MailApp.sendEmail({ to: to, subject: subject, htmlBody: wrapEmail(htmlBody), replyTo: ADMIN_EMAIL })
}

function getAgentEmailForLifeSaver(lifesaverId) {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID)
  var sheet = ss.getSheetByName('Users')
  if (!sheet) return null
  var data  = sheet.getDataRange().getValues()
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(lifesaverId) && data[i][2] === 'lifesaver') {
      return data[i][6]
    }
  }
  return null
}

// ----------------------------------------------
// EMAIL TEMPLATES
// ----------------------------------------------
function wrapEmail(body) {
  return '<div style="background:#080d17;color:#ffffff;font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;border-radius:12px;overflow:hidden;">'
    + '<div style="background:#C01428;padding:24px 32px;">'
    + '<h1 style="margin:0;font-size:20px;color:#fff;">LifeSavers Elite</h1>'
    + '</div>'
    + '<div style="padding:32px;">'
    + body
    + '<hr style="border-color:#1a2035;margin:32px 0;">'
    + '<p style="color:#6b7280;font-size:12px;">' + SIGN_OFF + '</p>'
    + '</div></div>'
}

function adminAppEmailBody(d) {
  var resume = String(d.resumeAttached || '')
  return '<h2 style="color:#C01428;">New LifeSaver Application</h2>'
    + '<p><strong>Name:</strong> ' + escHtml(d.name) + '</p>'
    + '<p><strong>Email:</strong> ' + escHtml(d.email) + '</p>'
    + '<p><strong>Phone:</strong> ' + escHtml(d.phone) + '</p>'
    + '<p><strong>Main social media:</strong> ' + escHtml(d.facebook) + '</p>'
    + '<p><strong>Positions:</strong> ' + escHtml(d.positions) + '</p>'
    + '<p><strong>Employment:</strong> ' + escHtml(d.employment) + '</p>'
    + '<p><strong>Insurance Knowledge:</strong> ' + escHtml(d.insurance) + '</p>'
    + '<p><strong>Referral Comfort:</strong> ' + escHtml(d.referral) + '</p>'
    + '<p><strong>What Excites Them:</strong> ' + escHtml(d.excites) + '</p>'
    + '<p><strong>Resume:</strong> ' + (resume.indexOf('https://') === 0 ? '<a href="' + escHtml(resume) + '">Open in Google Drive</a>' : escHtml(resume || 'No')) + '</p>'
}

function applicantConfirmationBody(firstName) {
  return '<h2 style="color:#4ade80;">You are one step closer, ' + escHtml(firstName) + '.</h2>'
    + '<p>Thank you for applying to LifeSavers Elite. Our team will review your application promptly.</p>'
    + '<p>You can start your training now: go to <a href="https://app.lifesaverselite.com/login">app.lifesaverselite.com/login</a>, enter this email address, and we will send you a secure sign-in link.</p>'
    + '<p>Book your interview now to move to priority review.</p>'
    + '<div style="text-align:center;margin:32px 0;">'
    + '<a href="' + CAL_URL + '" style="background:#C01428;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;">Book Your Interview</a>'
    + '</div>'
}

function agentAppEmailBody(d) {
  return '<h2 style="color:#C01428;">New Agent/Broker Application</h2>'
    + '<p><strong>Agency:</strong> ' + d.agency + '</p>'
    + '<p><strong>Contact:</strong> ' + d.name + ' | ' + d.email + ' | ' + d.phone + '</p>'
    + '<p><strong>NPN:</strong> ' + d.license + ' | States: ' + d.states + '</p>'
    + '<p><strong>Years:</strong> ' + d.years + '</p>'
    + '<p><strong>Lines:</strong> ' + d.lines + '</p>'
    + '<p><strong>Payout Structure:</strong> ' + d.payoutStructure + '</p>'
    + '<p><strong>Payment Method:</strong> ' + d.paymentMethod + '</p>'
}

function lifesaverSubmitBody(d, leadId, expiry) {
  return '<h2 style="color:#4ade80;">Referral Submitted Successfully</h2>'
    + '<p>Your referral for <strong>' + d.leadName + '</strong> has been sent to your assigned agent.</p>'
    + '<p><strong>Lead ID:</strong> ' + leadId + '</p>'
    + '<p><strong>Policy Interest:</strong> ' + d.policyInterest + '</p>'
    + '<p><strong>Agent has until:</strong> ' + new Date(expiry).toLocaleString() + ' to accept or decline.</p>'
    + '<p>If the agent accepts, you will receive an email with your star rating and earnings.</p>'
}

function agentNewLeadBody(d, leadId, expiry) {
  return '<h2 style="color:#C01428;">New Referral - Action Required Within 48 Hours</h2>'
    + '<p><strong>From:</strong> ' + d.lifesaverHandle + '</p>'
    + '<p><strong>Lead ID:</strong> ' + leadId + '</p>'
    + '<p><strong>Policy:</strong> ' + d.policyInterest + ' | <strong>Age:</strong> ' + d.age + ' | <strong>Health:</strong> ' + d.healthRating + '/10 | <strong>Smoking:</strong> ' + d.smoking + '</p>'
    + '<p style="color:#f59e0b;"><strong>Expiry:</strong> ' + new Date(expiry).toLocaleString() + '</p>'
    + '<div style="text-align:center;margin:32px 0;">'
    + '<a href="https://lifesaverselite.com/dashboard/agent" style="background:#C01428;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;">Review Lead</a>'
    + '</div>'
}

function lifesaverDeclineBody(row) {
  return '<h2 style="color:#f59e0b;">Your referral was declined - but it is not over yet.</h2>'
    + '<p>Your referral for <strong>' + row[2] + '</strong> was not accepted by your assigned agent.</p>'
    + '<p>It has been moved to the General Pool where any active agent can claim it. Your payout is still protected.</p>'
}
