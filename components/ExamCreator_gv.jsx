import React, { useState } from "react";
import { DANHGIA_URL, API_ROUTING } from "../config";
import mammoth from "mammoth";

export default function ExamCreator_gv() {
  const [questions, setQuestions] = useState([]);
  const [verified_gv, setVerified_gv] = useState(false);
  const [idgv_gv, setIdgv_gv] = useState("");
  const [gvInfo_gv, setGvInfo_gv] = useState(null);
  const [loading_gv, setLoading_gv] = useState(false);
  const [error_gv, setError_gv] = useState("");

  const [exams_gv, setExams_gv] = useState({
    Exams: "", IdNumber: "", fulltime: 45, mintime: 10,
    tab: 0, close: 0, imgURL: "",
    MCQ: 0, scoremcq: 0, TF: 0, scoretf: 0, SA: 0, scoresa: 0
  });

  const apiGV_gv = verified_gv ? API_ROUTING[idgv_gv] : null;

  const onChangeExams_gv = (key, value) => {
    setExams_gv(prev => ({ ...prev, [key]: value }));
  };

  // --- MATHTYPE & IMAGE LOGIC ---
  const convertMathTypeToBase64 = (base64Str) => {
    const binary = atob(base64Str);
    const latexMatch = binary.match(/(\$|\\begin\{equation\}|\\\[)(.*?)(\$|\\end\{equation\}|\\\])/);
    return latexMatch ? latexMatch[0] : null;
  };

  const handleUpload_gv = async (e) => {
    const file = e.target.files[0];
    if (!file || !exams_gv.Exams) return alert("Thầy nhập mã đề trước nhé!");

    const reader = new FileReader();
    reader.onload = async (event) => {
      const arrayBuffer = event.target.result;
      let tempImages = [];
      let imageCounter = 0;
      const dateStr = "300126"; 

      const options = {
        convertImage: mammoth.images.inline((element) => {
          return element.read("base64").then((imageBuffer) => {
            const latex = convertMathTypeToBase64(imageBuffer);
            if (latex) return { src: "", alt: latex };

            imageCounter++;
            const placeholder = `[[IMG_${imageCounter}]]`;
            tempImages.push({
              placeholder,
              name: `${exams_gv.Exams}.${dateStr}.${imageCounter}`,
              base64: imageBuffer,
              type: element.contentType
            });
            return { src: placeholder, alt: "hinh_ve" };
          });
        })
      };

      try {
        setLoading_gv(true);
        const result = await mammoth.convertToHtml({ arrayBuffer }, options);
        let html = result.value.replace(/<img[^>]+alt="([^"]+)"[^>]*>/g, (m, alt) => alt === "hinh_ve" ? m : alt);

        // Upload to Drive
        if (tempImages.length > 0) {
          const resImg = await fetch(apiGV_gv, {
            method: "POST",
            body: JSON.stringify({
              action: "uploadImagesToDrive",
              folderId: exams_gv.imgURL,
              images: tempImages
            })
          }).then(r => r.json());

          if (resImg.status === "success") {
            Object.keys(resImg.links).forEach(key => {
              html = html.replace(key, resImg.links[key]);
            });
          }
        }
        parseExam_gv(html);
      } catch (err) { alert("Lỗi: " + err.message); }
      finally { setLoading_gv(false); }
    };
    reader.readAsArrayBuffer(file);
  };

  const parseExam_gv = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const nodes = [...doc.body.children];
    let part = "";
    let result = [];
    let currentQuestion = null;

    nodes.forEach((node) => {
      const text = node.textContent.trim();
      if (text.startsWith("Phần I")) return (part = "I");
      if (text.startsWith("Phần II")) return (part = "II");
      if (text.startsWith("Phần III")) return (part = "III");

      if (/^Câu\s*\d+/i.test(text)) {
        currentQuestion = {
          part,
          question: node.innerHTML.replace(/^Câu\s*\d+[\.:]?\s*/i, ""),
          options: [],
          answer: part === "II" ? [] : "",
          explanation: "",
        };
        result.push(currentQuestion);
        return;
      }

      if (!currentQuestion) return;

      if (part === "I" && /^[A-D]\./.test(text)) {
        if (node.innerHTML.includes("<u>")) currentQuestion.answer = text[0];
        currentQuestion.options.push(node.innerHTML.replace(/^[A-D]\.\s*/, ""));
      } else if (part === "II" && /^[a-d]\)/.test(text)) {
        if (node.innerHTML.includes("<u>")) currentQuestion.answer.push(text[0]);
        currentQuestion.options.push(node.innerHTML.replace(/^[a-d]\)\s*/, ""));
      } else if (part === "III" && node.innerHTML.includes("<key=")) {
        const m = node.innerHTML.match(/<key\s*=\s*(.+?)>/i);
        if (m) currentQuestion.answer = m[1].trim();
      } else if (text.startsWith("Lời giải")) {
        currentQuestion.explanation = " ";
      } else {
        if (currentQuestion.explanation) currentQuestion.explanation += node.innerHTML;
        else currentQuestion.question += node.innerHTML;
      }
    });
    setQuestions(result);
  };

  const verifyGV_gv = async () => {
    setLoading_gv(true);
    const res = await fetch(`${DANHGIA_URL}?action=verifyGV_gv`, {
      method: "POST",
      body: JSON.stringify({ idgv: idgv_gv }),
    }).then(r => r.json());
    setLoading_gv(false);
    if (res.status === "success") { setVerified_gv(true); setGvInfo_gv(res.data); }
    else setError_gv("ID không tồn tại");
  };

  const saveAll_gv = async () => {
    setLoading_gv(true);
    try {
      const payload = {
        action: "saveFullExam",
        examConfig: { ...exams_gv, IdNumber: idgv_gv, 
          MCQ: questions.filter(q => q.part === "I").length,
          TF: questions.filter(q => q.part === "II").length,
          SA: questions.filter(q => q.part === "III").length
        },
        examQuestions: questions.map(q => ({
          part: q.part, type: q.part === "I" ? "mcq" : q.part === "II" ? "true-false" : "short-answer",
          question: q.question, options: q.options.length ? q.options : null,
          answer: q.answer, loigiai: q.explanation 
        }))
      };
      const res = await fetch(apiGV_gv, { method: "POST", body: JSON.stringify(payload) }).then(r => r.text());
      alert(res === "OK" ? "🚀 Thành công rực rỡ!" : "❌ Lỗi: " + res);
    } catch (e) { alert("Lỗi: " + e.message); }
    setLoading_gv(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto font-sans">
      {!verified_gv ? (
        <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-3xl shadow-2xl border text-center">
          <h2 className="text-2xl font-black mb-6">Xác minh Giáo viên</h2>
          <input className="w-full p-4 rounded-xl border-2 mb-4 focus:border-emerald-500 outline-none" placeholder="Nhập ID" value={idgv_gv} onChange={(e) => setIdgv_gv(e.target.value)} />
          {error_gv && <p className="text-red-500 text-sm mb-4">{error_gv}</p>}
          <button onClick={verifyGV_gv} className="w-full bg-emerald-600 text-white p-4 rounded-xl font-black shadow-lg">XÁC MINH NGAY</button>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-end bg-gradient-to-r from-emerald-600 to-teal-600 p-8 rounded-3xl text-white shadow-xl">
            <div>
              <p className="text-emerald-100 font-bold uppercase tracking-widest text-xs">Giáo viên: {gvInfo_gv?.name}</p>
              <h2 className="text-3xl font-black">Cấu hình Đề thi</h2>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-70">Mã GV: {idgv_gv}</p>
              <p className="font-mono text-xl">{exams_gv.Exams || "####"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400">MÃ ĐỀ (ID BIẾN ĐỔI)</label>
                  <input className="w-full p-3 bg-slate-50 border rounded-xl font-bold" value={exams_gv.Exams} onChange={e => onChangeExams_gv("Exams", e.target.value)} placeholder="VD: 601" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400">TỔNG TG (PHÚT)</label>
                  <input className="w-full p-3 bg-slate-50 border rounded-xl font-bold" type="number" value={exams_gv.fulltime} onChange={e => onChangeExams_gv("fulltime", e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400">TG TỐI THIỂU</label>
                  <input className="w-full p-3 bg-slate-50 border rounded-xl font-bold" type="number" value={exams_gv.mintime} onChange={e => onChangeExams_gv("mintime", e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400">THOÁT TAB</label>
                  <input className="w-full p-3 bg-slate-50 border rounded-xl font-bold" type="number" value={exams_gv.tab} onChange={e => onChangeExams_gv("tab", e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400">ĐÓNG ĐỀ (0/1)</label>
                  <input className="w-full p-3 bg-slate-50 border rounded-xl font-bold" type="number" value={exams_gv.close} onChange={e => onChangeExams_gv("close", e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400">LINK FOLDER DRIVE ẢNH</label>
                  <input className="w-full p-3 bg-slate-50 border rounded-xl text-xs" value={exams_gv.imgURL} onChange={e => onChangeExams_gv("imgURL", e.target.value)} placeholder="Dán link folder tại đây" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t pt-6">
                <div className="bg-blue-50 p-4 rounded-2xl">
                  <label className="text-[10px] font-black text-blue-600 block mb-1">ĐIỂM PHẦN I</label>
                  <input type="number" step="0.25" className="w-full bg-transparent text-xl font-black outline-none" value={exams_gv.scoremcq} onChange={e => onChangeExams_gv("scoremcq", e.target.value)} />
                </div>
                <div className="bg-emerald-50 p-4 rounded-2xl">
                  <label className="text-[10px] font-black text-emerald-600 block mb-1">ĐIỂM PHẦN II</label>
                  <input type="number" step="0.25" className="w-full bg-transparent text-xl font-black outline-none" value={exams_gv.scoretf} onChange={e => onChangeExams_gv("scoretf", e.target.value)} />
                </div>
                <div className="bg-orange-50 p-4 rounded-2xl">
                  <label className="text-[10px] font-black text-orange-600 block mb-1">ĐIỂM PHẦN III</label>
                  <input type="number" step="0.25" className="w-full bg-transparent text-xl font-black outline-none" value={exams_gv.scoresa} onChange={e => onChangeExams_gv("scoresa", e.target.value)} />
                </div>
              </div>

              <div className="p-4 border-2 border-dashed rounded-2xl flex items-center justify-between bg-slate-50">
                <span className="text-sm font-bold text-slate-500">TẢI FILE WORD (.DOCX)</span>
                <input type="file" accept=".docx" onChange={handleUpload_gv} className="text-xs" />
              </div>

              <button onClick={saveAll_gv} disabled={loading_gv || questions.length === 0} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xl hover:bg-black transition shadow-2xl disabled:bg-slate-200 disabled:text-slate-400">
                {loading_gv ? "ĐANG LÀM VIỆC..." : "XÁC NHẬN & ĐẨY ĐỀ LÊN CLOUD"}
              </button>
            </div>

            <div className="bg-slate-900 rounded-3xl p-6 shadow-inner h-fit max-h-[700px] overflow-auto">
              <h3 className="text-emerald-400 font-black mb-4 flex justify-between items-center text-sm">
                <span>DỮ LIỆU ĐÃ QUÉT</span>
                <span className="bg-emerald-400/20 px-3 py-1 rounded-full">{questions.length} CÂU</span>
              </h3>
              <pre className="text-emerald-400 text-[9px] font-mono leading-tight">
                {JSON.stringify(questions, null, 2)}
              </pre>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
