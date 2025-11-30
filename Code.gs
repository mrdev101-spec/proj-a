
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

    // POST Request: Handle Actions
    const payload = JSON.parse(e.postData.contents);
    
    // --- GET USERS ACTION ---
    if (payload.action === 'getUsers') {
      const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
      if (!usersSheet) {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Users sheet not found' }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const usersData = usersSheet.getDataRange().getValues();
      const headers = usersData[0].map(h => String(h).toLowerCase().trim());
      const users = usersData.slice(1);

      const colMap = {
        username: headers.indexOf('username'),
        password: headers.indexOf('password'),
        name: headers.findIndex(h => h.includes('name') && !h.includes('username')),
        empId: headers.findIndex(h => h.includes('employee') || h.includes('emp id')),
        dept: headers.findIndex(h => h.includes('department') || h.includes('dept')),
        role: headers.indexOf('role'),
        status: headers.indexOf('status')
      };

      const result = users.map((u, index) => ({
        id: index + 1, // Use row index as ID for now
        username: colMap.username !== -1 ? u[colMap.username] : '',
        password: colMap.password !== -1 ? u[colMap.password] : '',
        name: colMap.name !== -1 ? u[colMap.name] : '',
        empId: colMap.empId !== -1 ? u[colMap.empId] : '',
        dept: colMap.dept !== -1 ? u[colMap.dept] : '',
        role: colMap.role !== -1 ? u[colMap.role] : 'User',
        status: colMap.status !== -1 ? u[colMap.status] : 'Active'
      }));

      return ContentService.createTextOutput(JSON.stringify({ status: 'success', users: result }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // --- LOGIN ACTION ---
    if (payload.action === 'login') {
      const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
      if (!usersSheet) {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Users sheet not found' }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const usersData = usersSheet.getDataRange().getValues();
      // Get headers and normalize them for search
      const headers = usersData[0].map(h => String(h).toLowerCase().trim());
      const users = usersData.slice(1);
      
      // Dynamic Column Mapping: Find indices based on header names
      const colMap = {
        username: headers.indexOf('username'),
        password: headers.indexOf('password'),
        // Use findIndex for fuzzy matching on display names
        name: headers.findIndex(h => h.includes('name') && !h.includes('username')), 
        empId: headers.findIndex(h => h.includes('employee') || h.includes('emp id')),
        dept: headers.findIndex(h => h.includes('department') || h.includes('dept')),
        role: headers.indexOf('role'),
        status: headers.indexOf('status')
      };

      // Critical check: Ensure we found at least Username and Password columns
      if (colMap.username === -1 || colMap.password === -1) {
         return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Critical columns (Username/Password) not found in sheet.' }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const username = payload.username;
      const password = payload.password;

      // Find user matching username and password
      const user = users.find(u => String(u[colMap.username]) === String(username) && String(u[colMap.password]) === String(password));

      if (user) {
        // Check Status: Default to 'active' if status column is missing, otherwise check value
        // Trim whitespace to avoid "Active " issues
        const status = colMap.status !== -1 ? String(user[colMap.status]).trim().toLowerCase() : 'active';
        
        if (status === 'active') {
          return ContentService.createTextOutput(JSON.stringify({ 
            status: 'success', 
            user: {
              username: user[colMap.username],
              name: colMap.name !== -1 ? user[colMap.name] : '',
              empId: colMap.empId !== -1 ? user[colMap.empId] : '',
              department: colMap.dept !== -1 ? user[colMap.dept] : '',
              role: colMap.role !== -1 ? user[colMap.role] : 'User'
            }
          })).setMimeType(ContentService.MimeType.JSON);

        } else {
          return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Account is Inactive' }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      } else {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid Username or Password' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    // --- HOSPITAL DATA ACTIONS (Add, Update, Delete) ---
    // Assumes Hospital data is in the FIRST sheet
    // 'sheet', 'data', and 'rows' are already defined at the top of the function

    if (payload.action === 'add') {
      const newData = payload.data;
      // Generate new ID (Column A)
      const lastRow = sheet.getLastRow();
      let nextId = 1;
      if (lastRow > 1) {
          const lastIdVal = sheet.getRange(lastRow, 1).getValue();
          if (!isNaN(lastIdVal)) nextId = Number(lastIdVal) + 1;
      }
      
      sheet.appendRow([
        nextId,
        newData.name,
        newData.hcode,
        newData.district,
        newData.pcId,
        newData.anydesk
      ]);
      
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Added successfully' }))
          .setMimeType(ContentService.MimeType.JSON);
    }

    if (payload.action === 'update') {
      const hcodeToUpdate = payload.hcode;
      const newData = payload.data;
      
      let rowIndex = -1;
      for (let i = 0; i < rows.length; i++) {
        if (String(rows[i][2]) === String(hcodeToUpdate)) {
          rowIndex = i + 2; 
          break;
        }
      }

      if (rowIndex !== -1) {
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

    if (payload.action === 'delete') {
      const hcodeToDelete = payload.hcode;
      
      let rowIndex = -1;
      for (let i = 0; i < rows.length; i++) {
        if (String(rows[i][2]) === String(hcodeToDelete)) {
          rowIndex = i + 2;
          break;
        }
      }

      if (rowIndex !== -1) {
        sheet.deleteRow(rowIndex);
        return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Deleted successfully' }))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'HCode not found' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    // --- ADD USER ACTION ---
    if (payload.action === 'addUser') {
      const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
      if (!usersSheet) {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Users sheet not found' }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const newUser = payload.user;
      
      // Basic validation
      if (!newUser.username || !newUser.password) {
         return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Username and Password are required' }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      // Check for duplicate username
      const usersData = usersSheet.getDataRange().getValues();
      const headers = usersData[0].map(h => String(h).toLowerCase().trim());
      const usernameIdx = headers.indexOf('username');
      
      if (usernameIdx !== -1) {
        const existingUser = usersData.slice(1).find(row => String(row[usernameIdx]) === String(newUser.username));
        if (existingUser) {
          return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Username already exists' }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }

      // Append new row
      // We need to map the incoming data to the correct columns based on headers
      // Default order if headers not found: Username, Password, Name, EmpID, Dept, Role, Status
      const newRow = [];
      const colMap = {
        username: headers.indexOf('username'),
        password: headers.indexOf('password'),
        name: headers.findIndex(h => h.includes('name') && !h.includes('username')),
        empId: headers.findIndex(h => h.includes('employee') || h.includes('emp id')),
        dept: headers.findIndex(h => h.includes('department') || h.includes('dept')),
        role: headers.indexOf('role'),
        status: headers.indexOf('status')
      };

      // Determine max column index to ensure row is long enough
      const maxCol = Math.max(...Object.values(colMap));
      
      for (let i = 0; i <= maxCol; i++) {
        newRow.push(''); // Initialize with empty strings
      }

      if (colMap.username !== -1) newRow[colMap.username] = newUser.username;
      if (colMap.password !== -1) newRow[colMap.password] = newUser.password;
      if (colMap.name !== -1) newRow[colMap.name] = newUser.name;
      if (colMap.empId !== -1) newRow[colMap.empId] = newUser.empId;
      if (colMap.dept !== -1) newRow[colMap.dept] = newUser.dept;
      if (colMap.role !== -1) newRow[colMap.role] = newUser.role;
      if (colMap.status !== -1) newRow[colMap.status] = newUser.status;

      usersSheet.appendRow(newRow);

      return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'User added successfully' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // --- UPDATE USER ACTION ---
    if (payload.action === 'updateUser') {
      const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
      if (!usersSheet) {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Users sheet not found' }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const updatedUser = payload.user;
      // We use the ORIGINAL username to find the row, in case username is being changed (though usually ID is better, we'll stick to username/id logic)
      // Since we don't have a stable ID column in the sheet explicitly enforced, we'll rely on the 'id' passed from frontend which was the row index.
      // However, row index can change if rows are deleted. 
      // BETTER APPROACH: Use the 'id' passed from frontend which we set as (index + 1) in getUsers.
      // So row number = id + 1 (because of header row).
      
      const rowNum = parseInt(updatedUser.id) + 1; // 1-based index, +1 for header
      
      if (rowNum < 2 || rowNum > usersSheet.getLastRow()) {
         return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid User ID' }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const usersData = usersSheet.getDataRange().getValues();
      const headers = usersData[0].map(h => String(h).toLowerCase().trim());
      
      const colMap = {
        username: headers.indexOf('username'),
        password: headers.indexOf('password'),
        name: headers.findIndex(h => h.includes('name') && !h.includes('username')),
        empId: headers.findIndex(h => h.includes('employee') || h.includes('emp id')),
        dept: headers.findIndex(h => h.includes('department') || h.includes('dept')),
        role: headers.indexOf('role'),
        status: headers.indexOf('status')
      };

      // Update cells
      if (colMap.username !== -1) usersSheet.getRange(rowNum, colMap.username + 1).setValue(updatedUser.username);
      if (colMap.password !== -1) usersSheet.getRange(rowNum, colMap.password + 1).setValue(updatedUser.password);
      if (colMap.name !== -1) usersSheet.getRange(rowNum, colMap.name + 1).setValue(updatedUser.name);
      if (colMap.empId !== -1) usersSheet.getRange(rowNum, colMap.empId + 1).setValue(updatedUser.empId);
      if (colMap.dept !== -1) usersSheet.getRange(rowNum, colMap.dept + 1).setValue(updatedUser.dept);
      if (colMap.role !== -1) usersSheet.getRange(rowNum, colMap.role + 1).setValue(updatedUser.role);
      if (colMap.status !== -1) usersSheet.getRange(rowNum, colMap.status + 1).setValue(updatedUser.status);

      return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'User updated successfully' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // --- DELETE USER ACTION ---
    if (payload.action === 'deleteUser') {
      const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
      if (!usersSheet) {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Users sheet not found' }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const userId = payload.id;
      const rowNum = parseInt(userId) + 1; // 1-based index, +1 for header

      if (rowNum < 2 || rowNum > usersSheet.getLastRow()) {
         return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid User ID' }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      usersSheet.deleteRow(rowNum);

      return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'User deleted successfully' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid action' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
