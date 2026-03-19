// ============================================================
// Claude IDE — Team Stats Backend (Google Apps Script)
//
// Setup:
// 1. Go to https://sheets.new to create a new Google Sheet
// 2. Name it "Claude IDE Team Stats"
// 3. In the sheet, add headers in row 1: id | timestamp | sessions | features | cost
// 4. Go to Extensions → Apps Script
// 5. Paste this entire file, replacing the default code
// 6. Click Deploy → New Deployment → Web App
//    - Execute as: Me
//    - Who has access: Anyone
// 7. Copy the deployment URL
// 8. In Claude IDE, go to the config and paste the URL
//    (or set it in ~/claude-ide/team-stats-config.json)
// ============================================================

const SHEET_NAME = 'Sheet1'

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents)
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME)

    // Find existing row for this user today, or add new
    const today = new Date().toISOString().split('T')[0]
    const rows = sheet.getDataRange().getValues()
    let found = false

    for (let i = 1; i < rows.length; i++) {
      const rowDate = rows[i][1] ? new Date(rows[i][1]).toISOString().split('T')[0] : ''
      if (rows[i][0] === data.id && rowDate === today) {
        // Update existing row
        sheet.getRange(i + 1, 3).setValue(data.sessions)
        sheet.getRange(i + 1, 4).setValue(data.features)
        sheet.getRange(i + 1, 5).setValue(data.cost || '')
        found = true
        break
      }
    }

    if (!found) {
      sheet.appendRow([
        data.id,
        new Date().toISOString(),
        data.sessions,
        data.features,
        data.cost || ''
      ])
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON)
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON)
  }
}

function doGet() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME)
    const rows = sheet.getDataRange().getValues()
    const today = new Date().toISOString().split('T')[0]

    // Collect today's stats
    const todayStats = []
    for (let i = 1; i < rows.length; i++) {
      const rowDate = rows[i][1] ? new Date(rows[i][1]).toISOString().split('T')[0] : ''
      if (rowDate === today) {
        todayStats.push({
          id: rows[i][0],
          sessions: Number(rows[i][2]) || 0,
          features: Number(rows[i][3]) || 0,
          cost: rows[i][4] ? String(rows[i][4]) : '0',
        })
      }
    }

    const teamSize = todayStats.length
    const avgSessions = teamSize > 0 ? todayStats.reduce((s, r) => s + r.sessions, 0) / teamSize : 0
    const avgFeatures = teamSize > 0 ? todayStats.reduce((s, r) => s + r.features, 0) / teamSize : 0
    const avgCost = teamSize > 0 ? todayStats.reduce((s, r) => s + parseFloat(r.cost || '0'), 0) / teamSize : 0

    const result = {
      teamSize,
      avgSessions: Math.round(avgSessions * 10) / 10,
      avgFeatures: Math.round(avgFeatures * 10) / 10,
      avgCost: Math.round(avgCost * 100) / 100,
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON)
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON)
  }
}
