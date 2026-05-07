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
  return ContentService
    .createTextOutput(JSON.stringify({ status: 200, message: 'LifeSavers Elite API is live.' }))
    .setMimeType(ContentService.MimeType.JSON)
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents)
    var type = data.formType

    if (type === 'application')       return handleApplication(data)
    if (type === 'agent_enrollment')  return handleAgentEnrollment(data)
    if (type === 'referral_submit')   return handleReferralSubmit(data)
    if (type === 'lead_rating')       return handleLeadRating(data)
    if (type === 'lead_accept')       return handleLeadAccept(data)
    if (type === 'lead_decline')      return handleLeadDecline(data)
    if (type === 'claim_from_pool')   return handleClaimFromPool(data)

    return respond(400, 'Unknown form type: ' + type)
  } catch (err) {
    return respond(500, 'Server error: ' + err.message)
  }
}

// ──────────────────────────────────────────────
// LIFESAVER APPLICATION
// ──────────────────────────────────────────────
function handleApplication(d) {
  var ss   = SpreadsheetApp.openById(SPREADSHEET_ID)
  var sheet = ss.getSheetByName('LifeSaver_Applications')
  var ts   = new Date().toISOString()

  sheet.appendRow([
    ts, d.name, d.email, d.phone, d.facebook,
    d.positions, d.employment, d.insurance,
    d.referral, d.excites, d.resumeAttached
  ])

  // Admin notification
  sendEmail(ADMIN_EMAIL,
    'New LifeSavers Application - ' + d.name,
    adminAppEmailBody(d)
  )

  // Applicant confirmation
  var firstName = d.name.split(' ')[0]
  sendEmail(d.email,
    "You're One Step Closer, " + firstName + " - Here's What's Next",
    applicantConfirmationBody(firstName)
  )

  return respond(200, 'Application received')
}

// ──────────────────────────────────────────────
// AGENT/BROKER ENROLLMENT
// ──────────────────────────────────────────────
function handleAgentEnrollment(d) {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID)
  var sheet = ss.getSheetByName('Agent_Broker_Applications')
  var ts    = new Date().toISOString()

  sheet.appendRow([
    ts, d.name, d.agency, d.email, d.phone,
    d.license, d.states, d.years, d.lines,
    d.payoutStructure, d.hearAbout, d.paymentMethod
  ])

  sendEmail(ADMIN_EMAIL,
    'New Agent/Broker Application - ' + d.agency,
    agentAppEmailBody(d)
  )

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

  // LifeSaver confirmation
  sendEmail(d.lifesaverEmail || ADMIN_EMAIL,
    'Your referral for ' + d.leadName.split(' ')[0] + ' was submitted successfully',
    lifesaverSubmitBody(d, leadId, expiry)
  )

  // Agent/Broker alert -- look up assigned agent from Users sheet
  var agentEmail = getAgentEmailForLifeSaver(d.lifesaverId)
  if (agentEmail) {
    sendEmail(agentEmail,
      'New Referral from ' + d.lifesaverHandle + ' - Action Required Within 48 Hours',
      agentNewLeadBody(d, leadId, expiry)
    )
  }

  return respond(200, 'Referral submitted: ' + leadId)
}

// ──────────────────────────────────────────────
// LEAD RATING (Admin)
// ──────────────────────────────────────────────
function handleLeadRating(d) {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID)
  var sheet = ss.getSheetByName('Leads')
  var data  = sheet.getDataRange().getValues()
  var ts    = new Date().toISOString()

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === d.leadId) {
      sheet.getRange(i + 1, 18).setValue(d.stars)  // col 18 = star rating
      if (d.override) {
        sheet.getRange(i + 1, 19).setValue('OVERRIDE: ' + d.overrideReason + ' at ' + ts)
      }
      break
    }
  }

  return respond(200, 'Rating saved')
}

// ──────────────────────────────────────────────
// LEAD ACCEPT
// ──────────────────────────────────────────────
function handleLeadAccept(d) {
  var ss        = SpreadsheetApp.openById(SPREADSHEET_ID)
  var leadsSheet = ss.getSheetByName('Leads')
  var txSheet   = ss.getSheetByName('Transactions')
  var data      = leadsSheet.getDataRange().getValues()
  var ts        = new Date().toISOString()

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === d.leadId) {
      var row = data[i]
      leadsSheet.getRange(i + 1, 17).setValue('ACCEPTED')

      // Log LSE fee
      txSheet.appendRow([ts, d.leadId, d.agentId, 'LSE_FEE', PLATFORM_FEE, row[14], 'ACCEPTED'])
      // Log LifeSaver payout
      txSheet.appendRow([ts, d.leadId, d.agentId, 'LIFESAVER_PAYOUT', d.lifesaverPayout, row[14], 'ACCEPTED'])

      // Email LifeSaver
      sendEmail(d.lifesaverEmail || ADMIN_EMAIL,
        'Your referral for ' + row[2].split(' ')[0] + ' was accepted - here is what you earned',
        lifesaverAcceptBody(row, d)
      )
      break
    }
  }

  return respond(200, 'Lead accepted')
}

// ──────────────────────────────────────────────
// LEAD DECLINE
// ──────────────────────────────────────────────
function handleLeadDecline(d) {
  var ss        = SpreadsheetApp.openById(SPREADSHEET_ID)
  var leadsSheet = ss.getSheetByName('Leads')
  var data      = leadsSheet.getDataRange().getValues()

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === d.leadId) {
      var row = data[i]
      leadsSheet.getRange(i + 1, 17).setValue('POOL')
      leadsSheet.getRange(i + 1, 20).setValue('Declined by assigned Agent')

      sendEmail(d.lifesaverEmail || ADMIN_EMAIL,
        'Your referral for ' + row[2].split(' ')[0] + ' was declined - but it is not over yet',
        lifesaverDeclineBody(row)
      )
      break
    }
  }

  return respond(200, 'Lead declined - moved to pool')
}

// ──────────────────────────────────────────────
// CLAIM FROM POOL
// ──────────────────────────────────────────────
function handleClaimFromPool(d) {
  var ss        = SpreadsheetApp.openById(SPREADSHEET_ID)
  var leadsSheet = ss.getSheetByName('Leads')
  var txSheet   = ss.getSheetByName('Transactions')
  var data      = leadsSheet.getDataRange().getValues()
  var ts        = new Date().toISOString()

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === d.leadId) {
      leadsSheet.getRange(i + 1, 17).setValue('ACCEPTED')
      txSheet.appendRow([ts, d.leadId, d.agentId, 'LSE_FEE', PLATFORM_FEE, data[i][14], 'POOL_CLAIM'])
      txSheet.appendRow([ts, d.leadId, d.agentId, 'LIFESAVER_PAYOUT', d.lifesaverPayout, data[i][14], 'POOL_CLAIM'])
      break
    }
  }

  return respond(200, 'Lead claimed from pool')
}

// ──────────────────────────────────────────────
// AUTO-DECLINE TRIGGER (set as time-based trigger, every 1 hour)
// ──────────────────────────────────────────────
function autoDeclineExpiredLeads() {
  var ss        = SpreadsheetApp.openById(SPREADSHEET_ID)
  var leadsSheet = ss.getSheetByName('Leads')
  var data      = leadsSheet.getDataRange().getValues()
  var now       = new Date()

  for (var i = 1; i < data.length; i++) {
    var status  = data[i][16]
    var expiry  = new Date(data[i][18])
    var source  = data[i][19]

    if (status === 'PENDING' && now > expiry) {
      leadsSheet.getRange(i + 1, 17).setValue('POOL')
      leadsSheet.getRange(i + 1, 20).setValue('48hr window expired - auto-released')
    }
  }
}

// ──────────────────────────────────────────────
// BUDGET EXHAUSTED TRIGGER (called from frontend or Stripe webhook)
// ──────────────────────────────────────────────
function releaseBudgetHeldLeads(agentId) {
  var ss        = SpreadsheetApp.openById(SPREADSHEET_ID)
  var leadsSheet = ss.getSheetByName('Leads')
  var data      = leadsSheet.getDataRange().getValues()
  var now       = new Date()

  for (var i = 1; i < data.length; i++) {
    if (data[i][16] === 'BUDGET_HOLD' && data[i][15] === agentId) {
      var holdExpiry = new Date(new Date(data[i][18]).getTime() + 24 * 60 * 60 * 1000)
      if (now > holdExpiry) {
        leadsSheet.getRange(i + 1, 17).setValue('POOL')
        leadsSheet.getRange(i + 1, 20).setValue('Budget exhausted - released to pool')
      }
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
  MailApp.sendEmail({
    to: to,
    subject: subject,
    htmlBody: wrapEmail(htmlBody),
    replyTo: ADMIN_EMAIL
  })
}

function getAgentEmailForLifeSaver(lifesaverId) {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID)
  var sheet = ss.getSheetByName('Users')
  var data  = sheet.getDataRange().getValues()
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === lifesaverId && data[i][2] === 'lifesaver') {
      return data[i][6] // col 7 = assigned agent email
    }
  }
  return null
}

// ──────────────────────────────────────────────
// EMAIL WRAPPERS
// ──────────────────────────────────────────────
function wrapEmail(body) {
  return '<div style="background:#080d17;color:#ffffff;font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;border-radius:12px;overflow:hidden;">'
    + '<div style="background:#53080E;padding:24px 32px;">'
    + '<h1 style="margin:0;font-size:20px;color:#fff;">LifeSavers Elite</h1>'
    + '</div>'
    + '<div style="padding:32px;">'
    + body
    + '<hr style="border-color:#1a2035;margin:32px 0;">'
    + '<p style="color:#6b7280;font-size:12px;">' + SIGN_OFF + '</p>'
    + '<p style="color:#374151;font-size:11px;margin-top:16px;">This email was sent by LifeSavers Elite. '
    + 'Your information is handled in accordance with our privacy policy. '
    + '<a href="#" style="color:#53080E;">Unsubscribe</a></p>'
    + '</div></div>'
}

function adminAppEmailBody(d) {
  return '<h2 style="color:#53080E;">New LifeSaver Application</h2>'
    + '<p><strong>Name:</strong> ' + d.name + '</p>'
    + '<p><strong>Email:</strong> ' + d.email + '</p>'
    + '<p><strong>Phone:</strong> ' + d.phone + '</p>'
    + '<p><strong>Facebook:</strong> ' + d.facebook + '</p>'
    + '<p><strong>Positions:</strong> ' + d.positions + '</p>'
    + '<p><strong>Employment:</strong> ' + d.employment + '</p>'
    + '<p><strong>Insurance Knowledge:</strong> ' + d.insurance + '</p>'
    + '<p><strong>Referral Comfort:</strong> ' + d.referral + '</p>'
    + '<p><strong>What Excites Them:</strong> ' + d.excites + '</p>'
    + '<p><strong>Resume Attached:</strong> ' + d.resumeAttached + '</p>'
}

function applicantConfirmationBody(firstName) {
  return '<h2 style="color:#4ade80;">You are one step closer, ' + firstName + '.</h2>'
    + '<p>Thank you for applying to LifeSavers Elite. We have received your application and our team will review it promptly.</p>'
    + '<p>The best thing you can do right now is book your first interview. It moves your application to priority review.</p>'
    + '<div style="text-align:center;margin:32px 0;">'
    + '<a href="' + CAL_URL + '" style="background:#53080E;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;">Book Your First Interview</a>'
    + '</div>'
    + '<p>We look forward to speaking with you.</p>'
}

function agentAppEmailBody(d) {
  return '<h2 style="color:#53080E;">New Agent/Broker Application</h2>'
    + '<p><strong>Agency:</strong> ' + d.agency + '</p>'
    + '<p><strong>Contact:</strong> ' + d.name + ' - ' + d.email + ' - ' + d.phone + '</p>'
    + '<p><strong>License:</strong> ' + d.license + ' | States: ' + d.states + '</p>'
    + '<p><strong>Years in Practice:</strong> ' + d.years + '</p>'
    + '<p><strong>Lines of Business:</strong> ' + d.lines + '</p>'
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
    + '<p>If declined, your lead will enter the General Pool where other agents can claim it. Your payout is still protected.</p>'
    + '<div style="text-align:center;margin:32px 0;">'
    + '<a href="https://lifesaverselite.com/dashboard/lifesaver" style="background:#53080E;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;">View Dashboard</a>'
    + '</div>'
}

function agentNewLeadBody(d, leadId, expiry) {
  return '<h2 style="color:#53080E;">New Referral - Action Required Within 48 Hours</h2>'
    + '<p><strong>From:</strong> ' + d.lifesaverHandle + '</p>'
    + '<p><strong>Lead ID:</strong> ' + leadId + '</p>'
    + '<p><strong>Policy Interest:</strong> ' + d.policyInterest + '</p>'
    + '<p><strong>Age:</strong> ' + d.age + ' | <strong>Health Rating:</strong> ' + d.healthRating + '/10 | <strong>Smoking:</strong> ' + d.smoking + '</p>'
    + '<p><strong>Beneficiaries:</strong> ' + (d.beneficiaries || 0) + ' | <strong>Timeline:</strong> ' + d.timeline + '</p>'
    + (d.notes ? '<p><strong>LifeSaver Notes:</strong> ' + d.notes + '</p>' : '')
    + '<p style="color:#f59e0b;"><strong>Expiry:</strong> ' + new Date(expiry).toLocaleString() + '</p>'
    + '<p>If accepted: <strong>$' + PLATFORM_FEE.toFixed(2) + '</strong> LSE fee + LifeSaver payout will be logged.</p>'
    + '<p>If no action taken within 48 hours, this lead will be released to the General Pool.</p>'
    + '<div style="text-align:center;margin:32px 0;">'
    + '<a href="https://lifesaverselite.com/dashboard/agent" style="background:#53080E;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;">Review Lead</a>'
    + '</div>'
}

function lifesaverAcceptBody(row, d) {
  return '<h2 style="color:#4ade80;">Your referral was accepted.</h2>'
    + '<p>Great news! Your referral for <strong>' + row[2] + '</strong> was accepted.</p>'
    + '<p><strong>Star Rating:</strong> ' + d.stars + ' out of 5</p>'
    + '<p><strong>You Earned:</strong> $' + d.lifesaverPayout.toFixed(2) + '</p>'
    + '<p><strong>STARS Earned:</strong> ' + d.stars + ' STARS (new balance: ' + d.newStarsBalance + ')</p>'
    + (d.milestoneTriggered ? '<p style="color:#4ade80;"><strong>Milestone bonus unlocked!</strong> Check your Earnings tab to claim.</p>' : '')
    + '<p><strong>Payout Date:</strong> Next Sunday</p>'
    + '<div style="text-align:center;margin:32px 0;">'
    + '<a href="https://lifesaverselite.com/dashboard/lifesaver" style="background:#53080E;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;">View Earnings</a>'
    + '</div>'
}

function lifesaverDeclineBody(row) {
  var poolExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000).toLocaleString()
  return '<h2 style="color:#f59e0b;">Your referral was declined - but it is not over yet.</h2>'
    + '<p>Your referral for <strong>' + row[2] + '</strong> was not accepted by your assigned agent.</p>'
    + '<p>Your lead has been moved to the <strong>General Pool</strong>, where any active agent in the network can claim it.</p>'
    + '<p>If another agent claims it, you will still receive your full payout. Your work is never wasted.</p>'
    + '<p><strong>Pool expiry:</strong> ' + poolExpiry + '</p>'
    + '<div style="text-align:center;margin:32px 0;">'
    + '<a href="https://lifesaverselite.com/dashboard/lifesaver" style="background:#53080E;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;">View Dashboard</a>'
    + '</div>'
}
