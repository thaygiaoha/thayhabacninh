import { DANHGIA_URL, API_ROUTING } from '../config';
import { AppUser, Student } from '../types';
import React, { useState, useEffect } from 'react';

const ExamCreator_gv = ({ onBack_gv, idgvAdmin_gv }) => {
  // State quản lý trạng thái xác minh
  const [isVerified_gv, setIsVerified_gv] = useState(false);
  const [gvName_gv, setGvName_gv] = useState("");
  
  // State quản lý cấu hình đề thi (Sắp xếp theo đúng thứ tự cột A-M trong Sheet Exams)
  const [config_gv, setConfig_gv] = useState({
    exams_gv: '',       // Cột A
    idNumber_gv: '',    // Cột B
    fulltime_gv: 90,    // Cột C
    mintime_gv: 15,     // Cột D
    tab_gv: 3,          // Cột E
    close_gv: '',       // Cột F
    imgURL_gv: '',      // Cột G
    mcqCount_gv: 0, mcqScore_gv: 0, // H, I
    tfCount_gv: 0, tfScore_gv: 0,   // J, K
    saCount_gv: 0, saScore_gv: 0    // L, M
  });

 const ExamCreator_gv = ({ onBack_gv }) => {
  const [dsGiaoVien_gv, setDsGiaoVien_gv] = useState([]);
  const [loading_gv, setLoading_gv] = useState(true);

  // LOAD DANH SÁCH GV NGAY KHI MỞ COMPONENT
  useEffect(() => {
    const loadIdGv = async () => {
      try {
        const resp = await fetch(`${DANHGIA_URL}?action=getIdGvList`);
        const result = await resp.json();
        if (result.status === 'success') {
          setDsGiaoVien_gv(result.data); // result.data chứa ID và imgURL
          console.log("✅ Đã nạp danh sách xác minh GV!");
        }
      } catch (err) {
        console.error("❌ Lỗi load IDGV:", err);
      } finally {
        setLoading_gv(false);
      }
    };
    loadIdGv();
  }, []);

  // HÀM XÁC MINH ID
 const handleVerify_gv = (idInput) => {
  const gvMatch = dsGiaoVien_gv.find(gv => String(gv.id) === String(idInput));
  
  if (gvMatch) {
    setIsVerified_gv(true);
    setGvName_gv(gvMatch.name);
    
    // Kiểm tra: Nếu gvMatch.img có dữ liệu thì lấy, không thì để chuỗi rỗng
    const initialImg = gvMatch.img ? gvMatch.img : ""; 
    
    setConfig_gv({ 
      ...config_gv, 
      idNumber_gv: idInput, 
      imgURL_gv: initialImg 
    });
  } else {
      setIsVerified_gv(false);
      alert("⚠️ ID này chưa được cấp quyền. Thầy liên hệ Admin: 0988.948.882 nhé!");
    }
  };

  // HÀM XỬ LÝ KHI NHẤN NÚT LƯU
  const handleSubmit_gv = async () => {
    if (!isVerified_gv) return alert("Thầy/cô cần xác minh ID trước!");
    // Logic gửi fetch sang Apps Script sẽ viết ở đây
    console.log("Dữ liệu chuẩn bị gửi đi:", config_gv);
  };

  return (
    <div className="p-4 md:p-8 bg-white rounded-[3rem] shadow-xl max-w-7xl mx-auto my-6 border border-slate-50 animate-in fade-in zoom-in duration-300">
      
      {/* HEADER COMPONENT */}
      <div className="flex justify-between items-center mb-8 px-4 border-b pb-6 border-slate-100">
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase italic flex items-center gap-2">
            <i className="fa-solid fa-file-shield text-emerald-500"></i>
            Hệ thống Kiến tạo đề thi (GV)
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
        <button 
          onClick={onBack_gv} 
          className="group flex items-center gap-2 p-3 px-6 rounded-2xl bg-red-50 text-red-500 font-bold text-xs hover:bg-red-500 hover:text-white transition-all shadow-sm"
        >
          <i className="fa-solid fa-circle-xmark group-hover:rotate-90 transition-transform"></i>
          THOÁT RA
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* CỘT TRÁI: CẤU HÌNH (THÔNG SỐ HÀNH CHÍNH) */}
        <div className="w-full lg:w-1/3 space-y-5 bg-slate-50 p-8 rounded-[2.5rem] border border-white shadow-inner">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <i className="fa-solid fa-id-card"></i> Bước 1: Thông tin quản lý
          </p>
          
          <div className="space-y-4">
            {/* Input IDGV */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 ml-3">MÃ XÁC MINH GV</label>
              <input 
                type="text"
                placeholder="Nhập ID để mở khóa..." 
                className="w-full mt-1 p-4 rounded-2xl border-2 border-transparent bg-white shadow-sm focus:border-emerald-500 focus:ring-0 transition-all font-black text-blue-600"
                onBlur={(e) => handleVerify_gv(e.target.value)}
              />
            </div>

            {/* Các ô khác sẽ bị khóa cho đến khi Verify */}
            <div className={`space-y-4 transition-all duration-500 ${isVerified_gv ? "opacity-100 scale-100" : "opacity-20 pointer-events-none scale-95"}`}>
              <input 
                placeholder="Tên mã đề thi..." 
                className="w-full p-4 rounded-2xl border-none shadow-sm font-bold"
                onChange={(e) => setConfig_gv({...config_gv, exams_gv: e.target.value})}
              />
              
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Phút làm bài" className="w-full p-4 rounded-2xl border-none shadow-sm font-bold" />
                <input type="number" placeholder="Số lần thoát Tab" className="w-full p-4 rounded-2xl border-none shadow-sm font-bold" />
              </div>

              <input 
                placeholder="imgURL (Thư mục ảnh)..." 
                className="w-full p-4 rounded-2xl border-none shadow-sm text-[10px] font-mono"
                value={config_gv.imgURL_gv}
                onChange={(e) => setConfig_gv({...config_gv, imgURL_gv: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: RUỘT ĐỀ (ĐIỂM SỐ & FILE) */}
        <div className={`w-full lg:w-2/3 space-y-6 transition-all duration-700 ${isVerified_gv ? "translate-x-0 opacity-100" : "translate-x-10 opacity-10"}`}>
          <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
            {/* Họa tiết trang trí */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <i className="fa-solid fa-list-check"></i> Bước 2: Cấu trúc & Tải tệp
            </p>
            
            {/* BẢNG ĐIỂM 3 PHẦN */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {['MCQ', 'TF', 'SA'].map((type) => (
                <div key={type} className="bg-white/5 p-4 rounded-2xl border border-white/10 hover:border-emerald-500/50 transition-colors">
                  <p className="text-[10px] font-black text-emerald-500 mb-2">{type} (Phần {type === 'MCQ' ? 'I' : type === 'TF' ? 'II' : 'III'})</p>
                  <input type="number" placeholder="Câu" className="w-full bg-transparent border-b border-white/20 focus:border-emerald-500 outline-none mb-3 text-sm font-bold" />
                  <input type="number" step="0.1" placeholder="Điểm" className="w-full bg-transparent border-b border-white/20 focus:border-emerald-500 outline-none text-sm font-bold" />
                </div>
              ))}
            </div>

            {/* DROPZONE FILE WORD */}
            <div className="relative group border-2 border-dashed border-slate-700 rounded-[2rem] p-12 text-center hover:border-emerald-500 hover:bg-emerald-500/5 transition-all cursor-pointer">
              <input type="file" accept=".docx" className="absolute inset-0 opacity-0 cursor-pointer" />
              <i className="fa-solid fa-cloud-arrow-up text-5xl text-emerald-500 mb-4 group-hover:scale-110 transition-transform"></i>
              <h4 className="text-sm font-black uppercase tracking-tight">Tải đề Word (.docx)</h4>
              <p className="text-[10px] text-slate-500 mt-2 font-medium italic">Hệ thống sẽ tự động bóc tách Câu hỏi, Đáp án và Hình ảnh</p>
            </div>

            {/* NÚT SUBMIT */}
            <button 
              onClick={handleSubmit_gv}
              className="w-full mt-8 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-900/40 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase text-sm tracking-widest"
            >
              <i className="fa-solid fa-rocket"></i>
              Bắt đầu đẩy đề lên hệ thống
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ExamCreator_gv;
