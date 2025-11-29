
// --------------------------------------------------------------------------------------------------------------------
// COPY THIS CODE INTO YOUR GOOGLE SHEET'S APPS SCRIPT EDITOR
// Extensions > Apps Script > Replace everything in Code.gs with this > Deploy > New Deployment > Web App
// Execute as: Me
// Who has access: Anyone
// --------------------------------------------------------------------------------------------------------------------

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  // CORS Headers to allow access from any domain
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request (Preflight)
  if (e.postData && e.postData.type === "application/json" && e.parameter.method === "OPTIONS") {
     return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0]; // Assumes data is in the first sheet
    const data = sheet.getDataRange().getValues();
    const headersRow = data[0];
    const rows = data.slice(1);

    // GET Request: Return all data
    if (!e.postData) {
      const result = rows.map(row => {
        let obj = {};
        headersRow.forEach((header, index) => {
          // Map header names to our app's keys if needed, or just use index
          // Our app expects: name, hcode, district, pcId, anydesk
          // CSV Columns: List, Hospital Name, HCode, District, PC-ID, Anydesk ID
          // Index:       0     1              2      3         4      5
          
          // We can just return the raw array or mapped object. Let's map it for safety.
          // Adjust indices based on your actual sheet structure!
          obj.name = row[1];
          obj.hcode = row[2];
          obj.district = row[3];
          obj.pcId = row[4];
          obj.anydesk = row[5];
        });
        return obj;
      });
      
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // POST Request: Update data
    const payload = JSON.parse(e.postData.contents);
    
    if (payload.action === 'update') {
      const hcodeToUpdate = payload.hcode;
      const newData = payload.data;
      
      // Find row by HCode (Column C, index 2)
      // Note: getRange is 1-indexed. Header is row 1. Data starts row 2.
      // We loop through data array (0-indexed) which matches sheet row i+2
      let rowIndex = -1;
      for (let i = 0; i < rows.length; i++) {
        // Convert to string for comparison
        if (String(rows[i][2]) === String(hcodeToUpdate)) {
          rowIndex = i + 2; // +1 for header, +1 for 0-index to 1-index
          break;
        }
      }

      if (rowIndex !== -1) {
        // Update specific columns
        // Columns: List(A), Name(B), HCode(C), District(D), PC-ID(E), Anydesk(F)
        // Indices: 1        2        3         4            5         6
        
        if (newData.name) sheet.getRange(rowIndex, 2).setValue(newData.name);
        if (newData.district) sheet.getRange(rowIndex, 4).setValue(newData.district);
        if (newData.pcId) sheet.getRange(rowIndex, 5).setValue(newData.pcId);
        if (newData.anydesk) sheet.getRange(rowIndex, 6).setValue(newData.anydesk);
        
        return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Updated successfully' }))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'HCode not found' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid action' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
