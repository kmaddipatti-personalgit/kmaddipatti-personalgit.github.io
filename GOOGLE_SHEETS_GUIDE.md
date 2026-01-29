# How to Connect Your Invite to Google Sheets

To save responses (Name, Team Pick, Scores) to a Google Spreadsheet, follow these steps:

## Step 1: Create the Google Sheet
1. Go to [Google Sheets](https://sheets.google.com) and create a new blank spreadsheet.
2. Name it something like **"Super Bowl Invite Responses"**.
3. In the first row (Header), add these columns:
   - **Column A**: Date
   - **Column B**: Player Name
   - **Column C**: Selected Team
   - **Column D**: Seahawks Score
   - **Column E**: Patriots Score
   - **Column F**: Session ID (Don't touch this!)
   - **Column G**: RSVP (Yes/No)

## Step 2: Add the Google Apps Script
1. In your new Sheet, go to **Extensions** > **Apps Script**.
2. Delete any code in the `Code.gs` file and paste the following:

```javascript
const SHEET_NAME = "Sheet1";

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = doc.getSheetByName(SHEET_NAME);

    // Parse data
    const data = JSON.parse(e.postData.contents);
    
    // We expect headers: Date, Name, Team, S-Score, P-Score, SessionID, RSVP
    const headers = sheet.getRange(1, 1, 1, 7).getValues()[0];
    
    // Check if we are updating an existing session (RSVP)
    if (data.action === "update_rsvp" && data.sessionId) {
       // Search for the row with this SessionID (Column 6 aka F)
       const lastRow = sheet.getLastRow();
       if (lastRow > 1) {
         // Get all SessionIDs from Column F (index 6)
         // Note: getRange(row, col, numRows, numCols)
         const sessionIds = sheet.getRange(2, 6, lastRow - 1, 1).getValues().flat();
         
         // Find index (add 2 to adjust for 0-index and header row)
         const rowIndex = sessionIds.indexOf(data.sessionId);
         
         if (rowIndex !== -1) {
            // Update RSVP column (Column 7 aka G)
            sheet.getRange(rowIndex + 2, 7).setValue(data.rsvp);
            return jsonResponse({ "result": "updated", "row": rowIndex + 2 });
         }
       }
       // If not found, fall through (or error? better to just log it)
    }

    // Default: Append new row (Invite Score Submission)
    const newRow = [
      new Date(),           // A: Date
      data.playerName,      // B: Name
      data.selectedTeam,    // C: Team
      data.seahawksScore,   // D: S Score
      data.patriotsScore,   // E: P Score
      data.sessionId,       // F: Session ID (Hidden helper)
      data.rsvp || ""       // G: RSVP
    ];

    const nextRow = sheet.getLastRow() + 1;
    sheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow]);

    return jsonResponse({ "result": "success", "row": nextRow });

  } catch (e) {
    return jsonResponse({ "result": "error", "error": e.toString() });
  } finally {
    lock.releaseLock();
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. Click the **Save** icon (disk).

## Step 3: Deploy the Web App
1. Click the blue **Deploy** button > **New deployment**.
2. Click the **Select type** (gear icon) > **Web app**.
3. Fill in the details:
   - **Description**: "Super Bowl Invite Backend"
   - **Execute as**: **Me** (your email)
   - **Who has access**: **Anyone** (This is crucial so your app can send data without login).
4. Click **Deploy**.
5. **Authorize** the script if asked (Click "Review permissions" -> Choose account -> Advanced -> Go to ... (unsafe) -> Allow).
6. **Copy the Web App URL** presented at the end. It starts with `https://script.google.com/macros/s/...`.

## Step 4: Update Your Code
1. Open `script.js` in this project.
2. Find the line at the top:
   ```javascript
   const GOOGLE_SCRIPT_URL = 'PASTE_YOUR_WEB_APP_URL_HERE';
   ```
3. Paste your copied URL inside the quotes.
4. Save the file.

Now, whenever a user completes the game and gets a touchdown, their prediction will be saved to your sheet!
