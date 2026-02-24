import React, { useState, useEffect } from 'react';
import { DANHGIA_URL } from '../config';
import { questionsBank } from '../questions'; // Hoặc đường dẫn file questions của thầy

const AdminPanel = ({ mode, onBack }) => {
 
  // Thêm 'duplicate' và 'delete' vào kiểu dữ liệu của useState
const [currentTab, setCurrentTab] = useState('cauhoi');
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [otp, setOtp] = useState("");
   const [loiGiaiTraCuu, setLoiGiaiTraCuu] = useState("");
  const [loadingLG, setLoadingLG] = useState(false);
 
  const [jsonInput, setJsonInput] = useState('');
  const [subjects, setSubjects] = useState([]); // Khai báo này để chứa môn học
 // Bỏ cái ": string" đi là xong thầy nhé
const normalizeText = (text) => {
  return text
    .toLowerCase()
    .replace(/\s+/g, '') 
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "") 
    .trim();
};
  useEffect(() => {
  // Hàm này sẽ chạy ngay khi thầy mở trang Admin
  const loadConfig = async () => {
    try {
      const response = await fetch(`${DANHGIA_URL}?action=getAppConfig`, {
        method: 'GET',
        redirect: 'follow' // Bắt buộc phải có để tránh lỗi CORS
      });
      const result = await response.json();
      if (result.status === "success") {
        setSubjects(result.data.topics);
        console.log("✅ Đã nạp cấu hình môn học thành công!");
      }
    } catch (err) {
      console.error("❌ Lỗi nạp Config:", err);
    }
  };

  loadConfig();
}, []); // Dấu ngoặc vuông này đảm bảo nó chỉ chạy 1 lần duy nhất khi load trang 

  const [editForm, setEditForm] = useState({ 
    idquestion: '', classTag: '', question: '', phuongan: '', dadung: '', loigiai: '' 
  });
  const [gvInfo, setGvInfo] = useState({ id: '', pass: '' });  
  const [maTranForm, setMaTranForm] = useState({
  makiemtra: '',
  name: '',
  duration: '',
  topics: '',
  numMC: '',
  scoreMC: '',
  mcL3: '',
  mcL4: '',
  numTF: '',
  scoreTF: '',
  tfL3: '',
  tfL4: '',
  numSA: '',
  scoreSA: '',
  saL3: '',
  saL4: ''
});
  useEffect(() => {
    if (mode) setCurrentTab(mode);
  }, [mode]);

  // --- 1. XỬ LÝ WORD ---
  const findQuestion = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${DANHGIA_URL}?action=getQuestionById&id=${editForm.idquestion}`);
      const res = await resp.json();
      if (res.status === 'success') setEditForm(res.data);
      else alert("Không tìm thấy!");
    } finally { setLoading(false); }
  };
  const handleUpdateQuestion = async () => {
  setLoading(true);
  try {
    // Chỉ để data trong payload
    const payload = {
      data: {
        idquestion: editForm.idquestion,
        classTag: editForm.classTag || "",
        question: editForm.question,
        datetime: editForm.datetime || "",
        loigiai: editForm.loigiai || ""
      }
    };

    // Thêm ?action=updateQuestion vào cuối URL
    const res = await fetch(`${DANHGIA_URL}?action=updateQuestion`, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    });
    
    const result = await res.json();
    if(result.status === 'success') {
      alert("Cập nhật thành công!");
      // Thầy nên thêm logic đóng Modal hoặc cập nhật lại danh sách tại đây
    }
    
  } catch (error) {
    console.error("Lỗi cập nhật:", error);
  } finally {
    setLoading(false);
  }
};  
// ===========================================================================================================================================tách dữ liệu câu hỏi
  const handleWordParser = (text) => {
  if (!text || !text.trim()) {
    setJsonInput('');
    return;
  }

  const blocks = [];
  const rawParts = text.split('}#');

  rawParts.forEach(part => {
    const start = part.indexOf('{');
    if (start !== -1) {
      const block = part.slice(start).trim() + '}';
      blocks.push(block);
    }
  });

  if (!blocks.length) {
    alert("❌ Không tìm thấy block!");
    return;
  }

  const results = blocks.map((block) => {
    try {
      const obj = new Function(`return (${block})`)();

      return {
        id: obj.id,
        classTag: obj.classTag || "",
        type: obj.type || "",
        part: obj.part || "",
        question: obj.question || "",
        options: obj.o ? JSON.stringify(obj.o) :
                 obj.s ? JSON.stringify(obj.s) : "",
        answer: obj.a || "",
        loigiai: obj.loigiai || ""
      };

    } catch (e) {
      console.error("Parse lỗi:", block);
      return null;
    }
  }).filter(Boolean);

  setJsonInput(JSON.stringify(results, null, 2));
};
// ===================================load ngân hàng đề =====================
  const handleLoadQuestions = async () => {
  const resp = await fetch(`${DANHGIA_URL}?action=loadQuestions`);
  const res = await resp.json();

  if (res.status === 'success') {
    setAllQuestions(res.data);
    alert("📚 Đã load ngân hàng câu hỏi!");
  } else {
    alert("Lỗi load!");
  }
};

// ======================================================================================Ghi câu hoi ngân hàng=========
  
 const handleSaveQuestions = async () => {
  if (!jsonInput) return alert("Chưa có dữ liệu!");
  setLoading(true);
  try {
    // Phải parse jsonInput thành mảng Object trước khi gửi
    const dataArray = JSON.parse(jsonInput); 
    
    const resp = await fetch(`${DANHGIA_URL}?action=saveQuestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' }, 
      body: JSON.stringify(dataArray) 
    });
    
    const res = await resp.json();
    if (res.status === 'success') { 
      alert(`🚀 Thành công! Đã chèn thêm ${dataArray.length} câu hỏi vào ngân hàng .`); 
      setJsonInput(''); 
    } else {
      alert("Lỗi: " + res.message);
    }
  } catch (e) { 
    console.error(e);
    alert("Lỗi gửi dữ liệu! Thầy kiểm tra dữ liệu đầu vào có chuẩn mảng JSON không nhé."); 
  } finally { 
    setLoading(false); 
  }
};
// Up lG
const handleUploadLG = async () => {
  if (!jsonInput.trim()) return alert("Dán nội dung vào đã thầy ơi!");
  setLoading(true);
  try {
    const blocks = [];
    let current = '';
    let depth = 0;
    for (let i = 0; i < jsonInput.length; i++) {
      const ch = jsonInput[i];
      if (ch === '{') { if (depth === 0) current = ''; depth++; }
      if (depth > 0) current += ch;
      if (ch === '}') { depth--; if (depth === 0) blocks.push(current.trim()); }
    }

    const itemsToUpload = blocks.map(block => {
      const idMatch = block.match(/id\s*:\s*(\d+|["'][^"']+["'])/);
      const id = idMatch ? idMatch[1].replace(/["']/g, '') : null;
      return { id: id, loigiai: block };
    }).filter(item => item.id !== null);

    // Cách thầy đề xuất: Đưa action lên URL cho chắc chắn
    const resp = await fetch(`${DANHGIA_URL}?action=saveLG`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(itemsToUpload) // Chỉ gửi mảng phẳng thôi
    });
    
    const result = await resp.text();
    alert(result);
    setJsonInput('');
  } catch (e) { alert("Lỗi gửi dữ liệu thầy ạ!"); }
  finally { setLoading(false); }
};

  // Tìm câu trùng
  const handleFindDuplicates = () => {
  const groups = []; // Chứa các nhóm câu trùng
  const bank = questionsBank;
  const processed = new Set();

  for (let i = 0; i < bank.length; i++) {
    if (processed.has(bank[i].id)) continue;
    let currentGroup = [bank[i]];

    for (let j = i + 1; j < bank.length; j++) {
      const q1 = bank[i];
      const q2 = bank[j];

      // Tiêu chuẩn "Mềm" của thầy:
      const sameAnswer = q1.loigiai === q2.loigiai; // Nếu thầy lưu đáp án trong loigiai
      const similarContent = checkTextSimilarity(q1.question, q2.question) > 0.9;

      if (sameAnswer || similarContent) {
        currentGroup.push(q2);
        processed.add(q2.id);
      }
    }
    if (currentGroup.length > 1) {
      groups.push(currentGroup);
      processed.add(bank[i].id);
    }
  }
  return groups;
};
const handleDeepScan = () => {
  // Kiểm tra nếu bank chưa có dữ liệu
  if (!questionsBank || questionsBank.length === 0) {
    alert("Dữ liệu đang được tải hoặc ngân hàng trống. Thầy đợi tí nhé!");
    return;
  }
  
  const bank = questionsBank;
  const groups = [];
  const processed = new Set();
  const resultDiv = document.getElementById('duplicateResult');
  resultDiv.innerHTML = ''; // Xóa kết quả cũ

  for (let i = 0; i < bank.length; i++) {
    if (processed.has(bank[i].id)) continue;
    let group = [bank[i]];

    for (let j = i + 1; j < bank.length; j++) {
      const q1 = bank[i];
      const q2 = bank[j];

      // TIÊU CHUẨN THẦY ĐẶT RA:
      const isSameAnswer = q1.loigiai === q2.loigiai && q1.loigiai !== "";
      // So sánh nội dung (loại bỏ khoảng trắng, dấu để so sánh chính xác)
      const content1 = q1.question.replace(/\s+/g, '').toLowerCase();
      const content2 = q2.question.replace(/\s+/g, '').toLowerCase();
      const isSimilar = content1 === content2;

      if (isSameAnswer || isSimilar) {
        group.push(q2);
        processed.add(q2.id);
      }
    }

    if (group.length > 1) {
      groups.push(group);
      processed.add(bank[i].id);
      
      // Hiển thị kết quả ngay lên màn hình
      const ids = group.map(g => g.id).join(', ');
      resultDiv.innerHTML += `
        <div class="p-4 bg-slate-50 rounded-2xl border-l-4 border-purple-500">
          <div class="flex justify-between items-center mb-2">
            <span class="font-black text-purple-600 text-sm uppercase">Nhóm trùng:</span>
            <button onclick="navigator.clipboard.writeText('${ids}'); alert('Đã copy danh sách ID!')" class="text-[10px] bg-white px-2 py-1 rounded border font-bold hover:bg-purple-50">Copy tất cả ID</button>
          </div>
          <p class="text-xs font-bold text-slate-700 mb-1">Các ID: ${ids}</p>
          <p class="text-[11px] text-slate-500 italic truncate">Nội dung: ${group[0].question.substring(0, 100)}...</p>
        </div>
      `;
    }
  }
  
  if(groups.length === 0) {
    resultDiv.innerHTML = '<div class="text-center py-10 font-bold text-emerald-500">🎉 Tuyệt vời! Không có câu nào trùng lặp.</div>';
  }
  return groups;
};

  // --- 2. XÁC MINHXỬ LÝ NHẬP CÂU HỎI & SỬA LẺ (Giữ nguyên logic của thầy) ---
  const handleVerifyAdminOTP = () => {
    if (otp === "12345@" || otp === "6688@") setIsAdminVerified(true);
    else alert("Mã OTP sai!");
  };
  if (!isAdminVerified) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md text-center">
          <h2 className="text-2xl font-black mb-8">ADMIN SECURITY</h2>
          <input type="text" className="w-full p-5 bg-slate-50 border-2 rounded-2xl text-center text-4xl mb-8" value={otp} onChange={e => setOtp(e.target.value)} />
          <button onClick={handleVerifyAdminOTP} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black">XÁC MINH</button>
        </div>
      </div>
    );
  }

  return (
 <div className="p-4 md:p-8 bg-white rounded-[3rem] shadow-xl max-w-6xl mx-auto my-6 border border-slate-50">
      <div className="flex items-center gap-2 mb-8 bg-white/50 backdrop-blur-md p-2 rounded-3xl w-fit shadow-sm border border-slate-200">
  {/* Nút Sửa câu hỏi */}
  <button 
    onClick={() => setCurrentTab('cauhoi')} 
    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase transition-all ${
      currentTab === 'cauhoi' 
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105' 
      : 'text-slate-500 hover:bg-slate-100'
    }`}
  >
    <i className="fa-solid fa-pen-to-square"></i> Sửa câu hỏi
  </button>
  
  {/* Nút Import Word */}
  <button 
    onClick={() => setCurrentTab('word')} 
    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase transition-all ${
      currentTab === 'word' 
      ? 'bg-orange-500 text-white shadow-lg shadow-orange-200 scale-105' 
      : 'text-slate-500 hover:bg-slate-100'
    }`}
  >
    <i className="fa-solid fa-file-word"></i> Import Word
  </button>
         {/* Nút Import LG - Thêm mới tại đây */}
<button 
  onClick={() => {setCurrentTab('lg'); setJsonInput('');}} 
  className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase transition-all ${
    currentTab === 'lg' 
    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 scale-105' 
    : 'text-slate-500 hover:bg-slate-100'
  }`}
>
  <i className="fa-solid fa-lightbulb"></i> Import LG
</button>
{/* Nút Tìm câu trùng */}
<button 
  onClick={() => setCurrentTab('duplicate')} 
  className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase transition-all ${
    currentTab === 'duplicate' 
    ? 'bg-purple-600 text-white shadow-lg shadow-purple-200 scale-105' 
    : 'text-slate-500 hover:bg-slate-100'
  }`}
>
  <i className="fa-solid fa-clone"></i> Tìm câu trùng
</button>

{/* Nút Xóa câu hỏi */}
<button 
  onClick={() => setCurrentTab('delete')} 
  className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase transition-all ${
    currentTab === 'delete' 
    ? 'bg-red-600 text-white shadow-lg shadow-red-200 scale-105' 
    : 'text-slate-500 hover:bg-slate-100'
  }`}
>
  <i className="fa-solid fa-trash-can"></i> Xóa câu hỏi
</button>
  {/* Vạch ngăn cách tinh tế */}
  <div className="w-[1px] h-6 bg-slate-300 mx-2"></div>

  {/* Nút Thoát ra - Rực rỡ và an toàn */}
  <button 
    onClick={onBack} 
    className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase text-red-500 hover:bg-red-50 hover:scale-105 transition-all active:scale-95"
  >
    <i className="fa-solid fa-right-from-bracket"></i> Thoát ra
  </button>
</div>
      <div className="min-h-[500px]">
       {/* TAB 1: SỬA CÂU HỎI */}
{currentTab === 'cauhoi' && (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
    
    {/* CỘT TRÁI: NHẬP LIỆU & ĐIỀU KHIỂN */}
    <div className="bg-slate-50 p-6 rounded-[2.5rem] space-y-4 shadow-sm">
      <div className="flex items-center justify-between mb-2 px-2">
        <span className="text-xs font-black text-slate-400 uppercase tracking-tighter">Bộ lọc tìm kiếm</span>
        {editForm.idquestion && <span className="text-[10px] text-blue-500 font-bold">Đang sửa: {editForm.idquestion}</span>}
      </div>
      
      <div className="flex gap-2 bg-white p-2 rounded-3xl shadow-sm border border-slate-100">
        <input 
          type="text" 
          placeholder="Nhập ID câu hỏi (VD: MCQ001)..." 
          className="flex-1 p-3 pl-4 rounded-2xl outline-none text-sm font-bold" 
          value={editForm.idquestion} 
          onChange={e => setEditForm({...editForm, idquestion: e.target.value})} 
        />
        <button 
          onClick={findQuestion} 
          disabled={loading}
          className="px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : 'TÌM'}
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 ml-4 uppercase">Nội dung chỉnh sửa</label>
        <textarea 
          className="w-full h-80 p-6 rounded-[2rem] outline-none shadow-sm border border-transparent focus:border-blue-300 transition-all text-sm leading-relaxed" 
          placeholder="Nội dung câu hỏi sẽ hiện ở đây để thầy chỉnh sửa..."
          value={editForm.question} 
          onChange={e => setEditForm({...editForm, question: e.target.value})} 
        />
      </div>

      {/* Nút cập nhật nhanh */}
      <button 
        onClick={handleUpdateQuestion}
        className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-emerald-100 transition-all"
      >
        <i className="fa-solid fa-floppy-disk mr-2"></i> LƯU THAY ĐỔI (CỘT C)
      </button>
    </div>

    {/* CỘT PHẢI: HIỂN THỊ CHI TIẾT (PREVIEW CỘT C) */}
    <div className="bg-slate-50 p-6 rounded-[2.5rem] flex flex-col shadow-sm border border-white">
      <div className="flex items-center justify-between mb-4 px-2">
        <p className="text-xs font-black text-slate-400 uppercase tracking-tighter">Nội dung chi tiết (Cột C)</p>
        <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-red-400"></div>
            <div className="w-2 h-2 rounded-full bg-amber-400"></div>
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
        </div>
      </div>

      <div className="flex-1 bg-white p-8 rounded-[2rem] shadow-inner overflow-y-auto border border-slate-100">
        {editForm.question ? (
          <div className="animate-in slide-in-from-bottom-2 duration-500">
             {/* Hiển thị Question với định dạng gốc */}
            <div className="prose prose-slate max-w-none">
              <p className="text-slate-700 text-base leading-7 whitespace-pre-wrap font-medium">
                {editForm.question}
              </p>
            </div>
            
            {/* Vạch kẻ trang trí */}
            <div className="my-6 border-t border-dashed border-slate-200"></div>
            
            {/* Thông tin bổ sung - Thầy có thể mở rộng thêm đáp án ở đây */}
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 bg-slate-50 rounded-2xl">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Trạng thái</span>
                  <span className="text-xs font-bold text-emerald-600 italic">Đã đồng bộ từ Sheet</span>
               </div>
               <div className="p-4 bg-slate-50 rounded-2xl">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Định dạng</span>
                  <span className="text-xs font-bold text-blue-600 italic">UTF-8 Standard</span>
               </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4">
            <i className="fa-solid fa-magnifying-glass text-5xl opacity-20"></i>
            <p className="text-sm font-bold italic">Chưa có dữ liệu để hiển thị...</p>
          </div>
        )}
      </div>
      
      <p className="mt-4 text-[10px] text-center text-slate-400 font-medium">
        Hệ thống tự động canh lề và giữ nguyên định dạng xuống dòng (whitespace)
      </p>
    </div>
    
  </div>
)}

        {/* TAB 2: IMPORT WORD */}
        {currentTab === 'word' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-300">
            <div className="bg-slate-50 p-6 rounded-[2.5rem]">
              <textarea className="w-full h-96 p-6 bg-white rounded-[2rem] shadow-sm text-sm outline-none" placeholder="Dán nội dung Word..." onChange={(e) => handleWordParser(e.target.value)} />
            </div>
            <div className="bg-slate-50 p-6 rounded-[2.5rem] space-y-4">
              <textarea className="w-full h-80 p-6 bg-slate-900 text-emerald-400 rounded-[2rem] font-mono text-xs outline-none" value={jsonInput} readOnly />
              <button onClick={handleSaveQuestions} disabled={!jsonInput || loading} className="w-full py-5 bg-orange-600 text-white rounded-[2rem] font-black shadow-lg">
                {loading ? 'ĐANG ĐẨY DỮ LIỆU...' : 'ĐẨY LÊN SHEET'}
              </button>
            </div>
          </div>
        )}   
        {/* TAB 3: IMPORT LỜI GIẢI (CỘT E) */}
{currentTab === 'lg' && (
  <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4">
    <div className="bg-emerald-50 p-8 rounded-[3rem] border-2 border-dashed border-emerald-200">
      <textarea 
        className="w-full h-80 p-6 bg-white rounded-[2rem] shadow-inner text-sm outline-none focus:ring-2 ring-emerald-500 font-mono mb-4" 
        placeholder="Dán JSON lời giải từ file Word vào đây..."
        value={jsonInput}
        onChange={(e) => setJsonInput(e.target.value)}
      />
      <button 
        onClick={handleUploadLG} 
        disabled={loading || !jsonInput}
        className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black shadow-xl"
      >
        {loading ? "ĐANG LƯU..." : "CẬP NHẬT LỜI GIẢI (CỘT E)"}
      </button>
    </div>
  </div>
)}
        {loiGiaiTraCuu && (
  <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 my-2 whitespace-pre-wrap">
    <strong>Lời giải:</strong> {loiGiaiTraCuu}
  </div>
)}
        {/* TAB 4: XÓA CÂU HỎI */}
        {currentTab === 'delete' && (
  <div className="p-8 bg-white rounded-[2.5rem] border-2 border-red-50 shadow-xl animate-fade-in">
    <div className="flex items-center gap-4 mb-6">
      <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
        <i className="fa-solid fa-eraser text-xl"></i>
      </div>
      <div>
        <h3 className="text-xl font-black text-slate-800 uppercase">Xóa câu hỏi hàng loạt</h3>
        <p className="text-xs text-slate-400 font-bold">Nhập các ID cách nhau bởi dấu phẩy</p>
      </div>
    </div>

    <textarea 
      id="batchDeleteInput"
      placeholder="Ví dụ: 601.1, 1002.4, 1205.2" 
      className="w-full p-5 bg-slate-50 rounded-3xl border-2 border-slate-100 outline-none font-black text-red-600 focus:border-red-200 transition-all mb-4 h-32"
    />

    <button 
      onClick={async () => {
        const input = document.getElementById('batchDeleteInput').value;
        if(!input) return alert("Vui lòng nhập ít nhất một ID!");
        
        if(confirm(`Bạn có chắc chắn muốn xóa các câu: ${input}?`)) {
          const url = `${DANHGIA_URL}?action=deleteMultiple&ids=${encodeURIComponent(input)}`;
          const resp = await fetch(url);
          const res = await resp.json();
          if(res.status === "success") {
            alert(`Thành công! Đã xóa ${res.deletedCount} câu hỏi.`);
            document.getElementById('batchDeleteInput').value = '';
          }
        }
      }}
      className="w-full py-5 bg-red-600 text-white rounded-2xl font-black uppercase shadow-lg shadow-red-200 hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-3"
    >
      <i className="fa-solid fa-trash-arrow-up"></i> Xác nhận xóa vĩnh viễn
    </button>
  </div>
)}

       {currentTab === 'duplicate' && (
  <div className="p-8 bg-white rounded-[2.5rem] border-2 border-purple-50 shadow-xl animate-fade-in">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center">
          <i className="fa-solid fa-magnifying-glass-chart text-xl"></i>
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-800 uppercase">Phân tích câu trùng</h3>
          <p className="text-xs text-slate-400 font-bold">Dựa trên nội dung và đáp án</p>
        </div>
      </div>
      <button 
        onClick={() => {
          // Hàm này thầy gọi logic tìm trùng em viết ở dưới
          const result = handleDeepScan(); 
          alert(`Tìm thấy ${result.length} nhóm nghi ngờ trùng!`);
        }}
        className="px-6 py-3 bg-purple-600 text-white rounded-xl font-black text-xs uppercase hover:bg-purple-700 transition-all"
      >
        Bắt đầu quét ngân hàng
      </button>
    </div>

    {/* Nơi hiện kết quả tìm trùng */}
    <div id="duplicateResult" className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
       <p className="text-center text-slate-400 italic text-sm">Nhấn nút quét để bắt đầu phân tích dữ liệu...</p>
    </div>
  </div>
)}
      </div>
    </div>
  );
};

export default AdminPanel;
