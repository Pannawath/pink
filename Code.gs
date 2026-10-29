/**
 * =========================================================================
 * GOOGLE APPS SCRIPT BACKEND FOR AYUTTHAYA SARAKHAMPITTAYAKHOM
 * ระบบบันทึกและจัดการคำสั่งจองเสื้อกีฬาสีทีมสีชมพู 2026 เชื่อมต่อ Google Sheets
 * Spreadsheet URL: https://docs.google.com/spreadsheets/d/13qV2hAzFf5a9LpVUQPgcDcpWj7GypL5J8jMH8ttGqJ0/edit
 * =========================================================================
 */

var SPREADSHEET_ID = "13qV2hAzFf5a9LpVUQPgcDcpWj7GypL5J8jMH8ttGqJ0";
var SHEET_NAME = "จองเสื้อกีฬาสี สีชมพู 2026 - สารคามพิทยาคม";
var DRIVE_FOLDER_NAME = "Pink Slips 2026"; // โฟลเดอร์เก็บสลิปการโอนเงินทีมสีชมพู 2026

// Security helper: sanitize plain text against CSV / Spreadsheet Formula Injection (CWE-1236)
function sanitizeCellText(val) {
  if (val === null || val === undefined) return "";
  var str = val.toString().trim();
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  if (/^[=+\-@\t\r\n]/.test(str)) {
    return "'" + str;
  }
  return str;
}

// Security helper: strictly validate and build safe HYPERLINK & IMAGE formulas
function buildSafeSlipFormula(viewUrl, imageUrl) {
  var safeView = sanitizeHttpsUrl(viewUrl);
  var safeImage = sanitizeHttpsUrl(imageUrl);
  if (!safeView || !safeImage) {
    return "มีสลิปแนบแล้ว";
  }
  safeView = safeView.replace(/"/g, "%22");
  safeImage = safeImage.replace(/"/g, "%22");
  return '=HYPERLINK("' + safeView + '", IMAGE("' + safeImage + '", 1))';
}

// Security helper: ensure URL matches strict HTTPS scheme and safe character set
function sanitizeHttpsUrl(url) {
  if (!url || typeof url !== "string") return "";
  var trimmed = url.trim();
  if (/^https:\/\/[a-zA-Z0-9\-._~:/?#\[\]@!$&'()*+,;=%]+$/.test(trimmed)) {
    return trimmed;
  }
  return "";
}

// Security helper: email format validation
function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var sheet = getOrCreateSheet();
    var rawData = e.postData ? e.postData.contents : "{}";
    var data = {};
    
    try {
      data = JSON.parse(rawData);
    } catch (parseErr) {
      data = e.parameter || {};
    }

    var email = (data.email || "").toString().trim().toLowerCase();
    var studentNumber = (data.studentNumber || "").toString().trim();
    var name = (data.name || "").toString().trim().toUpperCase();
    var classroom = (data.classroom || "").toString().trim();
    var number = (data.number || "").toString().trim();
    var size = (data.size || "L").toString().trim().toUpperCase();
    var slipImage = data.slipImage || "";
    var slipUrl = data.slipUrl || ""; // URL ของรูปที่อัปโหลดไว้แล้ว
    var status = data.status || (data.slipImage || data.slipUrl ? "รอตรวจสอบสลิป" : "รอชำระเงิน");
    var timestamp = new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });

    if (!email || !isValidEmail(email)) {
      return createJsonResponse({
        status: "error",
        message: "Missing or invalid required field: email"
      });
    }

    // Sanitize user inputs against formula injection and bound lengths
    var safeStudentNumber = sanitizeCellText(studentNumber).substring(0, 15);
    var safeName = sanitizeCellText(name).substring(0, 30);
    var safeClassroom = sanitizeCellText(classroom).substring(0, 20);
    var safeNumber = sanitizeCellText(number).substring(0, 10);
    var safeSize = sanitizeCellText(size).substring(0, 10);
    var safeStatus = sanitizeCellText(status).substring(0, 30);

    var values = sheet.getDataRange().getValues();
    var headers = values[0];
    
    // ค้นหาตำแหน่งคอลัมน์จากชื่อหัวตารางแบบไดนามิก
    var colMap = {
      timestamp: 1,
      email: 2,
      classroom: 3,
      studentNumber: 4,
      name: 5,
      number: 6,
      size: 7,
      slip: 8,
      status: 9
    };

    for (var h = 0; h < headers.length; h++) {
      var head = headers[h].toString().trim().toLowerCase();
      if (head === "email" || head === "อีเมล") colMap.email = h + 1;
      if (head === "classroom" || head === "ห้อง" || head === "ห้องเรียน" || head === "ระดับชั้น") colMap.classroom = h + 1;
      if (head === "student number" || head === "เลขที่") colMap.studentNumber = h + 1;
      if (head === "screen name" || head === "ชื่อ" || head === "ชื่อสกรีน") colMap.name = h + 1;
      if (head === "screen number" || head === "เบอร์" || head === "เบอร์สกรีน") colMap.number = h + 1;
      if (head === "size" || head === "ไซส์") colMap.size = h + 1;
      if (head === "payment slip" || head === "สลิป") colMap.slip = h + 1;
      if (head === "status" || head === "สถานะ") colMap.status = h + 1;
    }

    // Auto-create missing headers if studentNumber column doesn't exist
    if (!colMap.studentNumber || colMap.studentNumber === 0) {
      var nextCol = sheet.getLastColumn() + 1;
      sheet.getRange(1, nextCol).setValue("Student Number");
      colMap.studentNumber = nextCol;
    }

    var foundRowIndex = -1;
    for (var i = 1; i < values.length; i++) {
      var rowEmail = (values[i][colMap.email - 1] || "").toString().trim().toLowerCase();
      if (rowEmail === email) {
        foundRowIndex = i + 1;
        break;
      }
    }

    if (foundRowIndex > 0) {
      // Check if order is already locked (prevent unauthorized overwrite of completed orders)
      var currentStatus = (values[foundRowIndex - 1][colMap.status - 1] || "").toString().trim();
      var lockedStatuses = ["ชำระเงินแล้ว", "จัดส่งแล้ว", "เสร็จสิ้น"];
      if (lockedStatuses.indexOf(currentStatus) >= 0) {
        return createJsonResponse({
          status: "error",
          message: "ไม่สามารถแก้ไขคำสั่งซื้อได้เนื่องจากอยู่ในสถานะ: " + currentStatus
        });
      }

      // UPDATE existing row with sanitized values
      sheet.getRange(foundRowIndex, colMap.timestamp).setValue(timestamp);
      if (colMap.classroom > 0) sheet.getRange(foundRowIndex, colMap.classroom).setValue(safeClassroom);
      if (safeStudentNumber && colMap.studentNumber > 0) sheet.getRange(foundRowIndex, colMap.studentNumber).setValue(safeStudentNumber);
      sheet.getRange(foundRowIndex, colMap.name).setValue(safeName);
      sheet.getRange(foundRowIndex, colMap.number).setValue(safeNumber);
      sheet.getRange(foundRowIndex, colMap.size).setValue(safeSize);
      
      var slipCell = sheet.getRange(foundRowIndex, colMap.slip);
      var currentSlipValue = slipCell.getValue();
      var currentSlipFormula = slipCell.getFormula();
      
      // Case 1: Base64 new image uploaded
      if (slipImage && slipImage.indexOf('data:image') === 0) {
        var imageUrl = saveSlipToDrive(slipImage, email);
        if (imageUrl) {
          var viewUrl = getSlipViewUrl(imageUrl);
          slipCell.setFormula(buildSafeSlipFormula(viewUrl, imageUrl));
          sheet.setRowHeight(foundRowIndex, 180);
        } else {
          slipCell.setValue("มีสลิป (บันทึกไม่สำเร็จ)");
        }
      } 
      // Case 2: Existing safe URL provided
      else if (slipUrl && slipUrl.length > 0 && slipUrl.indexOf('https://') === 0) {
        var viewUrl = getSlipViewUrl(slipUrl);
        slipCell.setFormula(buildSafeSlipFormula(viewUrl, slipUrl));
        sheet.setRowHeight(foundRowIndex, 180);
      }
      // Case 3: Empty and no previous formula
      else if ((!slipImage || slipImage === "") && (!slipUrl || slipUrl === "") && !currentSlipFormula && (!currentSlipValue || typeof currentSlipValue !== 'string' || currentSlipValue.indexOf('IMAGE') < 0)) {
        slipCell.setValue("ยังไม่แนบสลิป");
      }
      
      sheet.getRange(foundRowIndex, colMap.status).setValue(safeStatus);

      return createJsonResponse({
        status: "success",
        action: "updated",
        message: "อัปเดตคำสั่งจองเรียบร้อยแล้ว",
        row: foundRowIndex,
        data: {
          timestamp: timestamp,
          email: email,
          studentNumber: safeStudentNumber,
          name: safeName,
          classroom: safeClassroom,
          number: safeNumber,
          size: safeSize,
          slipUrl: slipUrl || (slipImage ? "uploaded" : ""),
          hasSlip: (slipImage || slipUrl) ? "มีสลิป" : "ยังไม่แนบ",
          status: safeStatus
        }
      });

    } else {
      // APPEND new row
      var slipStatus = "ยังไม่แนบสลิป";
      var slipFormula = "";
      var imageUrl = null;
      
      if (slipImage && slipImage.indexOf('data:image') === 0) {
        imageUrl = saveSlipToDrive(slipImage, email);
        if (imageUrl) {
          var viewUrl = getSlipViewUrl(imageUrl);
          slipFormula = buildSafeSlipFormula(viewUrl, imageUrl);
        } else {
          slipStatus = "มีสลิป (บันทึกไม่สำเร็จ)";
        }
      } else if (slipImage && slipImage.length > 10) {
        slipStatus = "มีสลิปแนบแล้ว";
      }
      
      var newRow = [];
      newRow[colMap.timestamp - 1] = timestamp;
      newRow[colMap.email - 1] = email;
      if (colMap.classroom > 0) newRow[colMap.classroom - 1] = safeClassroom;
      if (colMap.studentNumber > 0) newRow[colMap.studentNumber - 1] = safeStudentNumber;
      newRow[colMap.name - 1] = safeName;
      newRow[colMap.number - 1] = safeNumber;
      newRow[colMap.size - 1] = safeSize;
      newRow[colMap.slip - 1] = slipFormula || slipStatus;
      newRow[colMap.status - 1] = safeStatus;
      
      sheet.appendRow(newRow);
      
      if (slipFormula && slipFormula.indexOf('=HYPERLINK') === 0) {
        var lastRow = sheet.getLastRow();
        sheet.setRowHeight(lastRow, 180);
      }

      return createJsonResponse({
        status: "success",
        action: "created",
        message: "บันทึกการสั่งจองใหม่เรียบร้อยแล้ว",
        data: {
          timestamp: timestamp,
          email: email,
          classroom: safeClassroom,
          studentNumber: safeStudentNumber,
          name: safeName,
          number: safeNumber,
          size: safeSize,
          slipUrl: slipFormula ? imageUrl : "",
          hasSlip: slipFormula ? "มีสลิป" : "ยังไม่แนบ",
          status: safeStatus
        }
      });
    }

  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: error.toString()
    });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  try {
    var params = e.parameter || {};
    var action = params.action || "";
    var email = (params.email || "").toString().trim().toLowerCase();
    var fileId = params.fileId || "";

    // Serve image from Drive as base64
    if (action === "getImage" && fileId) {
      try {
        var file = DriveApp.getFileById(fileId);
        var blob = file.getBlob();
        var base64 = Utilities.base64Encode(blob.getBytes());
        var mimeType = blob.getContentType();
        
        return createJsonResponse({
          status: "success",
          image: "data:" + mimeType + ";base64," + base64
        });
      } catch (driveErr) {
        return createJsonResponse({
          status: "error",
          message: "Cannot access file: " + driveErr.toString()
        });
      }
    }

    if (action === "ping") {
      return createJsonResponse({
        status: "ok",
        message: "Ayutthaya Athletics Official Store GAS Backend is active!",
        spreadsheetId: SPREADSHEET_ID,
        timestamp: new Date().toISOString()
      });
    }

    var sheet = getOrCreateSheet();
    var values = sheet.getDataRange().getValues();
    var formulas = sheet.getDataRange().getFormulas();
    var headers = values[0];

    var colMap = {
      timestamp: 1,
      email: 2,
      fullName: 0,
      studentNumber: 0,
      name: 3,
      classroom: 4,
      number: 5,
      size: 6,
      slip: 7,
      status: 8
    };

    for (var h = 0; h < headers.length; h++) {
      var head = headers[h].toString().trim().toLowerCase();
      if (head === "email" || head === "อีเมล") colMap.email = h + 1;
      if (head === "full name" || head === "ชื่อจริง" || head === "ชื่อ-นามสกุล" || head === "ชื่อ-สกุล" || head === "ชื่อผู้สั่ง") colMap.fullName = h + 1;
      if (head === "student number" || head === "เลขที่") colMap.studentNumber = h + 1;
      if (head === "screen name" || head === "ชื่อ" || head === "ชื่อสกรีน") colMap.name = h + 1;
      if (head === "classroom" || head === "ห้อง" || head === "ห้องเรียน" || head === "ระดับชั้น") colMap.classroom = h + 1;
      if (head === "screen number" || head === "เบอร์" || head === "เบอร์สกรีน") colMap.number = h + 1;
      if (head === "size" || head === "ไซส์") colMap.size = h + 1;
      if (head === "payment slip" || head === "สลิป") colMap.slip = h + 1;
      if (head === "status" || head === "สถานะ") colMap.status = h + 1;
    }

    if (action === "search" && email) {
      for (var i = 1; i < values.length; i++) {
        var rowEmail = (values[i][colMap.email - 1] || "").toString().trim().toLowerCase();
        if (rowEmail === email) {
          var slipFormula = (formulas[i] && formulas[i][colMap.slip - 1]) ? formulas[i][colMap.slip - 1].toString() : "";
          var slipCellValue = values[i][colMap.slip - 1] || "";
          var slipUrl = "";
          
          if (slipFormula) {
            var urlMatch = slipFormula.match(/https:\/\/drive\.google\.com\/[^\",\s\)]+/);
            if (urlMatch && urlMatch[0]) {
              slipUrl = urlMatch[0];
            }
          }
          
          var hasSlipStatus = slipUrl ? "มีสลิป" : (
            (typeof slipCellValue === 'object' && slipCellValue !== null) ||
            slipCellValue.toString().indexOf('✅') >= 0 ||
            slipCellValue.toString().indexOf('มีสลิป') >= 0
              ? "มีสลิป"
              : "ยังไม่แนบสลิป"
          );
          
          return createJsonResponse({
            status: "success",
            found: true,
            data: {
              timestamp: values[i][colMap.timestamp - 1],
              email: values[i][colMap.email - 1],
              fullName: colMap.fullName > 0 ? (values[i][colMap.fullName - 1] || "") : "",
              studentNumber: colMap.studentNumber > 0 ? (values[i][colMap.studentNumber - 1] || "").toString() : "",
              name: values[i][colMap.name - 1],
              classroom: values[i][colMap.classroom - 1] || "",
              number: (values[i][colMap.number - 1] || "").toString(),
              size: values[i][colMap.size - 1] || "L",
              hasSlip: hasSlipStatus,
              slipUrl: slipUrl,
              status: values[i][colMap.status - 1] || ""
            }
          });
        }
      }

      return createJsonResponse({
        status: "success",
        found: false,
        message: "Email not found"
      });
    }

    if (action === "list") {
      // Protect sensitive student order listing with admin secret token
      var clientToken = (params.token || "").toString().trim();
      var configuredSecret = PropertiesService.getScriptProperties().getProperty("ADMIN_SECRET") || "PINK_ADMIN_KEY_2026";
      
      if (!clientToken || clientToken !== configuredSecret) {
        return createJsonResponse({
          status: "error",
          message: "Unauthorized: Admin authorization token required to access full database"
        });
      }

      var orders = [];
      for (var j = 1; j < values.length; j++) {
        var rowEmail = values[j][colMap.email - 1];
        if (rowEmail) {
          var itemFormula = (formulas[j] && formulas[j][colMap.slip - 1]) ? formulas[j][colMap.slip - 1].toString() : "";
          var itemSlipUrl = "";
          if (itemFormula) {
            var urlMatch = itemFormula.match(/https:\/\/drive\.google\.com\/[^\",\s\)]+/);
            if (urlMatch && urlMatch[0]) {
              itemSlipUrl = urlMatch[0];
            }
          }

          orders.push({
            timestamp: values[j][colMap.timestamp - 1],
            email: rowEmail,
            fullName: colMap.fullName > 0 ? (values[j][colMap.fullName - 1] || "") : "",
            studentNumber: colMap.studentNumber > 0 ? (values[j][colMap.studentNumber - 1] || "").toString() : "",
            name: values[j][colMap.name - 1],
            classroom: values[j][colMap.classroom - 1] || "",
            number: values[j][colMap.number - 1],
            size: values[j][colMap.size - 1] || "L",
            hasSlip: itemSlipUrl ? "มีสลิป" : (values[j][colMap.slip - 1] || ""),
            slipUrl: itemSlipUrl,
            status: values[j][colMap.status - 1] || ""
          });
        }
      }
      return createJsonResponse({
        status: "success",
        total: orders.length,
        orders: orders
      });
    }

    return createJsonResponse({
      status: "success",
      message: "Ayutthaya Official Store API Ready",
      spreadsheetId: SPREADSHEET_ID
    });

  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: error.toString()
    });
  }
}

function getOrCreateSheet() {
  var doc;
  try {
    if (SPREADSHEET_ID && SPREADSHEET_ID !== "YOUR_SPREADSHEET_ID") {
      doc = SpreadsheetApp.openById(SPREADSHEET_ID);
    } else {
      doc = SpreadsheetApp.getActiveSpreadsheet();
    }
  } catch (err) {
    doc = SpreadsheetApp.getActiveSpreadsheet();
  }
  
  var sheet = doc.getSheetByName(SHEET_NAME) || doc.getActiveSheet();
  
  if (sheet.getLastRow() === 0) {
    var headers = ["Timestamp", "Email", "Classroom", "Student Number", "Screen Name", "Screen Number", "Size", "Payment Slip", "Status"];
    sheet.appendRow(headers);
    
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#831843");
    headerRange.setFontColor("#ffffff");
    headerRange.setHorizontalAlignment("center");
    
    sheet.setColumnWidth(1, 170); // Timestamp
    sheet.setColumnWidth(2, 220); // Email
    sheet.setColumnWidth(3, 130); // Classroom
    sheet.setColumnWidth(4, 120); // Student Number
    sheet.setColumnWidth(5, 160); // Screen Name
    sheet.setColumnWidth(6, 120); // Screen Number
    sheet.setColumnWidth(7, 80);  // Size
    sheet.setColumnWidth(8, 150); // Slip Status
    sheet.setColumnWidth(9, 140); // Status
  } else {
    // ตรวจสอบว่ามีคอลัมน์ Classroom หรือยัง ถ้ายังไม่มีให้แทรกที่คอลัมน์ D
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var hasClassroom = false;
    for (var i = 0; i < headers.length; i++) {
      var h = headers[i].toString().trim().toLowerCase();
      if (h === "classroom" || h === "ห้อง" || h === "ห้องเรียน" || h === "ระดับชั้น") {
        hasClassroom = true;
        break;
      }
    }
    if (!hasClassroom) {
      sheet.insertColumnAfter(3);
      sheet.getRange(1, 4).setValue("Classroom").setFontWeight("bold").setBackground("#831843").setFontColor("#ffffff").setHorizontalAlignment("center");
      sheet.setColumnWidth(4, 130);
    }
  }
  
  // Setup Column Widths and Formatting
  var slipColIndex = 0;
  var statusColIndex = 0;
  var currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  for (var c = 0; c < currentHeaders.length; c++) {
    var ch = currentHeaders[c].toString().trim().toLowerCase();
    if (ch === "payment slip" || ch === "สลิป") {
      slipColIndex = c + 1;
    }
    if (ch === "status" || ch === "สถานะ") {
      statusColIndex = c + 1;
    }
  }

  // Ensure Slip Column is wide and clean
  if (slipColIndex > 0) {
    sheet.setColumnWidth(slipColIndex, 240);
    // Clear any accidental data validation on slip column
    var slipRange = sheet.getRange(2, slipColIndex, Math.max(1, sheet.getMaxRows() - 1), 1);
    slipRange.clearDataValidations();
  }

  if (statusColIndex > 0) {
    sheet.setColumnWidth(statusColIndex, 150);
    var statusColumn = sheet.getRange(2, statusColIndex, Math.max(1, sheet.getMaxRows() - 1), 1);
    var statusOptions = [
      "รอชำระเงิน",
      "รอตรวจสอบสลิป", 
      "ชำระเงินแล้ว",
      "จัดส่งแล้ว",
      "เสร็จสิ้น",
      "ยกเลิก"
    ];
    
    var rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(statusOptions, true)
      .setAllowInvalid(false)
      .build();
    
    statusColumn.setDataValidation(rule);
    applyStatusFormatting(sheet, statusColIndex);
  }
  
  return sheet;
}

function applyStatusFormatting(sheet, statusColIndex) {
  var statusStyles = [
    { text: "รอชำระเงิน", bg: "#FEF3C7", font: "#92400E" },
    { text: "รอตรวจสอบสลิป", bg: "#E0F2FE", font: "#0369A1" },
    { text: "ชำระเงินแล้ว", bg: "#DCFCE7", font: "#15803D" },
    { text: "จัดส่งแล้ว", bg: "#F3E8FF", font: "#7E22CE" },
    { text: "เสร็จสิ้น", bg: "#ECFDF5", font: "#047857" },
    { text: "ยกเลิก", bg: "#FEE2E2", font: "#B91C1C" }
  ];

  var existingRules = sheet.getConditionalFormatRules();
  var filteredRules = [];
  for (var i = 0; i < existingRules.length; i++) {
    var ranges = existingRules[i].getRanges();
    var isStatusColRule = false;
    for (var j = 0; j < ranges.length; j++) {
      if (ranges[j].getColumn() === statusColIndex && ranges[j].getNumColumns() === 1) {
        isStatusColRule = true;
        break;
      }
    }
    if (!isStatusColRule) {
      filteredRules.push(existingRules[i]);
    }
  }

  var targetRange = sheet.getRange(2, statusColIndex, Math.max(1, sheet.getMaxRows() - 1), 1);
  for (var k = 0; k < statusStyles.length; k++) {
    var style = statusStyles[k];
    var newRule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(style.text)
      .setBackground(style.bg)
      .setFontColor(style.font)
      .setBold(true)
      .setRanges([targetRange])
      .build();
    filteredRules.push(newRule);
  }

  sheet.setConditionalFormatRules(filteredRules);
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function saveSlipToDrive(base64Data, email) {
  try {
    var parts = base64Data.split(',');
    if (parts.length < 2) return null;
    var meta = parts[0].split(';')[0];
    var contentType = meta.replace('data:', '').trim().toLowerCase();
    
    // Strict MIME whitelist for uploaded slips
    var allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimes.indexOf(contentType) === -1) {
      Logger.log('Rejected upload with disallowed MIME: ' + contentType);
      return null;
    }

    var base64String = parts[1];
    var decoded = Utilities.base64Decode(base64String);
    var timestamp = new Date().getTime();
    var sanitizedEmail = email.replace(/[^a-zA-Z0-9]/g, '_');
    var extension = contentType === 'image/png' ? '.png' : (contentType === 'image/webp' ? '.webp' : '.jpg');
    var fileName = 'slip_' + sanitizedEmail + '_' + timestamp + extension;
    var blob = Utilities.newBlob(decoded, contentType, fileName);
    var folder = getOrCreateFolder();
    deleteOldSlips(email, folder);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return 'https://drive.google.com/uc?export=view&id=' + file.getId();
  } catch (error) {
    Logger.log('Error saving slip to Drive: ' + error.toString());
    return null;
  }
}

function getSlipViewUrl(rawUrl) {
  if (!rawUrl) return "";
  var idMatch = rawUrl.match(/[?&]id=([^&]+)/);
  if (idMatch && idMatch[1]) {
    return 'https://drive.google.com/file/d/' + idMatch[1] + '/view';
  }
  return rawUrl;
}

function deleteOldSlips(email, folder) {
  try {
    var searchPattern = 'slip_' + email.replace(/[^a-zA-Z0-9]/g, '_');
    var files = folder.getFiles();
    while (files.hasNext()) {
      var file = files.next();
      if (file.getName().indexOf(searchPattern) === 0) {
        file.setTrashed(true);
      }
    }
  } catch (error) {
    Logger.log('Error deleting old slips: ' + error.toString());
  }
}

function getOrCreateFolder() {
  var folders = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    var folder = DriveApp.createFolder(DRIVE_FOLDER_NAME);
    folder.setDescription('โฟลเดอร์เก็บสลิปการโอนเงินจากระบบจองเสื้อทีมสีชมพู 2026');
    return folder;
  }
}
