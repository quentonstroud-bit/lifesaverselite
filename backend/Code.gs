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

// ──────────────────────────────────────────────
// CONFIGURATION
// ──────────────────────────────────────────────
var SPREADSHEET_ID = '1aQ6PZ5zoSfnHZ0XkluZXwLFWjxwPPgeNVy1zKCQU0WA'
var ADMIN_EMAIL    = 'qcandoit@gmail.com'
var CAL_URL        = 'https://cal.com/quenton-stroud/30min'
var SIGN_OFF       = 'Sincerely,<br><strong>Quenton Stroud</strong><br>Executive Manager, LifeSavers Elite'
var PLATFORM_FEE   = 2.00

// ──────────────────────────────────────────────
// ENTRY POINT
// ──────────────────────────────────────────────
function doGet(e) {
  var query = e && e.parameter && e.parameter.query
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
  return ContentService
    .createTextOutput(JSON.stringify({ status: 200, message: 'LifeSavers Elite API is live.' }))
    .setMimeType(ContentService.MimeType.JSON)
}

// ──────────────────────────────────────────────
// VALIDATE LOGIN
// ──────────────────────────────────────────────
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

  // Check LifeSaver_Applications (col 2 = email) — pending applicants
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

// ──────────────────────────────────────────────
// LS DATA (referrals + earnings for a LifeSaver)
// ──────────────────────────────────────────────
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
    var stars  = Number(row[17]) || 0
    var ts     = new Date(row[1])
    if (status === 'ACCEPTED') totalAccepted++
    if (ts >= weekAgo && (status === 'ACCEPTED' || status === 'PENDING')) weeklyLeadsCount++

    referrals.push({
      id:     row[0],
      name:   row[2],
      policy: row[11],
      status: status,
      stars:  stars,
      earned: status === 'ACCEPTED' ? (stars * 6) : null,
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
    if (tx[3] === 'LIFESAVER_PAYOUT' && String(tx[5]) === lsId) {
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
    weeklyLeadsCount: weeklyLeadsCount,
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

// ──────────────────────────────────────────────
// AGENT LEADS (pending leads for this agent)
// ──────────────────────────────────────────────
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
        firstName: String(row[2]).split(' ')[0],
        lastInitial: (String(row[2]).split(' ')[1] || 'X')[0],
        city: row[5], state: row[6],
        hoursLeft: hoursLeft,
        stars: Number(row[17]) || 0,
        age: row[7], health: row[9], smoking: row[10],
        beneficiaries: row[8], policy: row[11], timeline: row[12],
        lifesaverHandle: row[15], notes: row[13]
      })
    }
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: 200, leads: leads, accepted: accepted, declined: declined
  })).setMimeType(ContentService.MimeType.JSON)
}

// ──────────────────────────────────────────────
// AGENT LIFESAVERS
// ──────────────────────────────────────────────
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

// ──────────────────────────────────────────────
// AGENT SPEND
// ──────────────────────────────────────────────
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
    if (!txMap[leadId]) txMap[leadId] = { leadId: leadId, lseFee: 0, lifesaverPayout: 0, status: tx[6], lifesaverId: String(tx[5]) }

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
      status: t.status,
      date: lead.ts ? new Date(lead.ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
    }
  })

  return ContentService.createTextOutput(JSON.stringify({
    status: 200,
    transactions: transactions,
    totalLSEFees: totalLSEFees,
    totalPayouts: totalPayouts,
    acceptedCount: acceptedCount
  })).setMimeType(ContentService.MimeType.JSON)
}

// ──────────────────────────────────────────────
// POOL LEADS
// ──────────────────────────────────────────────
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
      firstName: String(row[2]).split(' ')[0],
      lastInitial: (String(row[2]).split(' ')[1] || 'X')[0],
      city: row[5], state: row[6],
      hoursLeft: hoursLeft,
      stars: Number(row[17]) || 0,
      age: row[7], health: row[9], smoking: row[10],
      beneficiaries: row[8], policy: row[11], timeline: row[12],
      lifesaverHandle: row[15],
      source: String(row[19] || 'Available in pool')
    })
  }

  leads.sort(function(a, b) { return a.hoursLeft - b.hoursLeft })
  return ContentService.createTextOutput(JSON.stringify({ status: 200, leads: leads }))
    .setMimeType(ContentService.MimeType.JSON)
}

// ──────────────────────────────────────────────
// ADMIN — LIFESAVERS
// ──────────────────────────────────────────────
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

  // Build email→userId map from Users sheet
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

// ──────────────────────────────────────────────
// ADMIN — AGENTS
// ──────────────────────────────────────────────
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
      // declined by this agent's LifeSavers — rough approximation via pool moves
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

// ──────────────────────────────────────────────
// ADMIN — ALL LEADS
// ──────────────────────────────────────────────
function getAdminLeads() {
  var ss         = SpreadsheetApp.openById(SPREADSHEET_ID)
  var leadsSheet = ss.getSheetByName('Leads')
  if (!leadsSheet) return ContentService.createTextOutput(JSON.stringify({ status: 200, leads: [] })).setMimeType(ContentService.MimeType.JSON)

  var leadsData = leadsSheet.getDataRange().getValues()

  // Build lsId→agentEmail map from Users sheet
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

  // Build agentEmail→agency map
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
      name:      String(row[2]).split(' ')[0] + ' ' + (String(row[2]).split(' ')[1] || '')[0] + '.',
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

// ──────────────────────────────────────────────
// ADMIN — REVENUE
// ──────────────────────────────────────────────
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

  // Build agent email→agency map
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

// ──────────────────────────────────────────────
// ADMIN OVERVIEW STATS
// ──────────────────────────────────────────────
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

// ──────────────────────────────────────────────
// POST HANDLERS
// ──────────────────────────────────────────────
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents)
    var type = data.formType

    if (type === 'application')        return handleApplication(data)
    if (type === 'agent_enrollment')   return handleAgentEnrollment(data)
    if (type === 'referral_submit')    return handleReferralSubmit(data)
    if (type === 'lead_rating')        return handleLeadRating(data)
    if (type === 'lead_accept')        return handleLeadAccept(data)
    if (type === 'lead_decline')       return handleLeadDecline(data)
    if (type === 'claim_from_pool')    return handleClaimFromPool(data)
    if (type === 'approve_lifesaver')  return respond(200, 'Noted — add to Users sheet manually to activate')

    return respond(400, 'Unknown form type: ' + type)
  } catch (err) {
    return respond(500, 'Server error: ' + err.message)
  }
}

// ──────────────────────────────────────────────
// LIFESAVER APPLICATION
// ──────────────────────────────────────────────
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

// ──────────────────────────────────────────────
// AGENT ENROLLMENT
// ──────────────────────────────────────────────
function handleAgentEnrollment(d) {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID)
  var sheet = ss.getSheetByName('Agent_Broker_Applications')
  var ts    = new Date().toISOString()

  sheet.appendRow([
    ts, d.name, d.agency, d.email, d.phone,
    d.license, d.states, d.years, d.lines,
    d.payoutStructure, d.hearAbout, d.paymentMethod,
    d.tempPassword || ''
  ])

  sendEmail(ADMIN_EMAIL, 'New Agent/Broker Application - ' + d.agency, agentAppEmailBody(d))

  return respond(200, 'Agent enrollment received')
}

// ──────────────────────────────────────────────
// REFERRAL SUBMISSION
// ──────────────────────────────────────────────
function handleReferralSubmit(d) {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID)
  var sheet = ss.getSheetByName('Leads')
  var ts    = new Date().toISOString()
  var leadId = 'LD-' + Date.now()
  var expiry = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

  sheet.appendRow([
    leadId, ts, d.leadName, d.phone, d.email || '',
    d.city || '', d.state || '', d.age, d.beneficiaries || 0,
    d.healthRating, d.smoking, d.policyInterest, d.timeline,
    d.notes || '', d.lifesaverId, d.lifesaverHandle,
    'PENDING', '', expiry, PLATFORM_FEE
  ])

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

// ──────────────────────────────────────────────
// LEAD RATING
// ──────────────────────────────────────────────
function handleLeadRating(d) {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID)
  var sheet = ss.getSheetByName('Leads')
  var data  = sheet.getDataRange().getValues()
  var ts    = new Date().toISOString()

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === d.leadId) {
      sheet.getRange(i + 1, 18).setValue(d.stars)
      if (d.override) sheet.getRange(i + 1, 19).setValue('OVERRIDE: ' + d.overrideReason + ' at ' + ts)
      break
    }
  }
  return respond(200, 'Rating saved')
}

// ──────────────────────────────────────────────
// LEAD ACCEPT
// ──────────────────────────────────────────────
function handleLeadAccept(d) {
  var ss         = SpreadsheetApp.openById(SPREADSHEET_ID)
  var leadsSheet = ss.getSheetByName('Leads')
  var txSheet    = ss.getSheetByName('Transactions')
  var data       = leadsSheet.getDataRange().getValues()
  var ts         = new Date().toISOString()

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === d.leadId) {
      var row = data[i]
      leadsSheet.getRange(i + 1, 17).setValue('ACCEPTED')
      txSheet.appendRow([ts, d.leadId, d.agentId, 'LSE_FEE',           PLATFORM_FEE,      row[14], 'ACCEPTED'])
      txSheet.appendRow([ts, d.leadId, d.agentId, 'LIFESAVER_PAYOUT',  d.lifesaverPayout, row[14], 'ACCEPTED'])

      var lsEmail = getLSEmailById(ss, String(row[14]))
      if (lsEmail) {
        sendEmail(lsEmail,
          'Your referral for ' + String(row[2]).split(' ')[0] + ' was accepted',
          lifesaverAcceptBody(row, d))
      }
      break
    }
  }
  return respond(200, 'Lead accepted')
}

function getLSEmailById(ss, lsId) {
  var usersSheet = ss.getSheetByName('Users')
  if (!usersSheet) return null
  var data = usersSheet.getDataRange().getValues()
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === lsId) return data[i][3]
  }
  return null
}

// ──────────────────────────────────────────────
// LEAD DECLINE
// ──────────────────────────────────────────────
function handleLeadDecline(d) {
  var ss         = SpreadsheetApp.openById(SPREADSHEET_ID)
  var leadsSheet = ss.getSheetByName('Leads')
  var data       = leadsSheet.getDataRange().getValues()

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === d.leadId) {
      var row = data[i]
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

// ──────────────────────────────────────────────
// CLAIM FROM POOL
// ──────────────────────────────────────────────
function handleClaimFromPool(d) {
  var ss         = SpreadsheetApp.openById(SPREADSHEET_ID)
  var leadsSheet = ss.getSheetByName('Leads')
  var txSheet    = ss.getSheetByName('Transactions')
  var data       = leadsSheet.getDataRange().getValues()
  var ts         = new Date().toISOString()

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === d.leadId) {
      leadsSheet.getRange(i + 1, 17).setValue('ACCEPTED')
      txSheet.appendRow([ts, d.leadId, d.agentId, 'LSE_FEE',          PLATFORM_FEE,      data[i][14], 'POOL_CLAIM'])
      txSheet.appendRow([ts, d.leadId, d.agentId, 'LIFESAVER_PAYOUT', d.lifesaverPayout, data[i][14], 'POOL_CLAIM'])
      break
    }
  }
  return respond(200, 'Lead claimed from pool')
}

// ──────────────────────────────────────────────
// AUTO-DECLINE TRIGGER (set as hourly time-based trigger)
// ──────────────────────────────────────────────
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

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────
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

// ──────────────────────────────────────────────
// EMAIL TEMPLATES
// ──────────────────────────────────────────────
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
  return '<h2 style="color:#C01428;">New LifeSaver Application</h2>'
    + '<p><strong>Name:</strong> ' + d.name + '</p>'
    + '<p><strong>Email:</strong> ' + d.email + '</p>'
    + '<p><strong>Phone:</strong> ' + d.phone + '</p>'
    + '<p><strong>Facebook:</strong> ' + d.facebook + '</p>'
    + '<p><strong>Positions:</strong> ' + d.positions + '</p>'
    + '<p><strong>Employment:</strong> ' + d.employment + '</p>'
    + '<p><strong>Insurance Knowledge:</strong> ' + d.insurance + '</p>'
    + '<p><strong>Referral Comfort:</strong> ' + d.referral + '</p>'
    + '<p><strong>What Excites Them:</strong> ' + d.excites + '</p>'
}

function applicantConfirmationBody(firstName) {
  return '<h2 style="color:#4ade80;">You are one step closer, ' + firstName + '.</h2>'
    + '<p>Thank you for applying to LifeSavers Elite. Our team will review your application promptly.</p>'
    + '<p>Book your interview now to move to priority review.</p>'
    + '<div style="text-align:center;margin:32px 0;">'
    + '<a href="' + CAL_URL + '" style="background:#C01428;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;">Book Your Interview</a>'
    + '</div>'
}

function agentAppEmailBody(d) {
  return '<h2 style="color:#C01428;">New Agent/Broker Application</h2>'
    + '<p><strong>Agency:</strong> ' + d.agency + '</p>'
    + '<p><strong>Contact:</strong> ' + d.name + ' · ' + d.email + ' · ' + d.phone + '</p>'
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

function lifesaverAcceptBody(row, d) {
  return '<h2 style="color:#4ade80;">Your referral was accepted.</h2>'
    + '<p>Your referral for <strong>' + row[2] + '</strong> was accepted.</p>'
    + '<p><strong>Star Rating:</strong> ' + d.stars + ' / 5</p>'
    + '<p><strong>You Earned:</strong> $' + (d.lifesaverPayout || 0).toFixed(2) + '</p>'
    + '<p><strong>Payout Date:</strong> Next Sunday</p>'
}

function lifesaverDeclineBody(row) {
  return '<h2 style="color:#f59e0b;">Your referral was declined - but it is not over yet.</h2>'
    + '<p>Your referral for <strong>' + row[2] + '</strong> was not accepted by your assigned agent.</p>'
    + '<p>It has been moved to the General Pool where any active agent can claim it. Your payout is still protected.</p>'
}
