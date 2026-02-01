import { Question } from './types';
import { DANHGIA_URL, API_ROUTING } from './config';

// 1. Lưu trữ ngân hàng câu hỏi
export let questionsBank: Question[] = [];

// 2. Hàm nạp dữ liệu từ Google Sheet
export const fetchQuestionsBank = async (): Promise<Question[]> => {
  try {
    const response = await fetch(`${DANHGIA_URL}?action=getQuestions`);
    const result = await response.json();
    
    if (result.status === "success" && Array.isArray(result.data)) {
      // Ép kiểu classTag về string và trim để so sánh chính xác đuôi .c .d
      questionsBank = result.data.map(q => ({
        ...q,
        classTag: q.classTag ? q.classTag.toString().trim() : ""
      }));
      console.log(`✅ Đã nạp ${questionsBank.length} câu hỏi vào hệ thống.`);
      return questionsBank;
    } 
    return [];
  } catch (error) {
    console.error("❌ Lỗi kết nối ngân hàng câu hỏi:", error);
    return [];
  }
};

// 3. Hàm trộn mảng
const shuffleArray = <T>(array: T[]): T[] => {
  if (!array || array.length === 0) return [];
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

// 4. Hàm lấy đề thi thông minh
export const pickQuestionsSmart = (
  topicIds: (string | number)[], 
  counts: { mc: number[], tf: number[], sa: number[] },
  // Sử dụng đúng tên biến mcL3, mcL4... như trong types.ts thầy gửi
  levels: { 
    mcL3: number[], mcL4: number[], 
    tfL3: number[], tfL4: number[], 
    saL3: number[], saL4: number[] 
  }
) => {
  let selectedPart1: Question[] = [];
  let selectedPart2: Question[] = [];
  let selectedPart3: Question[] = [];
  
  if (questionsBank.length === 0) {
    console.warn("⚠️ Ngân hàng câu hỏi đang trống!");
    return [];
  }
  
  topicIds.forEach((tid, idx) => {
    const tidStr = tid.toString();
    
    // Lọc pool theo Topic (ví dụ 601 hoặc 601.c)
    const pool = questionsBank.filter(q => {
      const tag = q.classTag;
      return tag === tidStr || tag.startsWith(tidStr + ".");
    });
    
    const getSub = (type: string, l3: number, l4: number, total: number) => {
      const typePool = pool.filter(q => q.type === type);
      
      // Lọc đuôi chữ .c và .d từ Sheet thực tế của thầy
      const p4 = typePool.filter(q => q.classTag.endsWith(".d"));
      const p3 = typePool.filter(q => q.classTag.endsWith(".c"));
      
      // Lọc các câu mức 1, 2 (không có đuôi .c .d)
      const pOther = typePool.filter(q => 
        !q.classTag.endsWith(".c") && !q.classTag.endsWith(".d")
      );

      // Ưu tiên lấy câu mức độ 4 (.d)
      let res4 = shuffleArray(p4).slice(0, l4);
      let deficit4 = Math.max(0, l4 - res4.length); 
      
      // Lấy câu mức độ 3 (.c) bù vào chỗ thiếu của 4
      let res3 = shuffleArray(p3).slice(0, l3 + deficit4);
      
      let res = [...res4, ...res3];
      const remainingNeeded = total - res.length;
      
      // Lấy các câu còn lại cho đủ tổng số lượng
      if (remainingNeeded > 0) {
        res = [...res, ...shuffleArray(pOther).slice(0, remainingNeeded)];
      }
      return res;
    };

    // Truyền tham số từ levels vào (khớp chính xác với FixedConfig trong types.ts)
    selectedPart1 = [...selectedPart1, ...getSub('mcq', levels.mcL3[idx] || 0, levels.mcL4[idx] || 0, counts.mc[idx] || 0)];
    selectedPart2 = [...selectedPart2, ...getSub('true-false', levels.tfL3[idx] || 0, levels.tfL4[idx] || 0, counts.tf[idx] || 0)];
    selectedPart3 = [...selectedPart3, ...getSub('short-answer', levels.saL3[idx] || 0, levels.saL4[idx] || 0, counts.sa[idx] || 0)];
  });

  // Trộn đáp án/ý hỏi trước khi xuất xưởng
  return [...selectedPart1, ...selectedPart2, ...selectedPart3].map(q => {
    const newQ = { ...q };
    if (newQ.o && newQ.type === 'mcq') {
      newQ.shuffledOptions = shuffleArray(newQ.o);
    }
    if (newQ.s && newQ.type === 'true-false') {
      newQ.s = shuffleArray(newQ.s);
    }
    return newQ;
  });
};
