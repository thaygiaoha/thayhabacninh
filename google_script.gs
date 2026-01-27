/**
 * CẤU HÌNH HỆ THỐNG
 */
const SPREADSHEET_ID = "16w4EzHhTyS1CnTfJOWE7QQNM0o2mMQIqePpPK8TEYrg";
const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

/*************************************************
 * HÀM TIỆN ÍCH: TẠO RESPONSE JSON
 *************************************************/
function createResponse(status, message, data) {
  const output = { status: status, message: message };
  if (data) output.data = data;
  return ContentService
    .createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

// Giữ lại resJSON để phục vụ các đoạn code cũ đang gọi tên này
function resJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/*************************************************
 * HÀM DỌN DỮ LIỆU QUIZ HÀNG TUẦN
 *************************************************/
function clearWeeklyQuizData() {
  const sheet = ss.getSheetByName("ketquaQuiZ");
  if (sheet && sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
    console.log("Dữ liệu ketquaQuiZ đã được dọn dẹp.");
  }
}

/*************************************************
 * HÀM XỬ LÝ GET REQUEST
 *************************************************/
function doGet(e) {
  const params = e.parameter;
  const type = params.type;
  const action = params.action;
   // lấy dạng câu hỏi
  if (action === 'getAppConfig') {
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    data: getAppConfig()
  })).setMimeType(ContentService.MimeType.JSON);
}
   
   // Trong hàm doGet(e) của Google Apps Script
if (action === "getRouting") {
  const sheet = ss.getSheetByName("idgv");
  const rows = sheet.getDataRange().getValues();
  const data = [];
  for (var i = 1; i < rows.length; i++) {
    data.push({
      idNumber: rows[i][0], // Cột A
      link: rows[i][2]      // Cột C
    });
  }
  return createResponse("success", "OK", data);
}

  // 1. ĐĂNG KÝ / ĐĂNG NHẬP
  var sheetAcc = ss.getSheetByName("account");
  if (action === "register") {
    var phone = params.phone;
    var pass = params.pass;
    var rows = sheetAcc.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][1].toString() === phone) return ContentService.createTextOutput("exists");
    }
    sheetAcc.appendRow([new Date(), "'" + phone, pass, "VIP0"]);
    return ContentService.createTextOutput("success");
  }

  if (action === "login") {
    var phone = params.phone;
    var pass = params.pass;
    var rows = sheetAcc.getDataRange().getValues();
    
    for (var i = 1; i < rows.length; i++) {
      // Kiểm tra số điện thoại (cột B) và mật khẩu (cột C)
      if (rows[i][1].toString() === phone && rows[i][2].toString() === pass) {
        
        return createResponse("success", "OK", { 
          phoneNumber: rows[i][1].toString(), 
          vip: rows[i][3] ? rows[i][3].toString() : "VIP0",
          name: rows[i][4] ? rows[i][4].toString() : "" // Lấy thêm cột E (tên người dùng)
        });
      }
    }
    return ContentService.createTextOutput("fail");
  }

  // 2. LẤY DANH SÁCH ỨNG DỤNG
  if (params.sheet === "ungdung") {
    var sheet = ss.getSheetByName("ungdung");
    var rows = sheet.getDataRange().getValues();
    var data = [];
    for (var i = 1; i < rows.length; i++) {
      data.push({ name: rows[i][0], icon: rows[i][1], link: rows[i][2] });
    }
    return resJSON(data);
  }

  // 3. TOP 10
  if (type === 'top10') {
    const sheet = ss.getSheetByName("Top10Display");
    if (!sheet) return createResponse("error", "Không tìm thấy sheet Top10Display");
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return createResponse("success", "Chưa có dữ liệu Top 10", []);
    const values = sheet.getRange(2, 1, Math.min(10, lastRow - 1), 10).getValues();
    const top10 = values.map((row, index) => ({
      rank: index + 1, name: row[0], phoneNumber: row[1], score: row[2],
      time: row[3], sotk: row[4], bank: row[5], idPhone: row[9]
    }));
    return createResponse("success", "OK", top10);
  }

  // 4. THỐNG KÊ ĐÁNH GIÁ
  if (type === 'getStats') {
    const stats = { ratings: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
    const sheetRate = ss.getSheetByName("danhgia");
    if (sheetRate) {
      const rateData = sheetRate.getDataRange().getValues();
      for (let i = 1; i < rateData.length; i++) {
        const star = parseInt(rateData[i][1]);
        if (star >= 1 && star <= 5) stats.ratings[star]++;
      }
    }
    return createResponse("success", "OK", stats);
  }

  // 5. LẤY MẬT KHẨU (Ô H2)
  if (type === 'getPass') {
    const sheetList = ss.getSheetByName("danhsach");
    const password = sheetList.getRange("H2").getValue();
    return resJSON({ password: password.toString() });
  }

  // 6. XÁC MINH THÍ SINH
  if (type === 'verifyStudent') {
    const idNumber = params.idnumber;
    const sbd = params.sbd;
    const sheet = ss.getSheetByName("danhsach");
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][5].toString().trim() === idNumber.trim() && data[i][0].toString().trim() === sbd.trim()) {
        return createResponse("success", "OK", {
          name: data[i][1], class: data[i][2], limit: data[i][3],
          limittab: data[i][4], taikhoanapp: data[i][6], idnumber: idNumber, sbd: sbd
        });
      }
    }
    return createResponse("error", "Thí sinh không tồn tại!");
  }

  // 7. LẤY CÂU HỎI THEO ID
  if (action === 'getQuestionById') {
    var id = params.id;
    var sheetNH = ss.getSheetByName("nganhang");
    var dataNH = sheetNH.getDataRange().getValues();
    for (var i = 1; i < dataNH.length; i++) {
      if (dataNH[i][0].toString() === id.toString()) {
        return createResponse("success", "OK", {
          idquestion: dataNH[i][0], 
          classTag: dataNH[i][1], 
          question: dataNH[i][2],
          datetime: dataNH[i][3], 
          loigiai: dataNH[i][4]
        });
      }
    }
    return resJSON({ status: 'error' });
  }

  // 8. LẤY MA TRẬN ĐỀ
  if (type === 'getExamCodes') {
    const teacherId = params.idnumber;
    const sheet = ss.getSheetByName("matran");
    const data = sheet.getDataRange().getValues();
    const results = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0].toString().trim() === teacherId.trim() || row[0].toString() === "SYSTEM") {
        try {
          results.push({
            code: row[1].toString(), name: row[2].toString(), topics: JSON.parse(row[3]),
            fixedConfig: {
              duration: parseInt(row[4]), numMC: JSON.parse(row[5]), scoreMC: parseFloat(row[6]),
              mcL3: JSON.parse(row[7]), mcL4: JSON.parse(row[8]), numTF: JSON.parse(row[9]),
              scoreTF: parseFloat(row[10]), tfL3: JSON.parse(row[11]), tfL4: JSON.parse(row[12]),
              numSA: JSON.parse(row[13]), scoreSA: parseFloat(row[14]), saL3: JSON.parse(row[15]), saL4: JSON.parse(row[16])
            }
          });
        } catch (err) {}
      }
    }
    return createResponse("success", "OK", results);
  }

  // 9. LẤY TẤT CẢ CÂU HỎI (Hàm này thầy bị trùng, em gom lại bản chuẩn nhất)
  if (action === "getQuestions") {
    var sheet = ss.getSheetByName("nganhang");
    var rows = sheet.getDataRange().getValues();
    var questions = [];
    for (var i = 1; i < rows.length; i++) {
      var raw = rows[i][2];
      if (!raw) continue;
      try {
        var jsonText = raw.replace(/(\w+)\s*:/g, '"$1":').replace(/'/g, '"');
        var obj = JSON.parse(jsonText);
        if (!obj.classTag) obj.classTag = rows[i][1];
        questions.push(obj);
      } catch (e) {}
    }
    return createResponse("success", "OK", questions);
  }

  return createResponse("error", "Yêu cầu không hợp lệ");
}

/*************************************************
 * HÀM XỬ LÝ POST REQUEST
 *************************************************/
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(15000);
  try {
    var action = e.parameter.action;
    var data = JSON.parse(e.postData.contents);

    // 1. LƯU MA TRẬN ĐỀ
    /**
 * HÀM XỬ LÝ LƯU MA TRẬN ĐỀ THI
 * Đảm bảo: Cột số ra số, cột mảng ra mảng JSON [...]
 */
if (action === "saveMatrix") {
  const sheet = ss.getSheetByName("matran") || ss.insertSheet("matran");
  
  const toStr = (v) => (v != null) ? String(v).trim() : "";
  const toNum = (v) => {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  };

  // HÀM QUAN TRỌNG: Ép buộc phải có cấu trúc [ ... ]
  const toJson = (v) => {
    if (!v || v === "" || (Array.isArray(v) && v.length === 0)) return "[]";
    
    // Nếu đã là object (mảng) thì stringify ra chuỗi có []
    if (typeof v === 'object') return JSON.stringify(v);
    
    // Nếu là chuỗi, kiểm tra xem có dấu [ chưa, nếu chưa có thì bọc vào
    let s = String(v).trim();
    if (!s.startsWith("[")) {
      return "[" + s + "]"; 
    }
    return s;
  };

  const rowData = [
    toStr(data.gvId),              // A
    toStr(data.makiemtra),         // B
    toStr(data.name),              // C
    toJson(data.topics),           // D: Ép có []
    toNum(data.duration),          // E: Số thuần
    toJson(data.numMC),            // F: Ép có []
    toNum(data.scoreMC),           // G: Số thuần
    toJson(data.mcL3),             // H
    toJson(data.mcL4),             // I
    toJson(data.numTF),            // J
    toNum(data.scoreTF),           // K
    toJson(data.tfL3),             // L
    toJson(data.tfL4),             // M
    toJson(data.numSA),            // N
    toNum(data.scoreSA),           // O
    toJson(data.saL3),             // P
    toJson(data.saL4)              // Q
  ];

  // ... (Phần logic tìm hàng rowIndex và setValues giữ nguyên như cũ)
  const vals = sheet.getDataRange().getValues();
  let rowIndex = -1;
  for (let i = 1; i < vals.length; i++) {
    if (vals[i][0].toString() === toStr(data.gvId) && vals[i][1].toString() === toStr(data.makiemtra)) {
      rowIndex = i + 1; break;
    }
  }
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  return resJSON({status: "success", message: `✅ Đã tạo ma trận cho mã kiểm tra(đề thi) ${data.makiemtra} thành công!` });
  }

    // 2. LƯU CÂU HỎI MỚI
    if (action === 'saveQuestions') {
      var sheet = ss.getSheetByName("nganhang") || ss.insertSheet("nganhang");
      if (sheet.getLastRow() === 0) sheet.appendRow(["id", "classTag", "question", "createdAt"]);
      var now = new Date();
      var yymmdd = now.getFullYear().toString().slice(-2) + ("0" + (now.getMonth() + 1)).slice(-2) + ("0" + now.getDate()).slice(-2);
      var tttStart = 1;
      if (sheet.getLastRow() > 1) {
        var lastId = sheet.getRange(sheet.getLastRow(), 1).getValue().toString();
        tttStart = parseInt(lastId.slice(-3), 10) + 1;
      }
      for (var i = 0; i < data.length; i++) {
        var item = data[i];
        var xy = item.classTag.toString().slice(0, 2);
        var newId = xy + yymmdd + (tttStart + i).toString().padStart(3, '0');
        var fixedQuestion = item.question.replace(/id\s*:\s*\d+/, "id: " + newId);
        sheet.appendRow([newId, item.classTag, fixedQuestion, new Date()]);
      }
      return ContentService.createTextOutput(JSON.stringify({
  status: "success",
  message: "Đã lưu " + questions.length + " câu hỏi thành công!" // Phải có trường message này
})).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. ĐÁNH GIÁ (RATING)
    if (data.type === 'rating') {
      let sheetRate = ss.getSheetByName("danhgia") || ss.insertSheet("danhgia");
      sheetRate.appendRow([new Date(), data.stars, data.name, data.class, data.idNumber, data.comment || "", data.taikhoanapp]);
      return createResponse("success", "OK");
    }

    // 4. LƯU KẾT QUẢ QUIZ
    if (data.type === 'quiz') {
      let sheetQuiz = ss.getSheetByName("ketquaQuiZ") || ss.insertSheet("ketquaQuiZ");
      sheetQuiz.appendRow([new Date(), data.examCode || "QUIZ", data.name || "N/A", data.className || data.class || "", data.school || "", data.phoneNumber || "", data.score || 0, data.totalTime || "00:00", data.stk || "", data.bank || ""]);
      return createResponse("success", "Đã lưu kết quả Quiz");
    }

    // 5. XÁC MINH GIÁO VIÊN
    if (action === "verifyGV") {
      var sheet = ss.getSheetByName("idgv");
      var rows = sheet.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][0].toString().trim() === data.idnumber.toString().trim() && rows[i][1].toString().trim() === data.password.toString().trim()) {
          return resJSON({ status: "success" });
        }
      }
      return resJSON({ status: "error", message: "ID hoặc Mật khẩu GV không đúng!" });
    }

    // 6. CẬP NHẬT CÂU HỎI
    if (action === 'updateQuestion') {
      var item = data.data;
      var sheetNH = ss.getSheetByName("nganhang");
      var allRows = sheetNH.getDataRange().getValues();
      var foundRow = -1;
      for (var i = 1; i < allRows.length; i++) {
        if (allRows[i][0].toString() === item.idquestion.toString()) { foundRow = i + 1; break; }
      }
      if (foundRow !== -1) {
        sheetNH.getRange(foundRow, 2).setValue(item.classTag);
        sheetNH.getRange(foundRow, 3).setValue(item.question);
        sheetNH.getRange(foundRow, 4).setValue(item.datetime);
        sheetNH.getRange(foundRow, 5).setValue(item.loigiai);
        return resJSON({ status: 'success' });
      }
      return resJSON({ status: 'error', message: 'Không tìm thấy hàng' });
    }

    // 7. XÁC MINH ADMIN
    if (action === "verifyAdmin") {
      var adminPass = ss.getSheetByName("danhsach").getRange("I2").getValue().toString().trim();
      if (data.password.toString().trim() === adminPass) return resJSON({ status: "success", message: "Chào Admin!" });
      return resJSON({ status: "error", message: "Sai mật khẩu!" });
    }

    // 8. LƯU TỪ WORD
    if (action === "uploadWord") {
      const sheetExams = ss.getSheetByName("Exams") || ss.insertSheet("Exams");
      const sheetBank = ss.getSheetByName("QuestionBank") || ss.insertSheet("QuestionBank");
      sheetExams.appendRow([data.config.title, data.idNumber, data.config.duration, data.config.minTime, data.config.tabLimit, JSON.stringify(data.config.points)]);
      data.questions.forEach(function (q) { sheetBank.appendRow([data.config.title, q.part, q.type, q.classTag, q.question, q.answer, q.image]); });
      return createResponse("success", "UPLOAD_DONE");
    }

    // 9. LƯU KẾT QUẢ THI TỔNG HỢP
    let sheetResult = ss.getSheetByName("ketqua") || ss.insertSheet("ketqua");
    if (sheetResult.getLastRow() === 0) sheetResult.appendRow(["Timestamp", "makiemtra", "sbd", "name", "class", "tongdiem", "fulltime", "details"]);
    sheetResult.appendRow([new Date(), data.examCode, data.sbd, data.name, data.className, data.score, data.totalTime, JSON.stringify(data.details)]);
    return createResponse("success", "OK");

  } catch (err) {
    return resJSON({ status: "error", message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

/*************************************************
 * CÁC HÀM PHỤ TRỢ (NẰM NGOÀI ĐỂ TRÁNH LỖI)
 *************************************************/
function getLinkFromRouting(idNumber) {
  const sheet = ss.getSheetByName("idgv");
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    // Cột A: idNumber, Cột C: linkscript
    if (data[i][0].toString().trim() === idNumber.toString().trim()) {
      return data[i][2].toString().trim();
    }
  }
  return null;
}

function getSpreadsheetByTarget(targetId) {
  const sheet = ss.getSheetByName("idgv");
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    // Cột A: idNumber (Có thể là mã GV hoặc mã Môn như TOAN, LY)
    if (rows[i][0].toString().trim() === targetId.toString().trim()) {
      let url = rows[i][2].toString().trim(); // Cột C: linkscript
      if (!url) break;
      
      try {
        return SpreadsheetApp.openByUrl(url);
      } catch (e) {
        throw new Error("Không thể mở Sheet của: " + targetId + ". Kiểm tra lại link hoặc quyền chia sẻ.");
      }
    }
  }
  // Nếu không tìm thấy trong sheet idgv, mặc định dùng chính file Admin này
  return ss;
}

function replaceIdInBlock(block, newId) {
  if (block.match(/id\s*:\s*\d+/)) return block.replace(/id\s*:\s*\d+/, "id: " + newId);
  return block.replace("{", "{\nid: " + newId + ",");
}


function getAppConfig() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetCD = ss.getSheetByName("dangcd");
  var dataCD = sheetCD.getDataRange().getValues();
  
  var topics = [];
  var classesMap = {}; // Dùng để lọc danh sách lớp không trùng lặp

  // Chạy từ dòng 2 (bỏ tiêu đề)
  for (var i = 1; i < dataCD.length; i++) {
    var lop = dataCD[i][0];   // Cột A: lop
    var idcd = dataCD[i][1];  // Cột B: idcd
    var namecd = dataCD[i][2]; // Cột C: namecd

    if (lop) {
      // 1. Đẩy vào danh sách chuyên đề
      topics.push({
        grade: lop,
        id: idcd,
        name: namecd
      });

      // 2. Thu thập danh sách lớp (để nạp vào CLASS_ID bên React)
      // Ví dụ: Trong sheet có lớp 10, 11, 12 thì CLASS_ID sẽ có các lớp tương ứng
      classesMap[lop] = true;
    }
  }

  return {
    topics: topics,
    classes: Object.keys(classesMap).sort(function(a, b){ return a - b; }) // Trả về [9, 10, 11, 12] chẳng hạn
  };
}

function parseQuestionFromCell(text, id) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const qLine = lines.find(l => l.startsWith('?'));
  const question = qLine ? qLine.slice(1).trim() : '';
  const options = lines.filter(l => /^[A-D]\./.test(l)).map(l => l.slice(2).trim());
  const ansLine = lines.find(l => l.startsWith('='));
  const ansIndex = ansLine ? ansLine.replace('=', '').trim().charCodeAt(0) - 65 : -1;
  return { id, type: 'mcq', question, o: options, a: options[ansIndex] || '' };
}
