import React, { useState, useMemo, useEffect } from 'react';
import { Question, Student, ExamCodeDefinition } from '../types';
import { API_ROUTING, DEFAULT_API_URL, TOPICS_DATA, EXAM_CODES } from '../config';
import { pickQuestionsSmart } from '../questions';

interface ExamPortalProps {
  grade: string | number; // Chấp nhận cả hai nhưng sẽ ép về string ngay
  onBack: () => void;
  onStart: (config: any, student: Student, examQuestions: Question[]) => void;
}

const ExamPortal: React.FC<ExamPortalProps> = ({ grade: rawGrade, onBack, onStart }) => {
  // 1. Đồng bộ hóa Grade ngay từ đầu
  const grade = useMemo(() => rawGrade.toString(), [rawGrade]);

  // 2. States
  const [selectedCode, setSelectedCode] = useState<string>("");
  const [idInput, setIdInput] = useState("");
  const [sbdInput, setSbdInput] = useState("");
  const [verifiedStudent, setVerifiedStudent] = useState<Student | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]); // Luôn là string[]
  const [dynamicCodes, setDynamicCodes] = useState<ExamCodeDefinition[]>([]);

  // 3. Helpers (Đã ép kiểu String chuẩn)
  const getRelatedGrades = (g: string) => {
    if (g === "12") return ["10", "11", "12"];
    if (g === "11") return ["10", "11"];
    if (g === "10") return ["10"];
    if (g === "9") return ["6", "7", "8", "9"];
    if (g === "8") return ["6", "7", "8"];
    if (g === "7") return ["6", "7"];
    if (g === "6") return ["6"];
    return [g];
  };

  const resolveCounts = (configValues: number[], targetTopics: string[]) => {
    if (!configValues || configValues.length === 0) return [];
    if (configValues.length === targetTopics.length) return configValues;
    const total = configValues[0] || 0;
    return targetTopics.map((_, i) => 
      Math.floor(total / targetTopics.length) + (i < total % targetTopics.length ? 1 : 0)
    );
  };

  // 4. Effects: Tải mã đề hệ thống
  useEffect(() => {
    const fetchSystemCodes = async () => {
      try {
        const url = new URL(DEFAULT_API_URL);
        url.searchParams.append("type", "getExamCodes");
        url.searchParams.append("idnumber", "SYSTEM");
        url.searchParams.append("grade", grade);
        const resp = await fetch(url.toString());
        const res = await resp.json();
        if (res.status === "success") setDynamicCodes(res.data);
      } catch (e) { console.error("Lỗi tải mã đề:", e); }
    };
    fetchSystemCodes();
  }, [grade]);

  // 5. Memos: Xử lý dữ liệu hiển thị
  const allAvailableCodes = useMemo(() => {
    const defaults = EXAM_CODES[grade] || [];
    const combined = [...defaults];
    dynamicCodes.forEach(dc => {
      if (!combined.find(c => c.code === dc.code)) combined.push(dc);
    });
    return combined;
  }, [grade, dynamicCodes]);

  const currentCodeDef = useMemo(() => 
    allAvailableCodes.find(c => c.code === selectedCode), 
  [selectedCode, allAvailableCodes]);

  const combinedTopics = useMemo(() => {
    const relatedGrades = getRelatedGrades(grade);
    let topics: { id: string; name: string; grade: string }[] = [];
    relatedGrades.forEach(g => {
      const gradeTopics = TOPICS_DATA[g] || [];
      topics = [...topics, ...gradeTopics.map(t => ({ 
        id: t.id.toString(), 
        name: t.name, 
        grade: g 
      }))];
    });
    return topics;
  }, [grade, TOPICS_DATA]);

  // 6. Handlers
  const handleVerify = async () => {
    if (!idInput || !sbdInput) return alert("Vui lòng nhập đủ ID Giáo viên và SBD!");
    setIsVerifying(true);
    try {
      const targetUrl = API_ROUTING[idInput.trim()] || DEFAULT_API_URL;
      const url = new URL(targetUrl);
      url.searchParams.append("type", "verifyStudent");
      url.searchParams.append("idnumber", idInput.trim());
      url.searchParams.append("sbd", sbdInput.trim());
      
      const resp = await fetch(url.toString());
      const result = await resp.json();
      
      if (result.status === "success") {
        setVerifiedStudent(result.data);
        // Tải thêm mã đề riêng của GV nếu có
        const matrixUrl = new URL(targetUrl);
        matrixUrl.searchParams.append("type", "getExamCodes");
        matrixUrl.searchParams.append("idnumber", idInput.trim());
        const mResp = await fetch(matrixUrl.toString());
        const mResult = await mResp.json();
        if (mResult.status === "success") {
          setDynamicCodes(prev => {
            const newCodes = [...prev];
            mResult.data.forEach((dc: ExamCodeDefinition) => {
              if (!newCodes.find(c => c.code === dc.code)) newCodes.push(dc);
            });
            return newCodes;
          });
        }
      } else { alert("Thất bại: " + result.message); }
    } catch (e) { alert("Lỗi kết nối máy chủ!"); } 
    finally { setIsVerifying(false); }
  };

  const handleStart = () => {
    if (!verifiedStudent || !selectedCode) return alert("Chưa chọn mã đề hoặc chưa xác minh!");
    const fc = currentCodeDef?.fixedConfig;
    if (!fc) return alert("Cấu hình đề thi bị lỗi!");

    const finalConfig = { 
      id: selectedCode, title: currentCodeDef.name, time: fc.duration, 
      mcqPoints: fc.scoreMC, tfPoints: fc.scoreTF, saPoints: fc.scoreSA, 
      gradingScheme: 1 
    };

    const topicsToPick = currentCodeDef.topics === 'manual' ? selectedTopics : (currentCodeDef.topics as string[]);
    if (!topicsToPick || topicsToPick.length === 0) return alert("Hãy chọn phạm vi kiến thức!");

    const examQuestions = pickQuestionsSmart(
      topicsToPick, 
      { mc: resolveCounts(fc.numMC, topicsToPick), tf: resolveCounts(fc.numTF, topicsToPick), sa: resolveCounts(fc.numSA, topicsToPick) }, 
      { mc3: resolveCounts(fc.mcL3, topicsToPick), mc4: resolveCounts(fc.mcL4, topicsToPick), tf3: resolveCounts(fc.tfL3, topicsToPick), tf4: resolveCounts(fc.tfL4, topicsToPick), sa3: resolveCounts(fc.saL3, topicsToPick), sa4: resolveCounts(fc.saL4, topicsToPick) }
    );

    if (examQuestions.length === 0) return alert("Ngân hàng đề hiện chưa đủ câu hỏi!");
    onStart(finalConfig, verifiedStudent, examQuestions);
  };

  const isVip = verifiedStudent?.taikhoanapp?.toUpperCase().includes("VIP");

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 font-sans">
      {/* Header */}
      <div className="bg-blue-700 p-8 text-white flex justify-between items-center border-b-8 border-blue-900">
        <div>
          <h2 className="text-3xl font-black uppercase">Xác Minh Danh Tính</h2>
          <p className="opacity-80 font-bold uppercase text-xs tracking-widest">Khối {grade} - Thiết lập bài thi</p>
        </div>
        <button onClick={onBack} className="bg-white/20 hover:bg-white/30 px-6 py-2 rounded-full font-black">QUAY LẠI</button>
      </div>

      <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Cột 1: Xác minh */}
        <div className="space-y-6">
          <h3 className="text-xl font-black border-l-8 border-blue-600 pl-4 uppercase">Thí sinh</h3>
          <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 space-y-4">
            <input type="text" placeholder="ID GIÁO VIÊN" className="w-full p-4 rounded-xl border font-black uppercase" value={idInput} onChange={e => setIdInput(e.target.value)} />
            <input type="text" placeholder="SỐ BÁO DANH" className="w-full p-4 rounded-xl border font-black uppercase" value={sbdInput} onChange={e => setSbdInput(e.target.value)} />
            <button onClick={handleVerify} disabled={isVerifying} className="w-full py-4 bg-blue-700 text-white rounded-xl font-black shadow-lg">
              {isVerifying ? 'ĐANG XÁC MINH...' : 'XÁC MINH'}
            </button>
           {/* Thẻ thông tin Thí sinh - Khôi phục giao diện cũ */}
{verifiedStudent && (
  <div className="p-6 bg-white border-2 border-blue-50 rounded-[2rem] shadow-sm space-y-4 animate-fade-in relative overflow-hidden">
    {/* Background icon trang trí ẩn dưới nền */}
    <i className="fas fa-user-graduate absolute -right-4 -bottom-4 text-slate-50 text-7xl rotate-12"></i>

    <div className="relative z-10">
      {/* Tên học sinh */}
      <h4 className="text-2xl font-black text-blue-900 uppercase mb-1 tracking-tight">
        {verifiedStudent.name}
      </h4>
      
      {/* Thông tin Lớp và SBD */}
      <p className="text-slate-600 font-bold flex items-center gap-2">
        <span className="bg-slate-100 px-2 py-0.5 rounded text-sm">Lớp: {verifiedStudent.class}</span>
        <span className="text-slate-300">|</span>
        <span className="bg-slate-100 px-2 py-0.5 rounded text-sm">SBD: {verifiedStudent.sbd}</span>
      </p>

      {/* Badge Tài khoản VIP */}
      <div className="mt-4">
        {isVip ? (
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full shadow-sm border border-amber-200">
            <i className="fas fa-crown text-xs"></i>
            <span className="text-xs font-black uppercase tracking-wider">Tài khoản VIP</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-500 px-4 py-1.5 rounded-full border border-slate-200">
            <i className="fas fa-user-circle text-xs"></i>
            <span className="text-xs font-black uppercase tracking-wider">Tài khoản Miễn phí</span>
          </div>
        )}
      </div>
    </div>

    {/* Thông số giới hạn - Hiển thị tinh tế phía dưới */}
    <div className="grid grid-cols-2 gap-2 pt-2 relative z-10">
      <div className="text-[10px] font-bold text-slate-400 uppercase">
        Lượt thi: <span className="text-blue-600">{verifiedStudent.limit}</span>
      </div>
      <div className="text-[10px] font-bold text-slate-400 uppercase">
        Tab giới hạn: <span className="text-blue-600">{verifiedStudent.limittab}</span>
      </div>
    </div>
  </div>
)}
          </div>
        </div>

        {/* Cột 2: Đề thi */}
        <div className="space-y-6">
          <h3 className="text-xl font-black border-l-8 border-blue-600 pl-4 uppercase">Đề thi</h3>
          <select className="w-full p-5 bg-slate-50 border-2 rounded-3xl font-black text-blue-800 outline-none" value={selectedCode} onChange={e => setSelectedCode(e.target.value)}>
            <option value="">-- CHỌN MÃ ĐỀ --</option>
            {allAvailableCodes.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
          {currentCodeDef?.fixedConfig && (
            <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 text-center space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white p-3 rounded-xl shadow-sm">
                  <span className="block text-xl font-black text-blue-700">{currentCodeDef.fixedConfig.duration}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Phút</span>
                </div>
                <div className="bg-white p-3 rounded-xl shadow-sm">
                  <span className="block text-xl font-black text-blue-700">
                    {(currentCodeDef.fixedConfig.numMC?.reduce((a, b) => a + b, 0) || 0) + 
                     (currentCodeDef.fixedConfig.numTF?.reduce((a, b) => a + b, 0) || 0) + 
                     (currentCodeDef.fixedConfig.numSA?.reduce((a, b) => a + b, 0) || 0)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Câu hỏi</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cột 3: Chuyên đề */}
        <div className="space-y-6">
          <h3 className="text-xl font-black border-l-8 border-blue-600 pl-4 uppercase">Kiến thức</h3>
          <div className="bg-slate-50 rounded-[2rem] p-4 border border-slate-200 h-[350px] overflow-y-auto no-scrollbar shadow-inner">
            {currentCodeDef?.topics === 'manual' ? (
              <div className="space-y-3">
                {combinedTopics.map(t => (
                  <label key={t.id} className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${selectedTopics.includes(t.id) ? 'bg-blue-600 border-blue-700 text-white' : 'bg-white border-white'}`}>
                    <input type="checkbox" className="hidden" checked={selectedTopics.includes(t.id)} onChange={() => setSelectedTopics(prev => prev.includes(t.id) ? prev.filter(i => i !== t.id) : [...prev, t.id])} />
                    <span className="text-[10px] font-black leading-tight">
                      <span className="bg-slate-200 text-slate-700 px-1 rounded mr-2 uppercase">K{t.grade}</span>
                      {t.name}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {(currentCodeDef?.topics as any[])?.map(tid => {
                  const tidStr = tid.toString();
                  let topic = null;
                  for (const g in TOPICS_DATA) {
                    topic = TOPICS_DATA[g].find(t => t.id.toString() === tidStr);
                    if (topic) break;
                  }
                  return topic ? (
                    <div key={tidStr} className="p-4 bg-white rounded-xl border border-blue-50 shadow-sm flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black text-[10px] shrink-0">{tidStr}</div>
                      <p className="text-[10px] font-black text-blue-900 leading-tight">{topic.name}</p>
                    </div>
                  ) : null;
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Button */}
      <div className="p-10 border-t bg-slate-50 flex justify-center">
        <button onClick={handleStart} disabled={!verifiedStudent || !selectedCode} className="w-full max-w-xl py-5 bg-blue-700 text-white rounded-full font-black text-xl hover:scale-105 transition-all shadow-xl disabled:opacity-50 border-b-8 border-blue-900">
          BẮT ĐẦU LÀM BÀI
        </button>
      </div>
    </div>
  );
};

export default ExamPortal;
