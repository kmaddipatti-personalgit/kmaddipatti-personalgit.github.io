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

## Step 2: Add the Google Apps Script
1. In your new Sheet, go to **Extensions** > **Apps Script**.
2. Delete any code in the `Code.gs` file and paste the following:

```javascript
const SHEET_NAME = "Sheet1"; // Make sure this matches your tab name

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = doc.getSheetByName(SHEET_NAME);

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const nextRow = sheet.getLastRow() + 1;

    // Parse data sent from the app
    // We expect JSON data in the body
    const data = JSON.parse(e.postData.contents);

    const newRow = [
      new Date(),           // Date
      data.playerName,      // Name
      data.selectedTeam,    // Team
      data.seahawksScore,   // S Score
      data.patriotsScore    // P Score
    ];

    sheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow]);

    return ContentService
      .createTextOutput(JSON.stringify({ "result": "success", "row": nextRow }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    return ContentService
      .createTextOutput(JSON.stringify({ "result": "error", "error": e }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
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
