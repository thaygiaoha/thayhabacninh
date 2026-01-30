import React, { useState } from "react";
import { DANHGIA_URL, API_ROUTING } from "../config";
import mammoth from "mammoth";
const ExamCreatorGV = ({ onBack }) => {
  // --- STATE QUẢN LÝ XÁC MINH ---
  const [idnumber_gv, setIdnumber_gv] = useState("");
  const [isVerified_gv, setIsVerified_gv] = useState(false);
  const [gvInfo_gv, setGvInfo_gv] = useState(null);
  const [loading_gv, setLoading_gv] = useState(false);

  // --- STATE CẤU HÌNH ĐỀ (14 trường tương ứng sheet exams) ---
  const [config_gv, setConfig_gv] = useState({
    Exams: "",       // Mã đề
    fulltime: 90,   // Thời gian thi
    mintime: 15,    // Thời gian nộp sớm
    tab: 3,         // Số lần chuyển tab
    close: 0,       // Trạng thái đóng đề (0/1)
    imgURL: "",     // Link ảnh bìa
    MCQ: 0, scoremcq: 0, // Số câu & Điểm mỗi câu Trắc nghiệm
    TF: 0, scoretf: 0,   // Số câu & Điểm mỗi câu Đúng/Sai
    SA: 0, scoresa: 0    // Số câu & Điểm mỗi câu Trả lời ngắn
  });

  // --- HÀM XÁC MINH GIÁO VIÊN ---
  const verifyGV_gv = async () => {
    if (!idnumber_gv) return;
    setLoading_gv(true);
    try {
      const res = await fetch(`${DANHGIA_URL}?action=verifyGV_gv`, {
        method: "POST",
        body: JSON.stringify({ idnumber: idnumber_gv })
      }).then(r => r.json());

      if (res.status === "success") {
        setIsVerified_gv(true);
        setGvInfo_gv(res.data);
      } else {
        alert("ID không tồn tại!");
      }
    } catch (e) { alert("Lỗi kết nối!"); }
    setLoading_gv(false);
  };

  // --- HÀM GHI CẤU HÌNH VÀO SHEET EXAMS ---
  const saveConfig_gv = async () => {
    if (!config_gv.Exams) return alert("Nhập mã đề!");
    setLoading_gv(true);
    try {
      const payload = {
        action: "saveExamConfig_gv", // Nhánh ghi sheet exams
        config: { ...config_gv, idnumber: idnumber_gv }
      };
      // Fetch gửi lên Script...
      alert("Đã ghi cấu hình đề!");
    } catch (e) { alert("Lỗi ghi dữ liệu!"); }
    setLoading_gv(false);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto bg-white min-h-screen">
      <button onClick={onBack} className="mb-4 text-blue-600">← Quay lại</button>
      
      {!isVerified_gv ? (
        /* BẢNG NÚT NHẬP VÀ XÁC MINH */
        <div className="border p-6 rounded-xl shadow-md text-center">
          <h2 className="font-bold mb-4">XÁC MINH GIÁO VIÊN</h2>
          <input 
            className="border p-2 rounded w-full mb-4"
            placeholder="Nhập ID số (Ví dụ: 601)"
            value={idnumber_gv}
            onChange={(e) => setIdnumber_gv(e.target.value)}
          />
          <button onClick={verifyGV_gv} className="bg-blue-600 text-white px-6 py-2 rounded">
            {loading_gv ? "Đang quét..." : "XÁC MINH"}
          </button>
        </div>
      ) : (
        /* BẢNG NHẬP CẤU HÌNH ĐỀ (Ghi vào sheet exams) */
        <div className="border p-6 rounded-xl shadow-md bg-gray-50">
          <div className="flex items-center gap-3 mb-6">
            <img src={gvInfo_gv.img} className="w-12 h-12 rounded-full" />
            <h3 className="font-bold">GV: {gvInfo_gv.name}</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Mã đề" onChange={e => setConfig_gv({...config_gv, Exams: e.target.value})} className="border p-2 rounded"/>
            <input placeholder="Thời gian thi" type="number" onChange={e => setConfig_gv({...config_gv, fulltime: e.target.value})} className="border p-2 rounded"/>
            <input placeholder="Điểm 1 câu MCQ" type="number" onChange={e => setConfig_gv({...config_gv, scoremcq: e.target.value})} className="border p-2 rounded"/>
            {/* Tiếp tục các input khác cho TF, SA... */}
          </div>
          
          <button onClick={saveConfig_gv} className="mt-6 w-full bg-green-600 text-white py-3 rounded font-bold">
            GHI CẤU HÌNH ĐỀ (SHEET EXAMS)
          </button>
        </div>
      )}
    </div>
  );
};
