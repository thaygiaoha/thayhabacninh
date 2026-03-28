/**
 * CẤU HÌNH HỆ THỐNG
 */
const SPREADSHEET_ID = "16w4EzHhTyS1CnTfJOWE7QQNM0o2mMQIqePpPK8TEYrg";
const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

const ADMIN_RESET_PASSWORD = "H1111@";

/*************************************************
 * HÀM TIỆN ÍCH: TẠO RESPONSE JSON
 *************************************************/
 // Reset QuiZ
 function resetQuizData(password) {
  if (password !== ADMIN_RESET_PASSWORD) {
    return createResponse("error", "Sai mật khẩu!");
  }

  const sheet = ss.getSheetByName("ketquaQuiZ");

  if (!sheet) {
    return createResponse("error", "Không tìm thấy sheet ketquaQuiZ");
  }

  const lastRow = sheet.getLastRow();

  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }

  return createResponse("success", "Đã reset Quiz admin2");
}
function createResponseW(status, message, data = null) {
  const output = { status: status, message: message };
  if (data !== null) output.data = data;
  return ContentService
    .createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}
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
  // load ngân hàng đề
  if (action === 'loadQuestions') {

  var values = sheetNH.getDataRange().getValues();
  if (values.length <= 1) {
    return createResponse("success", "Không có dữ liệu", []);
  }

  var headers = values[0];
  var rows = values.slice(1);

  var result = rows.map(function(r) {

    var obj = {
      id: r[0],
      classTag: r[1],
      type: r[2],
      part: r[3],
      question: r[4]
    };

    if (r[2] === "mcq") {
      obj.o = r[5] ? JSON.parse(r[5]) : [];
      obj.a = r[6];
    }

    if (r[2] === "true-false") {
      obj.s = r[5] ? JSON.parse(r[5]) : [];
    }

    if (r[2] === "short-answer") {
      obj.a = r[6];
    }

    return obj;
  });

  return createResponse("success", "Load thành công", result);
}


  // Reset QuiZ
  if (action === "resetQuiz") {
  return resetQuizData(e.parameter.password);
}



  if (action === 'checkTeacher') {
    try {
      const idInput = (params.idgv || "").toString().trim();
      if (!idInput) return createResponse("error", "Chưa nhập ID giáo viên");

      const sheet = ss.getSheetByName("idgv");
      const data = sheet.getDataRange().getValues();

      for (let i = 1; i < data.length; i++) {
        // Ép cả 2 về String để so sánh cho chuẩn
        let idInSheet = data[i][0].toString().trim();
        
        if (idInSheet === idInput) {
          return createResponse("success", "OK", { 
            name: data[i][1], 
            link: data[i][2] 
          });
        }
      }
      return createResponse("error", "Không tìm thấy ID: " + idInput);
    } catch (err) {
      return createResponse("error", "Lỗi Script: " + err.toString());
    }
  }
  
  if (action === 'getLG') {
     const sheetNH = ss.getSheetByName("nganhang");
    var idTraCuu = params.id;
    if (!idTraCuu) return ContentService.createTextOutput("Thiếu ID rồi!").setMimeType(ContentService.MimeType.TEXT);

    var data = sheetNH.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString().trim() === idTraCuu.toString().trim()) {
        var loigiai = data[i][7] || ""; 
        
        // Ép kiểu về String để đảm bảo không bị lỗi tệp
        return ContentService.createTextOutput(String(loigiai))
                             .setMimeType(ContentService.MimeType.TEXT);
      }
    }
    return ContentService.createTextOutput("Không tìm thấy ID này!").setMimeType(ContentService.MimeType.TEXT);
  }
   if (action === 'updateLG') {
    const sheetNH = ss.getSheetByName("nganhang");
  var data = JSON.parse(e.postData.contents);
  var id = data.id;
  var lg = data.loigiai;

  var values = sheetNH.getDataRange().getValues();

  for (var i = 1; i < values.length; i++) {
    if (values[i][0] == id) {
      sheetNH.getRange(i + 1, 8).setValue(lg); // cột loigiai
      break;
    }
  }

  return createResponse("success", "Đã cập nhật lời giải!");
}



   // lấy dạng câu hỏi
  if (action === 'getAppConfig') {
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    data: getAppConfig()
  })).setMimeType(ContentService.MimeType.JSON);
}

// 4. KIỂM TRA GIÁO VIÊN (Dành cho Module Giáo viên tạo đề word)
    
   
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

  // 5. LẤY MẬT KHẨU QUIZ
  if (type === 'getPass') {    
    const password = ADMIN_RESET_PASSWORD;
    return resJSON({ password: password.toString() });
  }

  // 6. XÁC MINH THÍ SINH
  if (type === 'verifyStudent') {
    const idNumber = params.idnumber;
    const sbd = params.sbd;
    const sheet = ss.getSheetByName("danhsach");
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[1][5].toString().trim() === idNumber.trim() && data[i][0].toString().trim() === sbd.trim()) {
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
          type: dataNH[i][2],
          question: dataNH[i][4],
          options: dataNH[i][5],
          answer: dataNH[i][6],
          loigiai: dataNH[i][7],
          datetime: dataNH[i][8]
          
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
    if (!rows[i][0]) continue;

    var parsedOptions = null;
    try {
      parsedOptions = rows[i][5] ? JSON.parse(rows[i][5]) : null;
    } catch(e) {
      parsedOptions = null;
    }

    var qObj = {
      id: rows[i][0],
      classTag: rows[i][1] || "",
      type: rows[i][2] || "",
      part: rows[i][3] || "",
      question: rows[i][4] || "",
      a: rows[i][6] || "",
      loigiai: rows[i][7] || ""
    };

    if (qObj.type === "mcq") {
      qObj.o = parsedOptions;
    }

    if (qObj.type === "true-false") {
      qObj.s = parsedOptions;
    }

    if (qObj.type === "short-answer") {
      // không cần options
    }

    questions.push(qObj);
  }

  return createResponse("success", "OK", questions);
}

  return createResponse("error", "Có gì đó sai sai rồi bạn hiền! Liên hệ: 0988.948.882");
}

/*************************************************
 * HÀM XỬ LÝ POST REQUEST
 *************************************************/
    function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(15000);
  try {
    const data = JSON.parse(e.postData.contents);
    const idgv = (e.parameter.idgv || JSON.parse(e.postData.contents).idgv || "").toString().trim();
    const action = (e.parameter.action || data.action || "").toString();
    
    
   
   
    const sheetNH = ss.getSheetByName("nganhang");  
        // 1. NHÁNH LƯU CẤU HÌNH (Ổn định theo kiểu saveMatrix)
    if (action === 'saveExamConfig') {
      // BƯỚC 1: Xác định file đích (Master hay Hàng xóm)
      const targetSS = getSpreadsheetByTarget(idgv);
      const sheet = targetSS.getSheetByName("exams") || targetSS.insertSheet("exams");
      
      // Tạo tiêu đề nếu sheet mới
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["exams", "IdNumber", "MCQ", "scoremcq", "TF", "scoretf", "SA", "scoresa", "fulltime", "mintime", "tab", "dateclose"] );
      }

      // Chuẩn bị dữ liệu hàng (Row Data)
      const rowData = [
        data.exams, idgv, data.MCQ, data.scoremcq, data.TF, data.scoretf, data.SA, data.scoresa, data.fulltime, data.mintime, data.tab, data.dateclose 
      ];

      // BƯỚC 2: Kiểm tra xem mã đề đã tồn tại chưa để ghi đè (Giống logic Ma trận)
      const vals = sheet.getDataRange().getValues();
      let rowIndex = -1;
      for (let i = 1; i < vals.length; i++) {
        // Nếu trùng mã đề (cột A) và trùng ID GV (cột B)
        if (vals[i][0].toString() === data.exams.toString() && vals[i][1].toString() === idgv.toString()) {
          rowIndex = i + 1; 
          break;
        }
      }

      // BƯỚC 3: Ghi dữ liệu
      if (rowIndex > 0) {
        sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
      } else {
        sheet.appendRow(rowData);
      }

      return createResponse("success", "✅ Đã lưu cấu hình đề [" + data.exams + "] vào file: " + targetSS.getName());
    }
    // 5. UPLOAD DỮ LIỆU ĐỀ THI TỪ WORD (Teacher)
    if (action === 'uploadExamData') {
      const gvSS = getSpreadsheetByTarget(data.idgv);
      const sheet = gvSS.getSheetByName("exam_data") || gvSS.insertSheet("exam_data");
      const now = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yy");
      data.questions.forEach(q => {
        sheet.appendRow([
          data.examCode, q.classTag || "", q.type, 
          JSON.stringify(q), now, q.loigiai || ""
        ]);
      });
      return createResponse("success", "Đã tải lên " + data.questions.length + " câu!");
    }


    // 1. NHÁNH LỜI GIẢI (saveLG)
   if (action === 'saveLG') {
      var lastRow = sheetNH.getLastRow();
      if (lastRow < 2) return ContentService.createTextOutput("⚠️ Sheet rỗng, chưa có ID để khớp thầy ơi!").setMimeType(ContentService.MimeType.TEXT);

      // 1. Tìm ô trống đầu tiên ở cột E
      var eValues = sheetNH.getRange(1, 5, lastRow, 1).getValues();
      var firstEmptyRow = 0;
      for (var i = 1; i < eValues.length; i++) {
        if (!eValues[i][0] || eValues[i][0].toString().trim() === "") {
          firstEmptyRow = i + 1;
          break;
        }
      }
      if (firstEmptyRow === 0) firstEmptyRow = lastRow + 1;

      // 2. Điền LG và ép ID theo cột A
      var count = 0;
      data.forEach(function(item, index) {
        var targetRow = firstEmptyRow + index;
        
        // Lấy ID "xịn" đang nằm ở cột A của hàng này
        var realId = sheetNH.getRange(targetRow, 1).getValue().toString();
        
        if (realId) {
          var rawLG = item.loigiai || item.lg || "";
          
          // Dùng Regex để tìm "id: ..." hoặc "id:..." và thay bằng ID xịn từ cột A
          // Đoạn này xử lý cả trường hợp có ngoặc kép hoặc không
          var fixedLG = rawLG.replace(/id\s*:\s*["']?\w+["']?/g, 'id: "' + realId + '"');
          
          // Ghi vào cột E
          sheetNH.getRange(targetRow, 5).setValue(fixedLG);
          count++;
        }
      });

      return ContentService.createTextOutput("🚀 Đã xong! Điền tiếp " + count + " lời giải. ID trong LG đã được đồng bộ theo ID câu hỏi.").setMimeType(ContentService.MimeType.TEXT);
    }
    // 2. NHÁNH MA TRẬN (saveMatrix)
    if (action === "saveMatrix") {
      const sheetMatran = ss.getSheetByName("matran") || ss.insertSheet("matran");
      const toStr = (v) => (v != null) ? String(v).trim() : "";
      const toNum = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
      const toJson = (v) => {
        if (!v || v === "" || (Array.isArray(v) && v.length === 0)) return "[]";
        if (typeof v === 'object') return JSON.stringify(v);
        let s = String(v).trim();
        return s.startsWith("[") ? s : "[" + s + "]";
      };
      const rowData = [
        toStr(data.gvId), toStr(data.makiemtra), toStr(data.name), toJson(data.topics),
        toNum(data.duration), toJson(data.numMC), toNum(data.scoreMC), toJson(data.mcL3),
        toJson(data.mcL4), toJson(data.numTF), toNum(data.scoreTF), toJson(data.tfL3),
        toJson(data.tfL4), toJson(data.numSA), toNum(data.scoreSA), toJson(data.saL3), toJson(data.saL4)
      ];
      const vals = sheetMatran.getDataRange().getValues();
      let rowIndex = -1;
      for (let i = 1; i < vals.length; i++) {
        if (vals[i][0].toString() === toStr(data.gvId) && vals[i][1].toString() === toStr(data.makiemtra)) {
          rowIndex = i + 1; break;
        }
      }
      if (rowIndex > 0) { sheetMatran.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]); } 
      else { sheetMatran.appendRow(rowData); }
      return createResponse("success", "✅ Đã tạo ma trận " + data.makiemtra + " thành công!");
    }

    // 3. NHÁNH LƯU CÂU HỎI MỚI (saveQuestions)
    if (action === 'saveQuestions') {

  var now = new Date();  

  var startRow = sheetNH.getLastRow() + 1;

  var rows = data.map(function(item) {
    return [
      item.id,
      item.classTag,
      item.type,
      item.part,
      item.question,
      item.options || "",
      item.answer || "",
      item.loigiai || "",
      now
    ];
  });

  if (rows.length > 0) {
    sheetNH.getRange(startRow, 1, rows.length, rows[0].length)
      .setValues(rows);
  }

  return createResponse("success", "Đã lưu " + rows.length + " câu hỏi thành công!");
}

    // 4. XÁC MINH GIÁO VIÊN (verifyGV)
    if (action === "verifyGV") {
      var sheetGV = ss.getSheetByName("idgv");
      var rows = sheetGV.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][0].toString().trim() === data.idnumber.toString().trim() && rows[i][1].toString().trim() === data.password.toString().trim()) {
          return resJSON({ status: "success" });
        }
      }
      return resJSON({ status: "error", message: "ID hoặc Mật khẩu GV không đúng!" });
    }

    // 5. CẬP NHẬT CÂU HỎI (updateQuestion)
    if (action === 'updateQuestion') {
      var item = data.data;
      var allRows = sheetNH.getDataRange().getValues();
      for (var i = 1; i < allRows.length; i++) {
        if (allRows[i][0].toString() === item.idquestion.toString()) {
          sheetNH.getRange(i + 1, 2).setValue(item.classTag);
          sheetNH.getRange(i + 1, 3).setValue(item.question);
          sheetNH.getRange(i + 1, 4).setValue(item.datetime);
          sheetNH.getRange(i + 1, 5).setValue(item.loigiai);
          return resJSON({ status: 'success' });
        }
      }
      return resJSON({ status: 'error', message: 'Không tìm thấy ID câu hỏi' });
    }

    // 6. XÁC MINH ADMIN (verifyAdmin)
    if (action === "verifyAdmin") {
           if (data.password.toString().trim() === ADMIN_RESET_PASSWORD) return resJSON({ status: "success", message: "Chào Admin!" });
      return resJSON({ status: "error", message: "Sai mật khẩu!" });
    }

    // 7. LƯU TỪ WORD (uploadWord)
    if (action === "uploadWord") {
      const sheetExams = ss.getSheetByName("Exams") || ss.insertSheet("Exams");
      const sheetBank = ss.getSheetByName("QuestionBank") || ss.insertSheet("QuestionBank");
      sheetExams.appendRow([data.config.title, data.idNumber, data.config.duration, data.config.minTime, data.config.tabLimit, JSON.stringify(data.config.points)]);
      data.questions.forEach(function (q) { sheetBank.appendRow([data.config.title, q.part, q.type, q.classTag, q.question, q.answer, q.image]); });
      return createResponse("success", "UPLOAD_DONE");
    }

    // 8. NHÁNH THEO TYPE (quiz, rating, ketqua)
    if (data.type === 'rating') {
      let sheetRate = ss.getSheetByName("danhgia") || ss.insertSheet("danhgia");
      sheetRate.appendRow([new Date(), data.stars, data.name, data.class, data.idNumber, data.comment || "", data.taikhoanapp]);
      return createResponse("success", "Đã nhận đánh giá");
    }
    if (data.type === 'quiz') {
      let sheetQuiz = ss.getSheetByName("ketquaQuiZ") || ss.insertSheet("ketquaQuiZ");
      sheetQuiz.appendRow([new Date(), data.examCode || "QUIZ", data.name || "N/A", data.className || "", data.school || "", data.phoneNumber || "", data.score || 0, data.totalTime || "00:00", data.stk || "", data.bank || ""]);
      return createResponse("success", "Đã lưu kết quả Quiz");
    }

    // 9. LƯU KẾT QUẢ THI TỔNG HỢP (Mặc định nếu có data.examCode)
    if (data.examCode) {
      let sheetResult = ss.getSheetByName("ketqua") || ss.insertSheet("ketqua");
      sheetResult.appendRow([new Date(), data.examCode, data.sbd, data.name, data.className, data.score, data.totalTime, JSON.stringify(data.details)]);
      return createResponse("success", "Đã lưu kết quả thi");
    }
    return createResponse("error", "Không khớp lệnh nào!");

  }
  catch (err) {
    return createResponse("error", err.toString());
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
  if (!targetId) return ss;
  
  const sheet = ss.getSheetByName("idgv");
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    // Cột A: idNumber, Cột C: linkscript (URL Spreadsheet)
    if (rows[i][0].toString().trim() === targetId.toString().trim()) {
      let url = rows[i][2].toString().trim();
      if (url && url.startsWith("http")) {
        try {
          // Nếu link chính là file Master thì không cần mở lại
          if (url.indexOf(SPREADSHEET_ID) !== -1) return ss;
          return SpreadsheetApp.openByUrl(url);
        } catch (e) {
          console.log("Không thể mở link riêng của GV, dùng file Master làm mặc định.");
        }
      }
      break;
    }
  }
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
