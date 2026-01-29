import { Question } from './types';
import { DANHGIA_URL } from './config';

export let questionsBank: Question[] = [];

// 1. Nạp dữ liệu từ Google Sheets (5 cột: A, B, C, D, E)
export const fetchQuestionsBank = async (): Promise<Question[]> => {
  try {
    const response = await fetch(`${DANHGIA_URL}?action=getQuestions`);
    const result = await response.json();
    
    if (result.status === "success" && Array.isArray(result.data)) {
      questionsBank = result.data.map((item: any) => {
        const id = item[0]?.toString() || "";
        let type: 'mcq' | 'true-false' | 'short-answer' = 'mcq';
        if (id.toLowerCase().includes('tf')) type = 'true-false';
        else if (id.toLowerCase().includes('sa')) type = 'short-answer';

        return {
          id: id,
          classTag: item[1] || "",
          question: item[2] || "",
          datetime: item[3] || "",
          loigiai: item[4] || "", // Vẫn nạp LG để thầy dùng ở giao diện chính
          type: type
        } as Question;
      });
      console.log(`✅ Nạp ${questionsBank.length} câu.`);
      return questionsBank;
    } 
    return [];
  } catch (error) {
    return [];
  }
};

const shuffleArray = <T>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

// 2. Lấy đề thi (Cơ chế nới lỏng mức độ để tránh lỗi thiếu câu)
export const pickQuestionsSmart = (
  topicIds: string[], 
  counts: { mc: number[], tf: number[], sa: number[] },
  levels: { mc3: number[], mc4: number[], tf3: number[], tf4: number[], sa3: number[], sa4: number[] }
) => {
  let selectedPart1: Question[] = [];
  let selectedPart2: Question[] = [];
  let selectedPart3: Question[] = [];
  
  if (questionsBank.length === 0) return [];
  
  topicIds.forEach((tid, idx) => {
    const tidStr = tid.toString();
    const pool = questionsBank.filter(q => q.classTag.toString().startsWith(tidStr));
    
    const getSub = (type: string, l3: number, l4: number, total: number) => {
      const typePool = pool.filter(q => q.type === type);
      if (typePool.length === 0) return [];

      // Lọc theo đuôi mức độ
      const p4 = typePool.filter(q => q.classTag.toString().endsWith(".4"));
      const p3 = typePool.filter(q => q.classTag.toString().endsWith(".3"));
      const pOther = typePool.filter(q => !q.classTag.toString().endsWith(".3") && !q.classTag.toString().endsWith(".4"));

      let res4 = shuffleArray(p4).slice(0, l4);
      let res3 = shuffleArray(p3).slice(0, l3 + (l4 - res4.length)); // Lấy bù nếu thiếu mức 4
      
      let res = [...res4, ...res3];
      let remaining = total - res.length;
      
      // Nếu vẫn thiếu, lấy nốt trong kho còn lại của chuyên đề đó
      if (remaining > 0) {
        res = [...res, ...shuffleArray(pOther).slice(0, remaining)];
      }
      
      // CƠ CHẾ CHỐNG LỖI: Nếu vẫn chưa đủ, lấy bất kỳ câu nào cùng loại trong chuyên đề
      if (res.length < total) {
        const stillNeeded = total - res.length;
        const backup = typePool.filter(q => !res.find(r => r.id === q.id));
        res = [...res, ...shuffleArray(backup).slice(0, stillNeeded)];
      }

      return res;
    };

    selectedPart1 = [...selectedPart1, ...getSub('mcq', levels.mc3[idx] || 0, levels.mc4[idx] || 0, counts.mc[idx] || 0)];
    selectedPart2 = [...selectedPart2, ...getSub('true-false', levels.tf3[idx] || 0, levels.tf4[idx] || 0, counts.tf[idx] || 0)];
    selectedPart3 = [...selectedPart3, ...getSub('short-answer', levels.sa3[idx] || 0, levels.sa4[idx] || 0, counts.sa[idx] || 0)];
  });

  return [...selectedPart1, ...selectedPart2, ...selectedPart3].map(q => {
    const newQ = { ...q };
    if (newQ.o && newQ.type === 'mcq') newQ.shuffledOptions = shuffleArray(newQ.o);
    if (newQ.s && newQ.type === 'true-false') newQ.s = shuffleArray(newQ.s);
    return newQ;
  });
};
