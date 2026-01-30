import React, { useState } from "react";
import { DANHGIA_URL, API_ROUTING } from "../config";
import mammoth from "mammoth";

export default function ExamCreator_gv() {
  // ================== STATE CHUNG ==================
  const [questions, setQuestions] = useState([]);

  // ================== XÁC MINH GV ==================
  const [verified_gv, setVerified_gv] = useState(false);
  const [idgv_gv, setIdgv_gv] = useState("");
  const [gvInfo_gv, setGvInfo_gv] = useState(null);
  const [loading_gv, setLoading_gv] = useState(false);
  const [error_gv, setError_gv] = useState("");

  const apiGV_gv = verified_gv ? API_ROUTING[idgv_gv] : null;

  const verifyGV_gv = async () => {
    if (!idgv_gv) return;

    setLoading_gv(true);
    setError_gv("");

    const res = await fetch(`${DANHGIA_URL}?action=verifyGV`, {
      method: "POST",
      body: JSON.stringify({
        idgv: idgv_gv,
      }),
    }).then((r) => r.json());

    setLoading_gv(false);

    if (res.status === "success") {
      setVerified_gv(true);
      setGvInfo_gv(res.data);
    } else {
      setError_gv("ID giáo viên không tồn tại hoặc đã bị khóa");
    }
  };

  // ================== UPLOAD WORD ==================
  const handleUpload_gv = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();

    const result = await mammoth.convertToHtml(
      { arrayBuffer },
      {
        convertImage: mammoth.images.inline((image) =>
          image.read("base64").then((imageBuffer) => ({
            src: `data:${image.contentType};base64,${imageBuffer}`,
          }))
        ),
      }
    );

    parseExam_gv(result.value);
  };

  // ================== PARSE ĐỀ WORD ==================
  const parseExam_gv = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const nodes = [...doc.body.children];

    let part = "";
    let currentQuestion = null;
    const result = [];

    nodes.forEach((node) => {
      const text = node.textContent.trim();

      if (text.startsWith("Phần I")) return (part = "I");
      if (text.startsWith("Phần II")) return (part = "II");
      if (text.startsWith("Phần III")) return (part = "III");

      if (/^Câu\s*\d+/i.test(text)) {
        currentQuestion = {
          part,
          question: text.replace(/^Câu\s*\d+[\.:]?\s*/i, ""),
          options: [],
          answer: part === "II" ? [] : "",
          explanation: "",
        };
        result.push(currentQuestion);
        return;
      }

      if (!currentQuestion) return;

      // Phần I: A. B. C. D.
      if (part === "I" && /^[A-D]\./.test(text)) {
        const correct = node.innerHTML.includes("<u>");
        currentQuestion.options.push({
          text: text.replace(/^[A-D]\.\s*/, ""),
          correct,
        });
        if (correct) currentQuestion.answer = text[0];
      }

      // Phần II: a) b) c)
      if (part === "II" && /^[a-d]\)/.test(text)) {
        const correct = node.innerHTML.includes("<u>");
        currentQuestion.options.push({
          text: text.replace(/^[a-d]\)\s*/, ""),
          correct,
        });
        if (correct) currentQuestion.answer.push(text[0]);
      }

      // Phần III: <key=...>
      if (part === "III") {
        const match = node.innerHTML.match(/<key\s*=\s*(.+?)>/i);
        if (match) currentQuestion.answer = match[1].trim();
      }

      // Lời giải
      if (text.startsWith("Lời giải")) {
        currentQuestion.explanation = "";
        return;
      }

      if (currentQuestion.explanation !== undefined) {
        currentQuestion.explanation += node.innerHTML;
      }
    });

    setQuestions(result);
  };

  // ================== CHUẨN HÓA GHI exam_data ==================
  const normalizeQuestions_gv = (raw) => {
    return raw.map((q) => ({
      part: q.part,
      type:
        q.part === "I"
          ? "mcq"
          : q.part === "II"
          ? "true-false"
          : "short-answer",
      question: q.question,
      options: q.options.length ? q.options.map((o) => o.text) : null,
      answer: q.answer,
      loigiai: q.explanation || "",
    }));
  };

  // ================== ĐẨY exam_data ==================
  const pushExamData_gv = async () => {
    if (!questions.length) return alert("Chưa có câu hỏi");

    const data = normalizeQuestions_gv(questions);

    const res = await fetch(apiGV_gv, {
      method: "POST",
      body: JSON.stringify({
        action: "pushExamData",
        data,
      }),
    }).then((r) => r.json());

    if (res.status === "success") {
      alert(`✅ Đã ghi ${data.length} câu vào exam_data`);
    } else {
      alert("❌ Lỗi ghi exam_data");
    }
  };

  // ================== LƯU exams (tạm demo) ==================
  const saveExamConfig_gv = async () => {
    const res = await fetch(apiGV_gv, {
      method: "POST",
      body: JSON.stringify({
        action: "saveExam",
        note: "Cấu hình đề (sẽ mở form sau)",
      }),
    }).then((r) => r.json());

    if (res.status === "success") {
      alert("✅ Đã lưu exams");
    } else {
      alert("❌ Lỗi lưu exams");
    }
  };
  // ===============Form exams======
  // ================== FORM EXAMS ==================
const [exams_gv, setExams_gv] = useState({
  Exams: "",
  IdNumber: "",
  fulltime: 45,
  mintime: 10,
  tab: 0,
  close: 0,
  imgURL: "",

  MCQ: 0,
  scoremcq: 0,

  TF: 0,
  scoretf: 0,

  SA: 0,
  scoresa: 0
});

const onChangeExams_gv = (key, value) => {
  setExams_gv(prev => ({
    ...prev,
    [key]: value
  }));
};


  // ================== RENDER ==================
  return (
    <div className="p-6 space-y-6">
      {!verified_gv && (
        <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-3xl shadow-xl">
          <h2 className="text-xl font-black mb-6 text-center">
            Xác minh Giáo viên
          </h2>

          <input
            className="w-full p-4 rounded-xl border"
            placeholder="Nhập ID giáo viên"
            value={idgv_gv}
            onChange={(e) => setIdgv_gv(e.target.value)}
          />

          {error_gv && (
            <div className="text-red-500 text-sm mt-3">{error_gv}</div>
          )}

          <button
            onClick={verifyGV_gv}
            disabled={loading_gv}
            className="w-full mt-6 bg-emerald-600 text-white p-4 rounded-xl font-black"
          >
            {loading_gv ? "Đang kiểm tra..." : "Xác minh"}
          </button>
        </div>
      )}

      {verified_gv && (
        <>
          <h2 className="text-xl font-bold">
            Tạo đề từ Word – {gvInfo_gv?.name || idgv_gv}
          </h2>

          <input type="file" accept=".docx" onChange={handleUpload_gv} />

          <div className="flex gap-4">
            <button
              onClick={saveExamConfig_gv}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black"
            >
              Lưu cấu hình đề (exams)
            </button>

            <button
              onClick={pushExamData_gv}
              className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black"
            >
              Đẩy câu hỏi (exam_data)
            </button>
          </div>

          <pre className="bg-gray-100 p-4 text-sm max-h-96 overflow-auto rounded-xl">
            {JSON.stringify(questions, null, 2)}
          </pre>
        </>
      )}
    </div>
  );
}
