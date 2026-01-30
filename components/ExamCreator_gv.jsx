import { DANHGIA_URL, API_ROUTING } from '../config';
import React, { useState, useEffect } from 'react';
import mammoth from 'mammoth';

const ExamCreator_gv = ({ onBack_gv }) => {
  const [finalData_gv, setFinalData_gv] = useState([]); 
  const [isVerified_gv, setIsVerified_gv] = useState(false);
  const [gvName_gv, setGvName_gv] = useState("");
  const [dsGiaoVien_gv, setDsGiaoVien_gv] = useState([]);
  const [loading_gv, setLoading_gv] = useState(true);
  const [config_gv, setConfig_gv] = useState({
    exams_gv: '', idNumber_gv: '', fulltime_gv: 90, mintime_gv: 15, tab_gv: 3, 
    close_gv: '', imgURL_gv: '',
    mcqCount_gv: 20, mcqScore_gv: 0, 
    tfCount_gv: 6, tfScore_gv: 0,  
    saCount_gv: 6, saScore_gv: 0   
  });

  // HÀM XỬ LÝ FILE WORD - CHUẨN 20-6-6
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
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-GB').split('/').reverse().join('').substring(2); // YYMMDD
        const secStr = now.getSeconds().toString().padStart(2, '0'); // Giây để ID biến đổi
        const grade = "12"; // Đề 1201 là lớp 12 thầy nhỉ

        // --- MCQ (20 CÂU) ---
        const mcqs = part1.split(/Câu\s+\d+[:.]/gi).filter(q => q.trim().length > 20).slice(0, 20);
        mcqs.forEach((raw, index) => {
          const stt = index + 1;
          const id = `${grade}${dateStr}${secStr}${stt.toString().padStart(3, '0')}`;
          const [content, lg] = raw.split(/Hướng dẫn giải:|Lời giải:|LG:/i);
          const parts = content.split(/[A-D][\.\)]/gi);
          const match = content.match(/[A-D][\.\)]\s*<u>(.*?)<\/u>/i) || content.match(/<u>(.*?)<\/u>/);
          const qJson = { id, type: "mcq", question: parts[0].replace(/<\/?[^>]+(>|$)/g, "").trim(), o: parts.slice(1, 5).map(o => o.replace(/<\/?[^>]+(>|$)/g, "").trim()), a: match ? match[1].replace(/<\/?[^>]+(>|$)/g, "").trim() : "" };
          finalRows.push([id, `${config_gv.exams_gv}.1`, JSON.stringify(qJson), new Date(), JSON.stringify({id, loigiai: (lg || "").trim()})]);
        });

        // --- TF (6 CÂU) ---
        const tfs = part2.split(/Câu\s+\d+[:.]/gi).filter(q => q.trim().length > 20).slice(0, 6);
        tfs.forEach((raw, index) => {
          const stt = index + 21;
          const id = `${grade}${dateStr}${secStr}${stt.toString().padStart(3, '0')}`;
          const [content, lg] = raw.split(/Hướng dẫn giải:|Lời giải:|LG:/i);
          const qJson = { id, type: "true-false", question: content.replace(/<u>(.*?)<\/u>/gi, "$1").trim(), s: [...content.matchAll(/<u>(.*?)<\/u>/gi)].map(m => m[1].replace(/<\/?[^>]+(>|$)/g, "").trim()) };
          finalRows.push([id, `${config_gv.exams_gv}.2`, JSON.stringify(qJson), new Date(), JSON.stringify({id, loigiai: (lg || "").trim()})]);
        });

        // --- SA (6 CÂU) ---
        const sas = part3.split(/Câu\s+\d+[:.]/gi).filter(q => q.trim().length > 20).slice(0, 6);
        sas.forEach((raw, index) => {
          const stt = index + 27;
          const id = `${grade}${dateStr}${secStr}${stt.toString().padStart(3, '0')}`;
          const [content, lg] = raw.split(/Hướng dẫn giải:|Lời giải:|LG:/i);
          const keyMatch = content.match(/Key=(.*?)>/i);
          const qJson = { id, type: "short-answer", question: content.split(/Key=/i)[0].trim(), a: keyMatch ? keyMatch[1].trim() : "" };
          finalRows.push([id, `${config_gv.exams_gv}.3`, JSON.stringify(qJson), new Date(), JSON.stringify({id, loigiai: (lg || "").trim()})]);
        });

        setFinalData_gv(finalRows);
        setConfig_gv(prev => ({...prev, mcqCount_gv: mcqs.length, tfCount_gv: tfs.length, saCount_gv: sas.length}));
        alert(`✅ Đã tạo đề thành công , có ${finalRows.length} câu gồm: MCQ: ${mcqs.length}, TF: ${tfs.length}, TF: ${sas.length}`, );
      } catch (err) { alert("⚠️ Lỗi bóc tách: " + err.message); }
    };
    reader.readAsArrayBuffer(file);
  };

  // GỬI DỮ LIỆU CHUẨN VÀO 2 SHEET
  const handleSubmit_gv = async () => {
    const idgv = config_gv.idNumber_gv?.trim();
    if (!idgv) return alert("⚠️ Thầy nhập ID xác minh trước nhé!");
    if (finalData_gv.length === 0) return alert("⚠️ Chưa có dữ liệu câu hỏi!");

    const GV_API_URL = API_ROUTING[idgv] || DANHGIA_URL;

    const payload = {
      action: "saveFullExam",
      examConfig: {
        exams: config_gv.exams_gv,
        idNumber: idgv,
        fulltime: config_gv.fulltime_gv,
        mintime: config_gv.mintime_gv,
        tab: config_gv.tab_gv,
        close: config_gv.close_gv,
        imgURL: config_gv.imgURL_gv,
        mcqCount: config_gv.mcqCount_gv, mcqScore: config_gv.mcqScore_gv,
        tfCount: config_gv.tfCount_gv, tfScore: config_gv.tfScore_gv,
        saCount: config_gv.saCount_gv, saScore: config_gv.saScore_gv
      },
      examQuestions: finalData_gv // Mảng [[id, tag, content, date, lg],...]
    };

    try {
      await fetch(GV_API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      alert("🚀 Tuyệt vời! Đề đã được đẩy vào sheet 'exams' và 'exam_data' thành công!");
    } catch (error) { alert("❌ Lỗi: " + error.message); }
  };

  // ... (Giữ nguyên các hàm useEffect và handleVerify của thầy) ...
  useEffect(() => {
    const loadIdGv = async () => {
      try {
        const resp = await fetch(`${DANHGIA_URL}?action=getIdGvList`);
        const result = await resp.json();
        if (result.status === 'success') setDsGiaoVien_gv(result.data);
      } catch (err) { console.error(err); }
      finally { setLoading_gv(false); }
    };
    loadIdGv();
  }, []);

  const handleVerify_gv = (idInput) => {
    const gvMatch = dsGiaoVien_gv.find(gv => String(gv.id) === String(idInput));
    if (gvMatch) {
      setIsVerified_gv(true);
      setGvName_gv(gvMatch.name);
      setConfig_gv(prev => ({ ...prev, idNumber_gv: idInput, imgURL_gv: gvMatch.img || "" }));
    } else {
      setIsVerified_gv(false);
      alert("⚠️ ID chưa cấp quyền!");
    }
  };

  return (
    <div className="p-4 md:p-8 bg-white rounded-[3rem] shadow-xl max-w-7xl mx-auto my-6 border border-slate-50">
      <div className="flex justify-between items-center mb-8 border-b pb-6">
        <h2 className="text-xl font-black text-slate-800 uppercase">Hệ thống kiến tạo đề thi</h2>
        <button onClick={onBack_gv} className="p-3 px-6 rounded-2xl bg-red-50 text-red-500 font-bold text-xs hover:bg-red-500 hover:text-white transition-all">THOÁT</button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-1/3 space-y-5 bg-slate-50 p-8 rounded-[2.5rem]">
          <p className="text-[10px] font-black text-slate-400 uppercase">Bước 1: Cấu hình</p>
          <input type="text" placeholder="Nhập ID GV..." className="w-full p-4 rounded-2xl border-none shadow-sm" onBlur={(e) => handleVerify_gv(e.target.value)} />
          
          <div className={isVerified_gv ? "space-y-4" : "opacity-20 pointer-events-none"}>
            <input placeholder="Mã đề (VD: 1201)" className="w-full p-4 rounded-2xl border-none shadow-sm font-bold" onChange={(e) => setConfig_gv({...config_gv, exams_gv: e.target.value})} />
            <div className="grid grid-cols-2 gap-3">
              <input type="number" placeholder="Phút" className="w-full p-4 rounded-2xl border-none shadow-sm" value={config_gv.fulltime_gv} onChange={(e) => setConfig_gv({...config_gv, fulltime_gv: e.target.value})} />
              <input type="number" placeholder="Tab" className="w-full p-4 rounded-2xl border-none shadow-sm" value={config_gv.tab_gv} onChange={(e) => setConfig_gv({...config_gv, tab_gv: e.target.value})} />
            </div>
            <input placeholder="Thư mục ảnh..." className="w-full p-4 rounded-2xl border-none shadow-sm text-[10px]" value={config_gv.imgURL_gv} onChange={(e) => setConfig_gv({...config_gv, imgURL_gv: e.target.value})} />
          </div>
        </div>

        <div className={`w-full lg:w-2/3 space-y-6 ${isVerified_gv ? "" : "opacity-10 pointer-events-none"}`}>
          <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl">
            <div className="grid grid-cols-3 gap-4 mb-8">
              {['MCQ', 'TF', 'SA'].map((type) => {
                const countField = type.toLowerCase() + 'Count_gv'; 
                const scoreField = type.toLowerCase() + 'Score_gv';
                return (
                  <div key={type} className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <p className="text-[10px] font-black text-emerald-500 mb-2">{type}</p>
                    <input type="number" value={config_gv[countField]} className="w-full bg-transparent border-b border-white/20 mb-2 text-white outline-none" readOnly />
                    <input type="number" step="0.1" placeholder="Điểm" className="w-full bg-transparent border-b border-white/20 text-emerald-400 outline-none" onChange={(e) => setConfig_gv({...config_gv, [scoreField]: parseFloat(e.target.value) || 0})} />
                  </div>
                );
              })}
            </div>

            <div className="relative group border-2 border-dashed border-slate-700 rounded-[2rem] p-12 text-center hover:border-emerald-500 transition-all cursor-pointer">
              <input type="file" accept=".docx" onChange={handleFileUpload_gv} className="absolute inset-0 opacity-0 cursor-pointer" />
              <i className="fa-solid fa-cloud-arrow-up text-5xl text-emerald-500 mb-4"></i>
              <h4 className="text-sm font-black uppercase">Tải đề 1201 (.docx)</h4>
            </div>

            <button onClick={handleSubmit_gv} className="w-full mt-8 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-black uppercase shadow-lg">Bắt đầu đẩy đề</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamCreator_gv;
