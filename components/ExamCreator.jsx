import React, { useState } from "react";
import mammoth from "mammoth";

export default function ExamCreator() {
  const [html, setHtml] = useState("");
  const [questions, setQuestions] = useState([]);

  // 1. Upload file Word
  const handleUpload = async (e) => {
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
    parseExam(result.value);
  };

  // 2. Parse đề
  const parseExam = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const nodes = [...doc.body.children];

    let part = "";
    let currentQuestion = null;
    const result = [];

    nodes.forEach((node) => {
      const text = node.textContent.trim();

      // --- XÁC ĐỊNH PHẦN ---
      if (text.startsWith("Phần I")) {
        part = "I";
        return;
      }
      if (text.startsWith("Phần II")) {
        part = "II";
        return;
      }
      if (text.startsWith("Phần III")) {
        part = "III";
        return;
      }

      // --- CÂU HỎI ---
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

      // --- PHẦN I: A B C D ---
      if (part === "I" && /^[A-D]\./.test(text)) {
        const isCorrect = node.innerHTML.includes("<u>");
        currentQuestion.options.push({
          label: text[0],
          text,
          correct: isCorrect,
        });
        if (isCorrect) currentQuestion.answer = text[0];
        return;
      }

      // --- PHẦN II: a b c d ---
      if (part === "II" && /^[a-d]\)/.test(text)) {
        const isCorrect = node.innerHTML.includes("<u>");
        currentQuestion.options.push({
          label: text[0],
          text,
          correct: isCorrect,
        });
        if (isCorrect) currentQuestion.answer.push(text[0]);
        return;
      }

      // --- PHẦN III: <key=...> ---
      if (part === "III") {
        const match = node.innerHTML.match(/<key\s*=\s*(.+?)>/i);
        if (match) {
          currentQuestion.answer = match[1];
        }
      }

      // --- LỜI GIẢI ---
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

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-bold">Tạo đề thi từ Word</h2>

      <input type="file" accept=".docx" onChange={handleUpload} />

      <pre className="bg-gray-100 p-4 text-sm max-h-96 overflow-auto">
        {JSON.stringify(questions, null, 2)}
      </pre>
    </div>
  );
}

