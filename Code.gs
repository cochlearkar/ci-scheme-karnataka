// ══════════════════════════════════════════════════════════
// CI SCHEME KARNATAKA — Google Apps Script Backend
// Paste this into: Google Sheet → Extensions → Apps Script
// Owner: cochlearkar@gmail.com
// ══════════════════════════════════════════════════════════

const SHEET_NAME_HOSPITAL  = 'Hospital_Surgery';
const SHEET_NAME_REHAB     = 'Rehab_Sessions';
const SHEET_NAME_DISTRICT  = 'District_Followup';
const SHEET_NAME_STATE     = 'State_Outcomes';
const SHEET_NAME_MASTER    = 'Master_Register';
const SHEET_NAME_LOG       = 'Submission_Log';

const HOSPITAL_HEADERS = [
  'Entry ID','Timestamp','Card No.','Hospital','Surgery Year',
  'Manufacturer','Model','Side','Serial Number',
  'Surgery Date','Switch-on Date','Surgeon','Recommended Rehab Centre','Notes'
];

const REHAB_HEADERS = [
  'Entry ID','Timestamp','Card No.','Institute','Year',
  'Session Date','Session Number','Duration','Therapist',
  'Attendance','Remarks'
];

const DISTRICT_HEADERS = [
  'Entry ID','Timestamp','Card No.','District','Year',
  'Contact Date','Next Follow-up Date','Contact Method',
  'Reason for Gap','Action Taken','Officer Name'
];

const STATE_HEADERS = [
  'Entry ID','Timestamp','Card No.','District','Year',
  'Assessment Date',
  'Sound Awareness','Responds to Name','Localises Sound',
  'First Word','2-Word Phrases','School Integration',
  'Aided Threshold','Hearing Age (months)','Audiologist'
];

// ── ENTRY POINT ────────────────────────────────────────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const role = data.role;
    let result;

    if      (role === 'hospital')  result = saveHospital(data);
    else if (role === 'rehab')     result = saveRehab(data);
    else if (role === 'district')  result = saveDistrict(data);
    else if (role === 'state')     result = saveState(data);
    else throw new Error('Unknown role: ' + role);

    updateMaster(data);
    logSubmission(data);

    return ContentService.createTextOutput(JSON.stringify({ status: 'ok', entryId: data.entryId }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Allow GET for health check
function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok', app: 'CI Scheme Karnataka' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── SAVERS ─────────────────────────────────────────────────
function saveHospital(d) {
  const sheet = getOrCreateSheet(SHEET_NAME_HOSPITAL, HOSPITAL_HEADERS);
  sheet.appendRow([
    d.entryId, d.timestamp, d['f-card'], d['f-hospital'], d['f-year'],
    d['f-mfr'], d['f-model'], d['f-side'], d['f-serial'],
    d['f-surgdate'], d['f-switchon'], d['f-surgeon'], d['f-rehabcentre'], d['f-notes']
  ]);
}

function saveRehab(d) {
  const sheet = getOrCreateSheet(SHEET_NAME_REHAB, REHAB_HEADERS);
  sheet.appendRow([
    d.entryId, d.timestamp, d['f-card'], d['f-institute'], d['f-year'],
    d['f-sessdate'], '', d['f-duration'], d['f-therapist'],
    d['attendance-group'], d['f-remarks']
  ]);
}

function saveDistrict(d) {
  const sheet = getOrCreateSheet(SHEET_NAME_DISTRICT, DISTRICT_HEADERS);
  sheet.appendRow([
    d.entryId, d.timestamp, d['f-card'], d['f-district'], d['f-year'],
    d['f-contactdate'], d['f-nextdate'], d['contact-group'],
    d['f-reason'], d['f-action'], d['f-officer']
  ]);
}

function saveState(d) {
  const sheet = getOrCreateSheet(SHEET_NAME_STATE, STATE_HEADERS);
  sheet.appendRow([
    d.entryId, d.timestamp, d['f-card'], d['f-district'], d['f-year'],
    d['f-assessdate'],
    d['ms-0'], d['ms-1'], d['ms-2'], d['ms-3'], d['ms-4'], d['ms-5'],
    d['f-threshold'], d['f-hearingage'], d['f-audiologist']
  ]);
}

// ── MASTER REGISTER UPDATE ─────────────────────────────────
function updateMaster(d) {
  const sheet = getOrCreateSheet(SHEET_NAME_MASTER, [
    'Card No.','Last Updated','Last Role','Hospital','Rehab Institute',
    'District','Surgery Date','Last Session Date','Last Follow-up',
    'Status','Total Entries'
  ]);
  const card = d['f-card'];
  if (!card) return;

  const data = sheet.getDataRange().getValues();
  let rowIdx = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(card)) { rowIdx = i + 1; break; }
  }

  if (rowIdx === -1) {
    sheet.appendRow([card, d.timestamp, d.role, d['f-hospital']||'', d['f-institute']||'', d['f-district']||'', d['f-surgdate']||'', d['f-sessdate']||'', d['f-contactdate']||'', 'Active', 1]);
  } else {
    const existing = sheet.getRange(rowIdx, 1, 1, 11).getValues()[0];
    sheet.getRange(rowIdx, 2).setValue(d.timestamp);
    sheet.getRange(rowIdx, 3).setValue(d.role);
    if (d['f-hospital'])     sheet.getRange(rowIdx, 4).setValue(d['f-hospital']);
    if (d['f-institute'])    sheet.getRange(rowIdx, 5).setValue(d['f-institute']);
    if (d['f-district'])     sheet.getRange(rowIdx, 6).setValue(d['f-district']);
    if (d['f-surgdate'])     sheet.getRange(rowIdx, 7).setValue(d['f-surgdate']);
    if (d['f-sessdate'])     sheet.getRange(rowIdx, 8).setValue(d['f-sessdate']);
    if (d['f-contactdate'])  sheet.getRange(rowIdx, 9).setValue(d['f-contactdate']);
    sheet.getRange(rowIdx, 11).setValue((existing[10] || 0) + 1);
  }
}

// ── LOG ────────────────────────────────────────────────────
function logSubmission(d) {
  const sheet = getOrCreateSheet(SHEET_NAME_LOG, ['Entry ID','Timestamp','Role','Card No.','Status']);
  sheet.appendRow([d.entryId, d.timestamp, d.role, d['f-card']||'', 'Received']);
}

// ── ALERT: weekly email for at-risk babies ─────────────────
function sendWeeklyAlert() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const rehab = ss.getSheetByName(SHEET_NAME_REHAB);
  if (!rehab) return;

  const rows = rehab.getDataRange().getValues();
  const lastSeen = {};
  for (let i = 1; i < rows.length; i++) {
    const card = rows[i][2];
    const date = rows[i][5];
    if (card && date) {
      if (!lastSeen[card] || new Date(date) > new Date(lastSeen[card])) {
        lastSeen[card] = date;
      }
    }
  }

  const today = new Date();
  const alerts = [];
  Object.entries(lastSeen).forEach(([card, lastDate]) => {
    const daysSince = Math.floor((today - new Date(lastDate)) / (1000 * 60 * 60 * 24));
    if (daysSince >= 30) alerts.push({ card, daysSince });
  });

  if (alerts.length === 0) return;

  const body = `CI Scheme Karnataka — Weekly Alert\n\nThe following beneficiaries have not had a rehab session logged in 30+ days:\n\n` +
    alerts.map(a => `Card: ${a.card} — Last session: ${a.daysSince} days ago`).join('\n') +
    `\n\nPlease follow up with the respective district officer.\n\nThis is an automated alert from the CI Scheme data system.`;

  GmailApp.sendEmail('cochlearkar@gmail.com', `CI Scheme — ${alerts.length} at-risk babies need follow-up`, body);
}

// ── HELPER ─────────────────────────────────────────────────
function getOrCreateSheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#0a3d2e').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// ── TRIGGER SETUP — run once manually ──────────────────────
function setupWeeklyTrigger() {
  ScriptApp.newTrigger('sendWeeklyAlert')
    .timeBased()
    .everyWeeks(1)
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(8)
    .create();
}
