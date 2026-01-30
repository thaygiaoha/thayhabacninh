import React, { useState } from "react";
import { DANHGIA_URL, API_ROUTING } from "../config";
import mammoth from "mammoth";
// import ExamForm_gv from "./ExamForm_gv"; // nhớ tạo hoặc comment tạm

export default function ExamCreator_gv() {
  const [html, setHtml] = useState("");
  const [questions, setQuestions] = useState([]);

  const [verified_gv, setVerified_gv] = useState(false);
  const [idgv_gv, setIdgv_gv] = useState("");
  const [gvInfo_gv, setGvInfo_gv] = useState(null);
  const [loading_gv, setLoading_gv] = useState(false);
  const [error_gv, setError_gv] = useState("");

  const apiGV_gv = verified_gv ? API_ROUTING[idgv_gv] : null;

  // ================== XÁC MINH GV ==================
  const verifyGV_gv = async () => {
    if (!idgv_gv) return;

    setLoading_gv(true);
    setError_gv("");

    const res = await fetch(DANHGIA_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "verifyGV",
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

    setHtml(result.value);
    parseExam_gv(result.value);
  };

  // ================== PARSE ĐỀ ==================
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
          question: text,
          options: [],
          answer: part === "II" ? [] : "",
          explanation: "",
        };
        result.push(currentQuestion);
        return;
      }

      if (!currentQuestion) return;

      if (part === "I" && /^[A-D]\./.test(text)) {
        const correct = node.innerHTML.includes("<u>");
        currentQuestion.options.push({ text, correct });
        if (correct) currentQuestion.answer = text[0];
      }

      if (part === "II" && /^[a-d]\)/.test(text)) {
        const correct = node.innerHTML.includes("<u>");
        currentQuestion.options.push({ text, correct });
        if (correct) currentQuestion.answer.push(text[0]);
      }

      if (part === "III") {
        const match = node.innerHTML.match(/<key\s*=\s*(.+?)>/i);
        if (match) currentQuestion.answer = match[1];
      }

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
  // ==========Cấu hình đề thi=======
  const saveExam_gv = async () => {
  if (!apiGV_gv) return alert("Chưa xác minh GV");

  const payload = {
    action: "saveExam",
    idExam,
    idNumber,
    fulltime,
    mintime,
    tab,
    close,
    imgURL,
    MCQ,
    scoreMCQ,
    TF,
    scoreTF,
    SA,
    scoreSA
  };

  const res = await fetch(apiGV_gv, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(payload)
  }).then(r => r.json());

  if (res.status === "success") {
    alert("✅ Đã cấu hình đề thi");
  } else {
    alert("❌ Lỗi tạo cấu hình đề");
  }
};
  // =========
  const pushExamData_gv = async () => {
  if (!questions.length) {
    alert("Chưa có câu hỏi từ Word");
    return;
  }

  const normalized = normalizeQuestions_gv(questions);

  const res = await fetch(API_ROUTING[idgv_gv], {
    method: "POST",
    body: JSON.stringify({
      action: "pushExamData",
      idExam: examId_gv,
      data: normalized
    })
  }).then(r => r.json());

  if (res.status === "success") {
    alert(`✅ Đã ghi ${normalized.length} câu vào exam_data`);
  } else {
    alert("❌ Lỗi ghi exam_data");
  }
};



  // ================
  const normalizeQuestions_gv = (rawQuestions) => {
  return rawQuestions.map(q => {
    return {
      part: q.part,                 // I | II | III
      type:
        q.part === "I" ? "mcq" :
        q.part === "II" ? "true-false" :
        "short-answer",

      question: q.question
        .replace(/^Câu\s*\d+[\.:]?\s*/i, "") // XOÁ "Câu x"

      options:
        q.options && q.options.length
          ? q.options.map(o => o.text.replace(/^[A-Da-d][\.\)]\s*/, ""))
          : null,

      answer: q.answer,
      loigiai: q.explanation || ""
    };
  });
};
// ==============
const saveExamConfig_gv = async () => {
  setLoading_gv(true);

  const payload = {
    action: "saveExam",
    idgv: idgv_gv,
    data: {
      IdExam: examId_gv,
      IdNumber: idNumber_gv,
      fulltime: fulltime_gv,
      mintime: mintime_gv,
      tab: tabLimit_gv,
      close: closeTab_gv,
      imgURL: imgURL_gv,

      MCQ: mcqCount_gv,
      scoremcq: scoreMcq_gv,
      TF: tfCount_gv,
      scoretf: scoreTf_gv,
      SA: saCount_gv,
      scoresa: scoreSa_gv
    }
  };

  const res = await fetch(API_ROUTING[idgv_gv], {
    method: "POST",
    body: JSON.stringify(payload)
  }).then(r => r.json());

  setLoading_gv(false);

  if (res.status === "success") {
    alert("✅ Đã lưu cấu hình đề thi");
  } else {
    alert("❌ Lỗi lưu exams");
  }
};
// ===============





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
          <h2 className="text-xl font-bold">Tạo đề thi từ Word</h2>
          <input type="file" accept=".docx" onChange={handleUpload_gv} />

          <pre className="bg-gray-100 p-4 text-sm max-h-96 overflow-auto">
            {JSON.stringify(questions, null, 2)}
          </pre>
        </>
      )}
    </div>
  );
}
<button
  onClick={saveExamConfig_gv}
  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black"
>
  Lưu cấu hình đề thi
</button>
<button
  onClick={pushExamData_gv}
  className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black"
>
  Đẩy câu hỏi lên đề thi
</button>



export default ExamCreator_gv;
