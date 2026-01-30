import { DANHGIA_URL, API_ROUTING } from '../config';

import React, { useState, useEffect } from 'react';
import mammoth from 'mammoth';

const ExamCreator_gv = ({ onBack_gv }) => {
  // 1. STATE (Móng nhà - Đã đưa lên đầu chuẩn đét)
  const [finalData_gv, setFinalData_gv] = useState([]); 
  const [isVerified_gv, setIsVerified_gv] = useState(false);
  const [gvName_gv, setGvName_gv] = useState("");
  const [dsGiaoVien_gv, setDsGiaoVien_gv] = useState([]);
  const [loading_gv, setLoading_gv] = useState(true);
  const [config_gv, setConfig_gv] = useState({
    exams_gv: '', idNumber_gv: '', fulltime_gv: 90, mintime_gv: 15, tab_gv: 3, 
    close_gv: '', imgURL_gv: '',
    mcqCount_gv: 0, mcqScore_gv: 0, 
    tfCount_gv: 0, tfScore_gv: 0,  
    saCount_gv: 0, saScore_gv: 0   
  });

  // 2. HÀM NGHIỀN FILE WORD (Đã gộp bóc tách và tự đếm số câu)
  const handleFileUpload_gv = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const result = await mammoth.convertToHtml({ arrayBuffer: e.target.result }, { styleMap: ["u => u"] });
        const htmlContent = result.value;
        const cleanHtml = htmlContent.replace(/<u[^>]*>(Phần\s*(?:I|1|II|2|III|3))<\/u>/gi, "$1");
        
        const part1 = cleanHtml.split(/Phần\s*(?:I|1)/i)[1]?.split(/Phần\s*(?:II|2)/i)[0] || "";
        const part2 = cleanHtml.split(/Phần\s*(?:II|2)/i)[1]?.split(/Phần\s*(?:III|3)/i)[0] || "";
        const part3 = cleanHtml.split(/Phần\s*(?:III|3)/i)[1] || "";

        let finalRows = [];
        let stt = 1;
        const dateStr = new Date().toLocaleDateString('en-GB').split('/').reverse().join('').substring(2); // VD: 260130
        const grade = "10"; 

        // --- Xử lý MCQ ---
        const mcqs = part1.split(/Câu\s+\d+[:.]/gi).filter(q => q.trim() !== "");
        mcqs.forEach(raw => {
          const id = `${grade}${dateStr}${stt.toString().padStart(3, '0')}`;
          const [content, lg] = raw.split(/Hướng dẫn giải:|Lời giải:|LG:/i);
          const parts = content.split(/[A-D][\.\)]/gi);
          const match = content.match(/[A-D][\.\)]\s*<u>(.*?)<\/u>/i) || content.match(/<u>(.*?)<\/u>/);
          const qJson = { id, type: "mcq", question: parts[0].replace(/<\/?[^>]+(>|$)/g, "").trim(), o: parts.slice(1, 5).map(o => o.replace(/<\/?[^>]+(>|$)/g, "").trim()), a: match ? match[1].replace(/<\/?[^>]+(>|$)/g, "").trim() : "" };
          finalRows.push([id, `${grade}01.1`, JSON.stringify(qJson), new Date(), JSON.stringify({id, loigiai: (lg || "").trim()})]);
          stt++;
        });

        // --- Xử lý TF ---
        const tfs = part2.split(/Câu\s+\d+[:.]/gi).filter(q => q.trim() !== "");
        tfs.forEach(raw => {
          const id = `${grade}${dateStr}${stt.toString().padStart(3, '0')}`;
          const [content, lg] = raw.split(/Hướng dẫn giải:|Lời giải:|LG:/i);
          const qJson = { id, type: "true-false", question: content.replace(/<u>(.*?)<\/u>/gi, "$1").trim(), s: [...content.matchAll(/<u>(.*?)<\/u>/gi)].map(m => m[1].replace(/<\/?[^>]+(>|$)/g, "").trim()) };
          finalRows.push([id, `${grade}01.2`, JSON.stringify(qJson), new Date(), JSON.stringify({id, loigiai: (lg || "").trim()})]);
          stt++;
        });

        // --- Xử lý SA ---
        const sas = part3.split(/Câu\s+\d+[:.]/gi).filter(q => q.trim() !== "");
        sas.forEach(raw => {
          const id = `${grade}${dateStr}${stt.toString().padStart(3, '0')}`;
          const [content, lg] = raw.split(/Hướng dẫn giải:|Lời giải:|LG:/i);
          const keyMatch = content.match(/Key=(.*?)>/i);
          const qJson = { id, type: "short-answer", question: content.split(/Key=/i)[0].trim(), a: keyMatch ? keyMatch[1].trim() : "" };
          finalRows.push([id, `${grade}01.3`, JSON.stringify(qJson), new Date(), JSON.stringify({id, loigiai: (lg || "").trim()})]);
          stt++;
        });

        setFinalData_gv(finalRows);
        // Tự động cập nhật số câu vào config cho thầy luôn!
        setConfig_gv(prev => ({...prev, mcqCount_gv: mcqs.length, tfCount_gv: tfs.length, saCount_gv: sas.length}));
        alert(`✅ Đã nghiền xong ${finalRows.length} câu! Số lượng đã tự điền vào bảng.`);
      } catch (err) { alert("⚠️ Lỗi: " + err.message); }
    };
    reader.readAsArrayBuffer(file);
  };

  // 3. GỬI DỮ LIỆU (Chỉ giữ 1 bản duy nhất)
  const handleSubmit_gv = async () => {
    const idgv = config_gv.idNumber_gv?.trim();
    if (!idgv) return alert("⚠️ Thầy chưa nhập Mã xác minh!");
    const GV_API_URL = API_ROUTING[idgv] || DANHGIA_URL;

    if (finalData_gv.length === 0) return alert("⚠️ Thầy chưa tải file Word!");

    const payload = { action: "saveFullExam", data: { ...config_gv, idNumber: idgv, questions: finalData_gv } };
    try {
      await fetch(GV_API_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      alert("🚀 Tuyệt vời! Đề đã được đẩy lên hệ thống thành công!");
    } catch (error) { alert("❌ Lỗi kết nối: " + error.message); }
  };

  // 4. LOAD DANH SÁCH & XÁC MINH (Giữ nguyên)
  useEffect(() => {
    const loadIdGv = async () => {
      try {
        const resp = await fetch(`${DANHGIA_URL}?action=getIdGvList`);
        const result = await resp.json();
        if (result.status === 'success') setDsGiaoVien_gv(result.data);
      } catch (err) { console.error("❌ Lỗi fetch GV:", err); }
      finally { setLoading_gv(false); }
    };
    loadIdGv();
  }, []);

  const handleVerify_gv = (idInput) => {
    if (loading_gv) return;
    const gvMatch = dsGiaoVien_gv.find(gv => String(gv.id) === String(idInput));
    if (gvMatch) {
      setIsVerified_gv(true);
      setGvName_gv(gvMatch.name);
      setConfig_gv(prev => ({ ...prev, idNumber_gv: idInput, imgURL_gv: gvMatch.img || "" }));
    } else {
      setIsVerified_gv(false);
      alert("⚠️ ID chưa được cấp quyền!");
    }
  };
  return (
    <div className="p-4 md:p-8 bg-white rounded-[3rem] shadow-xl max-w-7xl mx-auto my-6 border border-slate-50 animate-in fade-in zoom-in duration-300">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8 px-4 border-b pb-6 border-slate-100">
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase flex items-center gap-2">
            <i className="fa-solid fa-file-shield text-emerald-500"></i>
            Hệ thống kiến tạo đề thi (GV)
          </h2>
          {isVerified_gv && (
            <div className="mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[11px] text-emerald-600 font-black uppercase tracking-widest">
                Đã xác minh: {gvName_gv}
              </span>
            </div>
          )}
        </div>
        <button onClick={onBack_gv} className="group flex items-center gap-2 p-3 px-6 rounded-2xl bg-red-50 text-red-500 font-bold text-xs hover:bg-red-500 hover:text-white transition-all shadow-sm">
          <i className="fa-solid fa-circle-xmark group-hover:rotate-90 transition-transform"></i>
          THOÁT RA
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* CỘT TRÁI: CẤU HÌNH */}
        <div className="w-full lg:w-1/3 space-y-5 bg-slate-50 p-8 rounded-[2.5rem] border border-white shadow-inner">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <i className="fa-solid fa-id-card"></i> Bước 1: Thông tin quản lý
          </p>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 ml-3 uppercase">Mã xác minh GV</label>
              <input 
                type="text" 
                placeholder={loading_gv ? "Đang tải dữ liệu..." : "Nhập ID để mở khóa..."}
                disabled={loading_gv}
                className="w-full mt-1 p-4 rounded-2xl border-2 border-transparent bg-white shadow-sm focus:border-emerald-500 focus:ring-0 transition-all font-black text-blue-600 outline-none"
                onBlur={(e) => handleVerify_gv(e.target.value)}
              />
            </div>
            
            <div className={`space-y-4 transition-all duration-500 ${isVerified_gv ? "opacity-100 scale-100" : "opacity-20 pointer-events-none scale-95"}`}>
              <input 
                placeholder="Tên mã đề thi viết liền..." 
                className="w-full p-4 rounded-2xl border-none shadow-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                onChange={(e) => setConfig_gv({...config_gv, exams_gv: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Times phút" className="w-full p-4 rounded-2xl border-none shadow-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
                <input type="number" placeholder="Max tab" className="w-full p-4 rounded-2xl border-none shadow-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <input 
                placeholder="Nhập ID imgURL (Thư mục ảnh)..." 
                className="w-full p-4 rounded-2xl border-none shadow-sm text-[10px] font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                value={config_gv.imgURL_gv}
                onChange={(e) => setConfig_gv({...config_gv, imgURL_gv: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: RUỘT ĐỀ */}
        <div className={`w-full lg:w-2/3 space-y-6 transition-all duration-700 ${isVerified_gv ? "translate-x-0 opacity-100" : "translate-x-10 opacity-10 pointer-events-none"}`}>
          <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <i className="fa-solid fa-list-check"></i> Bước 2: Cấu trúc & Tải tệp
            </p>
            <div className="grid grid-cols-3 gap-4 mb-8">
  {['MCQ', 'TF', 'SA'].map((type) => {
    // Xác định field name tương ứng trong state config_gv
    const countField = type.toLowerCase() + 'Count_gv'; 
    const scoreField = type.toLowerCase() + 'Score_gv';
    const label = type === 'MCQ' ? 'Trắc nghiệm' : type === 'TF' ? 'Đúng/Sai' : 'T.Lời ngắn';

    return (
      <div key={type} className="bg-white/5 p-4 rounded-2xl border border-white/10 hover:border-emerald-500/50 transition-all group">
        <p className="text-[10px] font-black text-emerald-500 mb-2 uppercase tracking-tighter">
          {type} ({label})
        </p>
        
        {/* Input Số câu - Tự động cập nhật khi upload Word */}
        <div className="relative">
          <input 
            type="number" 
            placeholder="Câu" 
            value={config_gv[countField] || ''}
            onChange={(e) => setConfig_gv({...config_gv, [countField]: parseInt(e.target.value) || 0})}
            className="w-full bg-transparent border-b border-white/20 focus:border-emerald-500 outline-none mb-3 text-sm font-black text-white placeholder:text-slate-600 transition-colors" 
          />
          <span className="absolute right-0 top-0 text-[9px] text-slate-500 font-bold uppercase group-hover:text-emerald-500 transition-colors">Số câu</span>
        </div>

        {/* Input Điểm số */}
        <div className="relative">
          <input 
            type="number" 
            step="0.1" 
            placeholder="Điểm" 
            value={config_gv[scoreField] || ''}
            onChange={(e) => setConfig_gv({...config_gv, [scoreField]: parseFloat(e.target.value) || 0})}
            className="w-full bg-transparent border-b border-white/20 focus:border-emerald-500 outline-none text-sm font-black text-emerald-400 placeholder:text-slate-600 transition-colors" 
          />
          <span className="absolute right-0 top-0 text-[9px] text-slate-500 font-bold uppercase group-hover:text-emerald-500 transition-colors">Tổng điểm</span>
        </div>
      </div>
    );
  })}
</div>
           {/* DROPZONE FILE WORD */}
<div className="relative group border-2 border-dashed border-slate-700 rounded-[2rem] p-12 text-center hover:border-emerald-500 hover:bg-emerald-500/5 transition-all cursor-pointer">
  {/* GẮN VÀO ĐÂY THẦY NHÉ */}
  <input 
    type="file" 
    accept=".docx" 
    onChange={handleFileUpload_gv} 
    className="absolute inset-0 opacity-0 cursor-pointer" 
  />
  
  <i className="fa-solid fa-cloud-arrow-up text-5xl text-emerald-500 mb-4 group-hover:scale-110 transition-transform"></i>
  <h4 className="text-sm font-black uppercase tracking-tight">Tải đề Word (.docx)</h4>
  <p className="text-[10px] text-slate-500 mt-2 font-medium italic">Hệ thống sẽ tự động bóc tách Câu hỏi, Đáp án và Hình ảnh</p>
</div>
            <button onClick={handleSubmit_gv} className="w-full mt-8 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-black shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase text-sm">
              <i className="fa-solid fa-rocket"></i> Bắt đầu đẩy đề lên hệ thống
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamCreator_gv;
