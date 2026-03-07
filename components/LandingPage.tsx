import React, { useState, useEffect } from 'react';
import { DANHGIA_URL, ADMIN_CONFIG, OTHER_APPS, API_ROUTING } from '../config';
import { AppUser, Student } from '../types';
import { postToScript } from '../postToScript';

interface LandingPageProps {
  onSelectGrade: (grade: number) => void;
  onSelectQuiz: (num: number, pts: number, quizStudent: Partial<Student>) => void;
  user: AppUser | null;
  onOpenAuth: () => void;
  onOpenVip: () => void;
  setView: (mode: 'matran' | 'cauhoi' | 'word' | 'admin') => void;
  onOpenTeacherTask: () => void;
  showQuizModal: { num: number, pts: number } | null; // Nhận từ App
  setShowQuizModal: (val: { num: number, pts: number } | null) => void;
}
interface UserAcc {
  phoneNumber: string;
  vip: string;
}
const LandingPage: React.FC<LandingPageProps> = ({
  showQuizModal, 
  setShowQuizModal,
  onSelectGrade,
  onSelectQuiz,
  user,
  onOpenAuth,
  onOpenVip,
  onOpenTeacherTask,
  setView
}) => {
  // --- GIỮ NGUYÊN TOÀN BỘ LOGIC DỮ LIỆU CỦA THẦY ---
  const REDIRECT_LINKS: Record<string, string> = { "default": "https://www.facebook.com/hoctoanthayha.bg" };
  
  const [showAppList, setShowAppList] = useState(false);
  const [isOtherBank, setIsOtherBank] = useState(false);
  const [quizMode, setQuizMode] = useState<'free' | 'gift' | null>(null);
  const [inputPassword, setInputPassword] = useState('');
  const [currentImg, setCurrentImg] = useState(0);
  
  const [quizInfo, setQuizInfo] = useState({ name: '', class: '', school: '', phone: '' });
  const [bankInfo, setBankInfo] = useState({ stk: '', bankName: '' });
  const [serverPassword, setServerPassword] = useState("");
  const [isOtherSchool, setIsOtherSchool] = useState(false);
  const [isOtherClass, setIsOtherClass] = useState(false);
  const [showVipOptions, setShowVipOptions] = useState(false);
  const [showVipBenefits, setShowVipBenefits] = useState(false);
  const [showLichOptions, setshowLichOptions] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [isMatrixOpen, setIsMatrixOpen] = useState(false); // Đóng/mở bảng ma trận
  const [loadingMatrix, setLoadingMatrix] = useState(false); //
  const [idgv, setIdgv] = useState('');
 
  const [searchId, setSearchId] = useState('');
  const [foundLG, setFoundLG] = useState(null);
  const [showModal, setShowModal] = useState(false); 

 const [loadingLG, setLoadingLG] = useState(false); // Để hiện trạng thái đang tìm
  const toArray = (v: any) => {
  if (Array.isArray(v)) return v;
  if (!v) return [];
  return v
    .toString()
    .split(',')
    .map(x => x.trim())
    .filter(x => x !== '')
    .map(x => isNaN(Number(x)) ? x : Number(x));
};

  
  const [maTranForm, setMaTranForm] = useState({
  makiemtra: '',
  name: '',
  duration: '',
  topics: '',
  numMC: '',
  scoreMC: '',
  mcL3: '',
  mcL4: '',
  numTF: '',
  scoreTF: '',
  tfL3: '',
  tfL4: '',
  numSA: '',
  scoreSA: '',
  saL3: '',
  saL4: ''
});
  
 // Thầy đảm bảo có chữ async ở đây
// Thầy đảm bảo có chữ async ở đây

 // 1. Khai báo state để chứa danh sách ứng dụng
const [extraApps, setExtraApps] = useState([]);
  const [useracc, setUseracc] = useState<UserAcc | null>(null);
const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
const [authForm, setAuthForm] = useState({ phone: '', pass: '' });
const [subjectData, setSubjectData] = useState<any[]>([]); // Lưu toàn bộ hàng từ sheet chọn môn
const [dynamicSubjects, setDynamicSubjects] = useState<string[]>([]); // Danh sách môn duy nhất
const [dynamicLevels, setDynamicLevels] = useState<string[]>([]); // Danh sách cấp học duy nhất
  // ảnh và tin tức
  const [carouselImages, setCarouselImages] = useState<string[]>([]);
const [newsList, setNewsList] = useState<{t: string, l: string}[]>([]);
  useEffect(() => {
  if (window.MathJax && foundLG) {
    window.MathJax.typesetPromise();
  }
}, [foundLG]);
  useEffect(() => {
  const fetchContentData = async () => {
    try {
      const sheetId = '16w4EzHhTyS1CnTfJOWE7QQNM0o2mMQIqePpPK8TEYrg'; // ID file admin của thầy
      const gid = '1501357631'; // THẦY THAY GID CỦA SHEET linkimg VÀO ĐÂY
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;

      const response = await fetch(url);
      const data = await response.text();
      const rows = data.split('\n').slice(1);

      const parsedImages: string[] = [];
      const parsedNews: {t: string, l: string}[] = [];      

      rows.forEach(row => {
        const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/"/g, '').trim());        
        // Cột A: Link ảnh (linkimg)
        if (cols[0]) parsedImages.push(cols[0]);
                // Cột B: Tên tin tức (tentinuc), Cột C: Link tin tức (linktintuc)
        if (cols[1]) {
          parsedNews.push({ t: cols[1], l: cols[2] || "#" });
        }
      });
      setCarouselImages(parsedImages);
      setNewsList(parsedNews);
    } catch (error) {
      console.error("Lỗi tải ảnh và tin tức:", error);
    }
  };
  fetchContentData();
}, []);
const handleSaveMatrix = async () => {
  if (!idgv) {
    alert("❌ Lỗi: Không xác định được ID Giáo viên!");
    return;
  }

  // Tự động chọn Link Script dựa trên mã IDGV (8888 hoặc 9999)
  const targetURL = API_ROUTING[idgv] || DANHGIA_URL;

  const payload = {
    gvId: idgv,
    makiemtra: maTranForm.makiemtra,
    name: maTranForm.name,
    duration: maTranForm.duration,
    topics: maTranForm.topics,
    numMC: maTranForm.numMC,
    scoreMC: maTranForm.scoreMC,
    mcL3: maTranForm.mcL3,
    mcL4: maTranForm.mcL4,
    numTF: maTranForm.numTF,
    scoreTF: maTranForm.scoreTF,
    tfL3: maTranForm.tfL3,
    tfL4: maTranForm.tfL4,
    numSA: maTranForm.numSA,
    scoreSA: maTranForm.scoreSA,
    saL3: maTranForm.saL3,
    saL4: maTranForm.saL4
  };

  try {
    // ⚠️ QUAN TRỌNG: Phải có ?action=saveMatrix trên URL
    const response = await fetch(`${targetURL}?action=saveMatrix`, {
      method: "POST",
      mode: "cors", // Chuyển về cors để nhận dữ liệu trả về
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload)
    });

    const result = await response.json(); // Đợi Script trả về kết quả JSON

    if (result.status === "success") {
      alert(result.message); // Hiện thông báo xanh từ Script
    } else {
      alert("⚠️ Lỗi Script: " + result.message);
    }
  } catch (e) {
    console.error(e);
    alert("❌ Lỗi kết nối! Dữ liệu có thể đã ghi nhưng không nhận được phản hồi.");
  }
};
  // Tìm câu hỏi
const handleSearchLG = async () => {
  if (!searchId) return alert("Nhập mã ID đã thầy ơi!");
  setLoadingLG(true);
  try {
    const response = await fetch(`${DANHGIA_URL}?action=getLG&id=${searchId}`);
    const text = await response.text();
    
    // Tìm phần nội dung sau "a:" và bóc tách nó ra khỏi dấu ngoặc kép
    const match = text.match(/a\s*:\s*["']([\s\S]*)["']\s*}/) || text.match(/loigiai\s*:\s*["']([\s\S]*)["']/);
    
    if (match && match[1]) {
      setFoundLG(match[1].trim()); // Chỉ lấy nội dung thuần túy
    } else {
      setFoundLG(text.replace(/["'{}]/g, "").trim()); // Nếu không khớp, xóa hết ký tự rác
    }
  } catch (error) {
    setFoundLG("Lỗi kết nối máy chủ!");
  } finally {
    setLoadingLG(false);
  }
};
const handleAuth = async (e: React.FormEvent) => {
  e.preventDefault();
  const url = `${DANHGIA_URL}?action=${authMode}&phone=${authForm.phone}&pass=${authForm.pass}`;
  
  try {
    const res = await fetch(url);
    const text = await res.text();
    
    if (authMode === 'register') {
      if (text === 'success') {
        alert("🎉 Đăng ký thành công! Giờ em có thể đăng nhập.");
        setAuthMode('login');
      } else if (text === 'exists') {
        alert("⚠️ Số điện thoại này đã được đăng ký rồi!");
      }
    } else {
      try {
        const data = JSON.parse(text);
        if (data.status === 'success') {
          const userData = { phoneNumber: data.phoneNumber, vip: data.vip };
          setUseracc(userData);
          localStorage.setItem('useracc_session', JSON.stringify(userData));
          setAuthMode(null);
        }
      } catch {
        alert("❌ Sai số điện thoại hoặc mật khẩu!");
      }
    }
  } catch (err) {
    alert("🚀 Lỗi kết nối máy chủ, vui lòng thử lại!");
  }
};
  // chọn môn
  useEffect(() => {

  const fetchSubjects = async () => {

    try {

      const sheetId = '16w4EzHhTyS1CnTfJOWE7QQNM0o2mMQIqePpPK8TEYrg';
      const gid = '1221175482';
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;    

      const response = await fetch(url);

      const data = await response.text();      

      // Tách các hàng

      const rows = data.split('\n').slice(1);       

      const parsedData = rows.map(row => {

        // Regex này giúp tách chuẩn CSV ngay cả khi có dấu phẩy nằm trong ngoặc kép

        const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/"/g, '').trim());

        return { 
          mon: cols[0], 
          caphoc: cols[1], 
          chonmon: cols[2], 
          link: cols[3] 
        };
      }).filter(item => item.mon && item.mon !== ""); // Lọc bỏ hàng trống
      setSubjectData(parsedData);   

      // Lấy danh sách Môn học (Cột A)
      const mons = [...new Set(parsedData.map(item => item.mon))].filter(Boolean);

      setDynamicSubjects(mons);      

      // Lấy danh sách Cấp học (Cột B)
      const caps = [...new Set(parsedData.map(item => item.caphoc))].filter(Boolean);
      setDynamicLevels(caps);
      console.log("Dữ liệu môn học đã tải:", parsedData); // Thầy F12 xem có hiện data chưa
    } catch (error) {
      console.error("Lỗi lấy dữ liệu môn học:", error);
    }
  };
  fetchSubjects();
}, []);
  

// 2. Trong useEffect hiện có của bạn, hãy thêm đoạn này:
  useEffect(() => {
  const saved = localStorage.getItem('useracc_session');
  if (saved) setUseracc(JSON.parse(saved));
}, []);
useEffect(() => {
  const fetchOtherApps = async () => {
    try {
      // Sử dụng DANHGIA_URL của bạn
      const response = await fetch(`${DANHGIA_URL}?sheet=ungdung`);
      const data = await response.json();
      
      // Kiểm tra nếu data là mảng thì mới set
      if (Array.isArray(data)) {
        setExtraApps(data);
      }
    } catch (error) {
      console.error("Lỗi lấy dữ liệu ứng dụng:", error);
    }
  };
  fetchOtherApps();
}, [DANHGIA_URL]); // Thêm DANHGIA_URL vào dependency để an toàn
  
  const [stats, setStats] = useState<{ ratings: Record<number, number>, top10: any[] }>({
    ratings: {},
    top10: []
  });
  const [schedules, setSchedules] = useState<{ grade: string, time: string }[]>([]);
useEffect(() => {
const fetchSchedules = async () => {
try {
// Thay YOUR_SHEET_ID và tên sheet 'lichhoc' vào link dưới
const sheetId = '16w4EzHhTyS1CnTfJOWE7QQNM0o2mMQIqePpPK8TEYrg'; 
const sheetName = 'lichhoc';
const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
const response = await fetch(url);
const data = await response.text();
// Chuyển đổi CSV sang mảng Object
const rows = data.split('\n').slice(1); // Bỏ dòng tiêu đề đầu tiên
const parsedSchedules = rows.map(row => {
// Tách cột bằng dấu phẩy, loại bỏ dấu ngoặc kép thừa
const cols = row.split(',').map(c => c.replace(/"/g, '').trim());
return { grade: cols[0], time: cols[1] };
}).filter(item => item.grade); // Lọc bỏ dòng trống
setSchedules(parsedSchedules);
} catch (error) {
console.error("Lỗi lấy lịch học:", error);
}
};
fetchSchedules();
}, []);


  // --- CÁC HÀM XỬ LÝ ---
  // lấy ảnh logo
 useEffect(() => {
  // Nếu chưa tải xong ảnh từ Sheet thì không chạy đếm giây
  if (carouselImages.length === 0) return;

  const interval = setInterval(() => {
    setCurrentImg(prev => (prev + 1) % carouselImages.length);
  }, 4000);

  return () => clearInterval(interval);
}, [carouselImages]); // Sẽ chạy lại mỗi khi danh sách ảnh từ Sheet thay đổi

  useEffect(() => {
    const fetchTop10 = async () => {
      try {
        const res = await fetch(`${DANHGIA_URL}?type=top10`);
        const json = await res.json();
        const data = json.data || json;
        if (Array.isArray(data)) setStats(prev => ({ ...prev, top10: data }));
      } catch (e) { console.error("Lỗi lấy dữ liệu Top 10:", e); }
    };
    fetchTop10();
    const interval = setInterval(fetchTop10, 60000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    const fetchPassword = async () => {
      try {
        const res = await fetch(`${DANHGIA_URL}?type=getPass`);
        const data = await res.json();
        if (data?.password) setServerPassword(data.password.toString());
      } catch (e) {
        console.error("Lỗi lấy mật khẩu:", e);
      }
    };
    fetchPassword();
  }, []);

  const handleStartQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (quizMode === 'gift' && inputPassword !== serverPassword) return alert("Mật khẩu sai!");
    onSelectQuiz(showQuizModal!.num, showQuizModal!.pts, {
      ...quizInfo,
      phoneNumber: quizInfo.phone,
      stk: quizMode === 'gift' ? bankInfo.stk : "Tự do",
      bank: quizMode === 'gift' ? bankInfo.bankName : "Tự do",
      className: quizInfo.class,
      school: quizInfo.school
    });
    setShowQuizModal(null);
  };
// hàm chọn môn khác
const handleRedirect = () => {
  // Hàm chuẩn hóa cực mạnh: Xóa khoảng trắng, chuyển chữ thường, đưa về cùng một chuẩn Unicode (NFC)
  const normalize = (str) => 
    (str || "").toString().normalize("NFC").toLowerCase().trim();

  const userMon = normalize(selectedSubject);
  const userCap = normalize(selectedLevel);

  // Tìm trong data
  const match = subjectData.find(item => {
    const sheetMon = normalize(item.mon);
    const sheetCap = normalize(item.caphoc);
    return sheetMon === userMon && sheetCap === userCap;
  });

  if (match && match.link && match.link.toLowerCase().startsWith('http')) {
    window.open(match.link.trim(), '_blank');
  } else {
    // Nếu vẫn không khớp (rất hiếm), thử so sánh với cột C (chonmon)
    const userCombined = normalize(`${selectedSubject}-${selectedLevel}`);
    const matchCombined = subjectData.find(item => normalize(item.chonmon) === userCombined);
    
    if (matchCombined && matchCombined.link) {
      window.open(matchCombined.link.trim(), '_blank');
    } else {
      // Trường hợp cuối cùng không thấy thì về Facebook
      window.open("https://www.facebook.com/hoctoanthayha.bg", '_blank');
      console.log("Thử mọi cách vẫn không khớp:", userMon, userCap);
    }
  }
  
  setShowSubjectModal(false);
};

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12 overflow-x-hidden">
      
     {/* 1. TOP NAV (Style SmartEdu - Đã tích hợp VIP lấp lánh) */}
      <div className="bg-white/90 backdrop-blur-md sticky top-0 z-[100] border-b border-slate-200 px-6 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-blue-100">
               <i className="fas fa-graduation-cap"></i>
            </div>
            <span className="text-2xl font-black text-slate-800 tracking-tighter">Smart<span className="text-blue-600">Edu</span></span>
          </div>

          <div className="flex gap-3 items-center">
             {/* Nếu CHƯA đăng nhập */}
             {!useracc ? (
               <button 
                onClick={() => setAuthMode('login')} 
                className="bg-slate-100 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-full text-[11px] font-black uppercase transition-all"
               >
                 Học sinh đăng nhập
               </button>
             ) : (
               /* Nếu ĐÃ đăng nhập: Hiện số điện thoại và VIP lấp lánh */
               <div className={`relative px-4 py-2 rounded-full text-[11px] font-black uppercase transition-all flex items-center gap-2 shadow-sm border ${
                 useracc.vip !== "VIP0" 
                 ? "bg-gradient-to-r from-yellow-400 via-orange-300 to-yellow-400 text-red-900 border-yellow-500 animate-pulse shadow-yellow-100 ring-2 ring-yellow-200" 
                 : "bg-slate-100 text-slate-600 border-slate-200"
               }`}>
                 
                 {/* Icon vương miện cho VIP */}
                 {useracc.vip !== "VIP0" && <i className="fas fa-crown text-orange-600 drop-shadow-sm"></i>}
                 
                 <span>{useracc.phoneNumber} <span className="opacity-60">[{useracc.vip}]</span></span>

                 {/* Nút đăng xuất nhanh */}
                 <button 
                   onClick={() => {setUseracc(null); localStorage.removeItem('useracc_session');}}
                   className="ml-1 hover:text-red-500 transition-colors"
                 >
                   <i className="fas fa-power-off"></i>
                 </button>

                 {/* Hiệu ứng Shimmer tia sáng chạy qua cho VIP */}
                {/* Hiệu ứng tia sáng chạy qua nếu là VIP */}
                {useracc.vip !== "VIP0" && (
              <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              <div className="w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-shimmer"></div>
            </div>
              )}
               </div>
             )}
          </div>
        </div>
      </div>
      {/* 2. MARQUEE (Chữ chạy) */}
      <div className="bg-blue-700 py-2 overflow-hidden">
        <div className="whitespace-nowrap text-white font-bold uppercase text-[14px] tracking-widest animate-marquee inline-block">
          ⭐ Chúc các em ôn tập tốt và luôn làm chủ kiến thức! ⭐ Thầy cô liên hệ: 0988.948.882 để được hướng dẫn tạo Web miễn phí!
        </div>
      </div>

      {/* 3. LAYOUT CHÍNH */}
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* CỘT TRÁI: MENU CHỨC NĂNG (NÚT + LABEL) */}
        <div className="lg:col-span-3 flex flex-col gap-3 order-2 lg:order-1">
          <div className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1">Tiện ích học tập</div>
          
          <button onClick={() => window.open("https://forms.gle/5ZAbDHHAbaDz2u959", '_blank')} className="group flex items-center justify-between w-full p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-blue-200 transition-all active:scale-95">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs"><i className="fas fa-users"></i></div>
              <span className="text-[13px] font-black text-slate-700 uppercase text-left">Đăng ký học Toán</span>
            </div>
            <span className="text-[8px] font-black px-2 py-1 rounded-md text-white uppercase bg-indigo-600">Hot</span>
          </button>

          <button onClick={() => window.open("https://new-chat-bot-two.vercel.app/", '_blank')} className="group flex items-center justify-between w-full p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-200 transition-all active:scale-95">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500 w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs"><i className="fas fa-robot"></i></div>
              <span className="text-[13px] font-black text-slate-700 uppercase text-left">Trợ lý học tập AI</span>
            </div>
            <span className="text-[8px] font-black px-2 py-1 rounded-md text-white uppercase bg-indigo-500">AI</span>
          </button>

          <button onClick={() => setShowSubjectModal(true)} className="group flex items-center justify-between w-full p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-purple-200 transition-all active:scale-95">
            <div className="flex items-center gap-3">
              <div className="bg-purple-600 w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs"><i className="fas fa-book"></i></div>
              <span className="text-[13px] font-black text-slate-700 uppercase text-left">Chọn môn học khác</span>
            </div>
            <span className="text-[8px] font-black px-2 py-1 rounded-md text-white uppercase bg-purple-600">New</span>
          </button>

          <button onClick={() => setshowLichOptions(true)} className="group flex items-center justify-between w-full p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-purple-200 transition-all active:scale-95">
            <div className="flex items-center gap-3">
              <div className="bg-purple-500 w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs"><i className="fas fa-calendar-alt"></i></div>
              <span className="text-[13px] font-black text-slate-700 uppercase text-left">Lịch học Toán</span>
            </div>
            <span className="text-[8px] font-black px-2 py-1 rounded-md text-white uppercase bg-purple-500">Schedules</span>
          </button>

          <button onClick={() => setShowVipOptions(true)} className="group flex items-center justify-between w-full p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-amber-200 transition-all active:scale-95">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500 w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs"><i className="fas fa-gem"></i></div>
              <span className="text-[13px] font-black text-slate-700 uppercase text-left">Nâng cấp VIP</span>
            </div>
            <span className="text-[8px] font-black px-2 py-1 rounded-md text-white uppercase bg-amber-500">Vip</span>
          </button>

       {/* ỨNG DỤNG KHÁC - CLICK ĐỂ HIỆN LIST */}
          <div className="relative mt-2">
            <button 
              onClick={() => setShowAppList(!showAppList)}
              className="flex items-center justify-between w-full p-4 bg-teal-600 text-white rounded-2xl shadow-lg border-b-4 border-teal-800 transition-all active:scale-95"
            >
              <div className="flex items-center gap-3">
                <i className="fas fa-th-large"></i>
                <span className="text-[13px] font-black uppercase">Ứng dụng khác</span>
              </div>
              <i className={`fas fa-chevron-${showAppList ? 'down' : 'right'} text-xs opacity-50 transition-transform`}></i>
            </button>

            {/* List hiện lên khi showAppList = true */}
            {showAppList && (
              <div className="absolute left-0 bottom-full mb-3 w-full bg-white rounded-2xl shadow-2xl border border-slate-100 z-[110] p-2 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between items-center p-2 border-b border-slate-50 mb-1">
                   <span className="text-[9px] font-bold text-slate-400 uppercase ml-2">Danh sách ứng dụng</span>
                   <button onClick={() => setShowAppList(false)} className="text-slate-300 hover:text-red-500">
                     <i className="fas fa-times text-xs"></i>
                   </button>
                </div>
                
                {extraApps.length > 0 ? (
                  extraApps.map((app, idx) => (
                    <a 
                      key={idx} 
                      href={app.link} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex items-center gap-3 p-3 hover:bg-teal-50 rounded-xl transition-colors group"
                    >
                      <i className={`${app.icon || 'fas fa-link'} text-teal-600 w-5 text-center`}></i>
                      <span className="text-[10px] font-black text-slate-700 uppercase group-hover:text-teal-700">{app.name}</span>
                    </a>
                  ))
                ) : (
                  <div className="p-4 text-center text-[10px] font-bold text-slate-400 italic">
                    Đang tải dữ liệu...
                  </div>
                )}
              </div>
            )}
          </div>
        </div> {/* Đóng cột trái lg:col-span-3 */}

      {/* CỘT GIỮA: CAROUSEL & TIN TỨC */}
<div className="lg:col-span-6 flex flex-col gap-6 order-1 lg:order-2">
  {/* PHẦN CAROUSEL */}
  <div className="relative h-[380px] rounded-[2.5rem] overflow-hidden shadow-2xl border-[6px] border-white bg-slate-100">
    {carouselImages.length > 0 ? (
      carouselImages.map((img, idx) => (
        <img 
          key={idx} 
          src={img} 
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === (currentImg % carouselImages.length) ? 'opacity-100' : 'opacity-0'}`} 
          alt="Carousel" 
        />
      ))
    ) : (
      <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-bold">
        Đang tải ảnh...
      </div>
    )}
    
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
    <div className="absolute bottom-8 left-8 text-white">
       <div className="bg-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase mb-2 inline-block shadow-lg">Khơi nguồn đam mê</div>
       <h2 className="text-2xl font-black uppercase leading-tight">Toán học là môn thể dục của trí tuệ!</h2>
    </div>
  </div>

  {/* PHẦN TIN TỨC */}
  <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
     <h3 className="text-blue-600 font-black text-xs uppercase mb-4 flex items-center gap-2">
        <i className="fas fa-newspaper"></i> Thông tin & Sự kiện mới
     </h3>
     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {newsList.length > 0 ? (
          newsList.map((item, i) => (
            <a 
              key={i} 
              href={item.l} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-2 p-2 rounded-xl hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all group"
            >
               <div className="w-1.5 h-1.5 rounded-full bg-red-500 group-hover:scale-150 transition-transform"></div>
               <span className="text-[12px] font-bold text-slate-700 truncate">{item.t}</span>
            </a>
          ))
        ) : (
          <div className="text-slate-400 text-xs italic p-2 italic">
            Đang cập nhật tin tức mới nhất...
          </div>
        )}
     </div>
  </div>
</div>       

     {/* CỘT PHẢI: QUIZ & TOP 10 (VUỐT) */}
        <div className="lg:col-span-3 flex flex-col gap-4 order-3">
          {/* CỤM NÚT ĐIỀU KHIỂN */}
          <div className="bg-white p-4 rounded-[2rem] shadow-lg border border-slate-100 flex flex-col gap-3">
            <button onClick={() => setShowQuizModal({num: 20, pts: 0.5})} className="w-full bg-orange-500 text-white p-4 rounded-2xl font-black text-xs uppercase shadow-lg border-b-4 border-orange-700 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2">
              <i className="fas fa-gift animate-bounce"></i> SĂN QUÀ QUIZ
            </button>
            <button className="w-full bg-blue-500 text-white p-4 rounded-2xl font-black text-xs uppercase shadow-lg border-b-4 border-blue-800 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2">
              <i className="fas fa-gamepad animate-bounce"></i> Làm bài kiểm tra
            </button>
           <div className="grid grid-cols-2 gap-2">
  {/* 3 Nút chọn lớp 10, 11, 12 */}
  {[10, 11, 12].map(g => (
    <button 
      key={g} 
      onClick={() => onSelectGrade(g)} 
      className="bg-blue-600 text-white p-2.5 rounded-xl font-black text-[10px] uppercase border-b-4 border-blue-800 transition-all active:scale-95 flex items-center justify-center gap-2"
    >
      <i className="fas fa-graduation-cap text-[10px]"></i> 
      <span>Lớp {g}</span>
    </button>
  ))}

  {/* Nút Lời giải - Ngang hàng và bằng kích thước */}
  <button 
    onClick={() => setShowModal(true)}
    className="bg-orange-500 text-white p-2.5 rounded-xl font-black text-[10px] uppercase border-b-4 border-orange-700 transition-all active:scale-95 flex items-center justify-center gap-2"
  >
    <i className="fas fa-search text-[10px]"></i> 
    <span>Lời giải</span>
  </button>
</div>

            {/* QUẢN TRỊ */}
            <div className="mt-4 pt-6 border-t border-slate-100 flex flex-col gap-3 w-full">
              <button onClick={() => setView('word')} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4 rounded-2xl font-black text-xs uppercase shadow-lg border-b-4 border-emerald-800 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 group">
                <i className="fas fa-chalkboard-teacher text-lg"></i>
                <div className="flex flex-col items-start text-left">
                  <span className="leading-none mb-1 text-[11px]">Tạo đề từ Word</span>
                  <span className="text-[7px] opacity-70 uppercase">Cần xác minh Giáo viên!!</span>
                </div>
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setIsMatrixOpen(true)} className="p-3 bg-white border-2 border-emerald-50 rounded-2xl hover:border-emerald-500 transition-all shadow-sm flex flex-col items-center gap-1">
                  <i className="fas fa-th-large text-emerald-600"></i>
                  <span className="text-[8px] font-black uppercase">Tạo Ma Trận Đề</span>
                </button>
                <button onClick={() => setView('cauhoi')} className="p-3 bg-white border-2 border-rose-50 rounded-2xl hover:border-rose-500 transition-all shadow-sm flex flex-col items-center gap-1">
                  <i className="fas fa-database text-rose-600"></i>
                  <span className="text-[8px] font-black uppercase">Ngân Hàng Câu Hỏi</span>
                </button>
              </div>
            </div>
          </div>

          {/* TOP 10 CAO THỦ */}
          <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden flex flex-col h-[480px]">
            <div className="bg-slate-900 p-4 text-white font-black text-[10px] uppercase text-center tracking-widest flex items-center justify-center gap-2 font-black">
              <i className="fas fa-crown text-yellow-400"></i> Bảng Vàng Cao Thủ
            </div>
            <div className="p-2 space-y-2 flex-grow overflow-y-auto no-scrollbar scroll-smooth bg-slate-50/50">
              {stats.top10 && stats.top10.length > 0 ? stats.top10.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm transition-transform active:scale-95">
                  <div className={`w-8 text-center text-[14px] font-black ${index < 3 ? 'text-yellow-600' : 'text-slate-300'}`}>{index + 1}</div>
                  <div className="flex-1 overflow-hidden">
                    <div className="text-[11px] font-black uppercase truncate text-slate-700">{item.name}</div>
                    <div className="text-[9px] text-slate-400 font-bold italic">{item.idPhone}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[12px] font-black text-red-600">{item.score} đ</div>
                    <div className="text-[8px] text-slate-400">{item.time}s</div>
                  </div>
                </div>
              )) : <div className="p-10 text-center text-xs font-bold text-slate-300 uppercase">Đang tải...</div>}
            </div>
          </div>
        </div>
      </div>

      {/* --- CÁC MODAL GIỮ NGUYÊN LOGIC CŨ --- */}
     {/* 5. MODALS */}

{isMatrixOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            
            {/* Header: Tiêu đề và nút đóng */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-5 flex justify-between items-center text-white">
                <div>
                    <h2 className="text-2xl font-bold">⚙️ Thiết Lập Ma Trận Đề Thi</h2>
                    <p className="text-blue-100 text-sm">Nhập thông tin đề thi và cấu hình các chuyên đề </p>
                </div>
                <button onClick={() => setIsMatrixOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            {/* Body: Nội dung cuộn được */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* KHỐI 1: THÔNG TIN CHUNG */}
                    <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <h3 className="font-bold text-blue-800 flex items-center gap-2 border-b pb-2">
                            <span className="bg-blue-100 p-1 rounded">01</span> Thông tin cơ bản
                        </h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mã kiểm tra (Ví dụ: KTTX1)</label>
                            <input 
                                value={maTranForm.makiemtra} 
                                onChange={e => setMaTranForm({...maTranForm, makiemtra: e.target.value})}
                                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="Nhập mã định danh đề..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tên kỳ thi</label>
                            <input 
                                value={maTranForm.name} 
                                onChange={e => setMaTranForm({...maTranForm, name: e.target.value})}
                                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Ví dụ: Kiểm tra giữa kỳ 1"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian (phút)</label>
                                <input type="number" value={maTranForm.duration} onChange={e => setMaTranForm({...maTranForm, duration: e.target.value})} className="w-full p-2.5 border rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 font-bold text-blue-600">Mã số Giáo viên</label>
                                <input 
                                    value={idgv} 
                                    onChange={e => setIdgv(e.target.value)}
                                    className="w-full p-2.5 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white outline-none text-sm" 
                                    placeholder="Ví dụ: GV99-2026-XYZ" 
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-blue-700 mb-1 font-bold">Danh sách chuyên đề (Cách nhau dấu phẩy)</label>
                            <textarea 
                                value={maTranForm.topics} 
                                onChange={e => setMaTranForm({...maTranForm, topics: e.target.value})}
                                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                                placeholder="1001, 1002, 1003..."
                            />
                        </div>
                      {/* Ảnh minh họa cho đẹp giao diện */}
          <div className="mt-4 rounded-lg overflow-hidden border border-gray-200 shadow-inner group">
      <img 
        src="https://img.freepik.com/free-vector/online-education-concept-illustration_114360-8438.jpg" 
        alt="Education Illustration" 
        className="w-full h-32 object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
    />
</div>
                    </div>

                    {/* KHỐI 2: CẤU HÌNH SỐ LƯỢNG CÂU HỎI */}
                    <div className="space-y-4 p-4 bg-indigo-50/30 rounded-xl border border-indigo-100">
                        <h3 className="font-bold text-indigo-800 flex items-center gap-2 border-b pb-2">
                            <span className="bg-indigo-100 p-1 rounded">02</span> Cấu hình câu hỏi của đề
                        </h3>

                        {/* Phần trắc nghiệm 4 lựa chọn */}
                        <div className="p-2 bg-white rounded-lg border border-indigo-100 shadow-sm">
                            <p className="text-xs font-bold text-indigo-600 mb-2 uppercase tracking-wider">Trắc nghiệm MC (Phần I)</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-gray-500 block mb-1">Số câu hỏi (numMC)</label>
                                    <input value={maTranForm.numMC} onChange={e => setMaTranForm({...maTranForm, numMC: e.target.value})} className="w-full p-1.5 border rounded text-sm outline-none" placeholder="Ví dụ: 5, 5, 5"/>
                                </div>
                                <div>
                                    <label className="text-[11px] text-gray-500 block mb-1">Điểm mỗi câu (scoreMC)</label>
                                    <input value={maTranForm.scoreMC} onChange={e => setMaTranForm({...maTranForm, scoreMC: e.target.value})} className="w-full p-1.5 border rounded text-sm outline-none" placeholder="0.25"/>
                                </div>
                                <div>
                                    <label className="text-[11px] text-gray-500 block mb-1">Mức L3 (mcL3)</label>
                                    <input value={maTranForm.mcL3} onChange={e => setMaTranForm({...maTranForm, mcL3: e.target.value})} className="w-full p-1.5 border rounded text-sm outline-none" />
                                </div>
                                <div>
                                    <label className="text-[11px] text-gray-500 block mb-1">Mức L4 (mcL4)</label>
                                    <input value={maTranForm.mcL4} onChange={e => setMaTranForm({...maTranForm, mcL4: e.target.value})} className="w-full p-1.5 border rounded text-sm outline-none" />
                                </div>
                            </div>
                        </div>

                        {/* Phần Đúng Sai */}
                        <div className="p-2 bg-white rounded-lg border border-indigo-100 shadow-sm">
                            <p className="text-xs font-bold text-green-600 mb-2 uppercase tracking-wider">Trắc nghiệm TF (Phần II)</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-gray-500 block mb-1">Số câu hỏi (numTF)</label>
                                    <input value={maTranForm.numTF} onChange={e => setMaTranForm({...maTranForm, numTF: e.target.value})} className="w-full p-1.5 border rounded text-sm outline-none" />
                                </div>
                                <div>
                                    <label className="text-[11px] text-gray-500 block mb-1">Điểm mỗi câu (scoreTF)</label>
                                    <input value={maTranForm.scoreTF} onChange={e => setMaTranForm({...maTranForm, scoreTF: e.target.value})} className="w-full p-1.5 border rounded text-sm outline-none" />
                                </div>
                                <div>
                                    <label className="text-[11px] text-gray-500 block mb-1">Mức L3 (tfL3)</label>
                                    <input value={maTranForm.tfL3} onChange={e => setMaTranForm({...maTranForm, tfL3: e.target.value})} className="w-full p-1.5 border rounded text-sm outline-none" />
                                </div>
                                <div>
                                    <label className="text-[11px] text-gray-500 block mb-1">Mức L4 (tfL4)</label>
                                    <input value={maTranForm.tfL4} onChange={e => setMaTranForm({...maTranForm, tfL4: e.target.value})} className="w-full p-1.5 border rounded text-sm outline-none" />
                                </div>
                            </div>
                        </div>

                        {/* Phần Trả lời ngắn */}
                        <div className="p-2 bg-white rounded-lg border border-indigo-100 shadow-sm">
                            <p className="text-xs font-bold text-orange-600 mb-2 uppercase tracking-wider">Trắc nghiệm SA (Phần III)</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-gray-500 block mb-1">Số câu hỏi (numSA)</label>
                                    <input value={maTranForm.numSA} onChange={e => setMaTranForm({...maTranForm, numSA: e.target.value})} className="w-full p-1.5 border rounded text-sm outline-none" />
                                </div>
                                <div>
                                    <label className="text-[11px] text-gray-500 block mb-1">Điểm mỗi câu (scoreSA)</label>
                                    <input value={maTranForm.scoreSA} onChange={e => setMaTranForm({...maTranForm, scoreSA: e.target.value})} className="w-full p-1.5 border rounded text-sm outline-none" />
                                </div>
                                <div>
                                    <label className="text-[11px] text-gray-500 block mb-1">Mức L3 (saL3)</label>
                                    <input value={maTranForm.saL3} onChange={e => setMaTranForm({...maTranForm, saL3: e.target.value})} className="w-full p-1.5 border rounded text-sm outline-none" />
                                </div>
                                <div>
                                    <label className="text-[11px] text-gray-500 block mb-1">Mức L4 (saL4)</label>
                                    <input value={maTranForm.saL4} onChange={e => setMaTranForm({...maTranForm, saL4: e.target.value})} className="w-full p-1.5 border rounded text-sm outline-none" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer: Nút bấm */}
            <div className="p-5 bg-gray-50 border-t flex gap-4">
                <button 
                    onClick={() => setIsMatrixOpen(false)}
                    className="flex-1 py-3 px-4 border border-gray-300 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 transition-all"
                >
                    Hủy bỏ
                </button>
                <button
                    onClick={handleSaveMatrix}
                    disabled={loadingMatrix}
                    className={`flex-[2] py-3 px-4 rounded-xl font-bold text-white transition-all ${
                        loadingMatrix 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:scale-[1.02] active:scale-[0.98] shadow-lg'
                    }`}
                >
                    {loadingMatrix ? "🔄 Đang gửi..." : "🚀 LƯU MA TRẬN"}
                </button>
            </div>
        </div>
    </div>
)}

      
      {/* MODAL VIP OPTIONS */}
      {showVipOptions && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm text-center shadow-2xl relative animate-in fade-in zoom-in duration-300">
            <h3 className="text-xl font-black text-slate-800 mb-6 uppercase">Em muốn thực hiện gì?</h3>
            
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => { setShowVipBenefits(true); setShowVipOptions(false); }}
                className="w-full py-4 bg-blue-500 text-white rounded-2xl font-black border-b-4 border-blue-700 active:translate-y-1 transition-all uppercase"
              >
                <i className="fas fa-list-check mr-2"></i> Xem Quyền lợi VIP
              </button>

              <a 
                href="https://forms.gle/co6FiWndaaLjtFNR8" 
                target="_blank" 
                rel="noreferrer"
                className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black border-b-4 border-orange-700 active:translate-y-1 transition-all uppercase block"
              >
                <i className="fas fa-paper-plane mr-2"></i> Đăng ký VIP ngay
              </a>
            </div>

            <button onClick={() => setShowVipOptions(false)} className="mt-6 text-slate-400 font-bold hover:text-red-500 transition">Đóng</button>
          </div>
        </div>
      )}

      {/* MODAL VIP BENEFITS */}
      {showVipBenefits && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md relative animate-in slide-in-from-bottom-4 duration-300">
            <h3 className="text-2xl font-black text-orange-600 mb-4 uppercase text-center italic">Đặc quyền VIP</h3>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-3 font-bold text-slate-700">
                <i className="fas fa-check-circle text-green-500 text-xl"></i> Mở khóa toàn bộ kho đề thi 10, 11, 12.
              </li>
              <li className="flex items-center gap-3 font-bold text-slate-700">
                <i className="fas fa-check-circle text-green-500 text-xl"></i> Xem lời giải chi tiết (Video + File PDF).
              </li>
              <li className="flex items-center gap-3 font-bold text-slate-700">
                <i className="fas fa-check-circle text-green-500 text-xl"></i> Không giới hạn lượt làm Quiz mỗi ngày.
              </li>
              <li className="flex items-center gap-3 font-bold text-slate-700">
                <i className="fas fa-check-circle text-green-500 text-xl"></i> Hỗ trợ trực tiếp từ Thầy qua Zalo VIP.
              </li>
            </ul>
            <button 
  onClick={() => { 
    setShowVipBenefits(false); // Đóng bảng đặc quyền
    window.open("https://forms.gle/co6FiWndaaLjtFNR8", "_blank"); // Mở ngay link đăng ký
  }}
  className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl font-black uppercase shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2"
>
  ĐÃ HIỂU - ĐĂNG KÝ VIP NGAY <i className="fas fa-paper-plane"></i>
</button>
          </div>
        </div>
      )}
      {/* MODAL LỊCH HỌC */}
      {showLichOptions && (
  /* 1. BACKDROP: Click ra vùng đen để đóng */
  <div 
    className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4 animate-in fade-in duration-300"
    onClick={() => setShowLichOptions(false)} 
  >
    {/* 2. MODAL CONTENT: Chặn sự kiện click để không bị đóng khi bấm vào nội dung */}
    <div 
      className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-300 border-4 border-white relative"
      onClick={(e) => e.stopPropagation()} 
    >
      
      {/* --- NÚT ĐÓNG (X) HOẠT ĐỘNG --- */}
      <button 
        onClick={() => setShowLichOptions(false)}
        className="absolute top-5 right-5 z-50 w-10 h-10 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center transition-all backdrop-blur-sm shadow-sm cursor-pointer active:scale-95"
        aria-label="Đóng lịch học"
      >
        <i className="fas fa-times text-xl"></i>
      </button>
      {/* ------------------------------- */}

      {/* Header Modal */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 p-8 text-center text-white relative h-40 flex flex-col justify-center items-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20 text-6xl font-black pointer-events-none uppercase">
          Calendar
        </div>
        <i className="fas fa-calendar-alt text-4xl mb-2 relative z-10"></i>
        <h3 className="text-2xl font-black uppercase tracking-tighter relative z-10">
          Lịch Học Offline
        </h3>
        <p className="text-orange-100 font-bold relative z-10 text-xs">Cập nhật mới nhất! Liên hệ thầy Hà để tham gia lớp học nhé</p>
        
      </div>

      {/* Body List (Giữ nguyên logic của bạn) */}
      <div className="p-6 bg-slate-50 max-h-[60vh] overflow-y-auto custom-scrollbar">
        <div className="grid gap-3">
          {schedules && schedules.length > 0 ? (
            schedules.map((item, idx) => {
              const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-red-500', 'bg-emerald-500'];
              const colorClass = colors[idx % colors.length];
              
              return (
                <div key={idx} className="flex items-center bg-white p-4 rounded-3xl shadow-sm border border-slate-100 hover:scale-[1.02] transition-transform">
                  <div className={`${colorClass} w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-xl shrink-0 shadow-lg`}>
                    {item.grade.replace(/\D/g, '') || "!"}
                  </div>
                  <div className="ml-4">
                    <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{item.grade}</div>
                    <div className="text-slate-800 font-black text-lg leading-tight">{item.time}</div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 text-slate-400 font-bold italic">
              Đang tải lịch học mới nhất...
            </div>
          )}
        </div>      
      </div>
          {/* Nút đóng */} 
      <div className="p-6 bg-white border-t border-slate-100">
        <button 
          onClick={() => setshowLichOptions(false)}
          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-orange-600 transition-colors shadow-lg active:scale-95 transition-all"
        >
          Đóng lịch học
        </button>
      </div>
    </div>
  </div>
)} 
      {/* Chọn môn */}
     {showSubjectModal && (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-6 shadow-2xl flex flex-col max-h-[90vh]">
      <h3 className="text-xl font-black text-indigo-700 uppercase text-center mb-6 italic">Hệ thống học liệu đa năng</h3>
      
      <div className="grid grid-cols-2 gap-4 overflow-hidden">
        {/* CỘT MÔN HỌC */}
        <div className="flex flex-col overflow-hidden">
          <div className="bg-indigo-50 p-2 font-black text-indigo-600 text-center uppercase text-[11px] rounded-t-xl">Môn học</div>
          <div className="overflow-y-auto space-y-1 mt-2 pr-2 no-scrollbar bg-slate-50/50 p-1 rounded-b-xl">
            {dynamicSubjects.map(sub => (
              <button key={sub} onClick={() => setSelectedSubject(sub)} className={`w-full flex items-center gap-2 p-3 rounded-xl border-2 text-[11px] font-bold transition-all ${selectedSubject === sub ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white border-slate-100 hover:border-indigo-200'}`}>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedSubject === sub ? 'bg-white text-indigo-600' : 'bg-slate-100'}`}>
                  {selectedSubject === sub && <i className="fas fa-check text-[8px]"></i>}
                </div> {sub}
              </button>
            ))}
          </div>
        </div>

        {/* CỘT CẤP HỌC */}
        <div className="flex flex-col overflow-hidden">
          <div className="bg-orange-50 p-2 font-black text-orange-600 text-center uppercase text-[11px] rounded-t-xl">Cấp học</div>
          <div className="overflow-y-auto space-y-1 mt-2 pr-2 no-scrollbar bg-slate-50/50 p-1 rounded-b-xl">
            {dynamicLevels.map(lvl => (
              <button key={lvl} onClick={() => setSelectedLevel(lvl)} className={`w-full flex items-center gap-2 p-3 rounded-xl border-2 text-[11px] font-bold transition-all ${selectedLevel === lvl ? 'bg-orange-500 text-white border-orange-500 shadow-md' : 'bg-white border-slate-100 hover:border-orange-200'}`}>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedLevel === lvl ? 'bg-white text-orange-600' : 'bg-slate-100'}`}>
                  {selectedLevel === lvl && <i className="fas fa-check text-[8px]"></i>}
                </div> {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button onClick={() => setShowSubjectModal(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black uppercase text-xs text-slate-400">Đóng</button>
        <button 
          onClick={handleRedirect} 
          disabled={!selectedSubject || !selectedLevel} 
          className={`flex-1 py-4 rounded-2xl font-black uppercase text-xs transition-all ${selectedSubject && selectedLevel ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
        >
          Truy cập ngay <i className="fas fa-arrow-right ml-2"></i>
        </button>
      </div>
    </div>
  </div>
)}
        
  {/* 6.MODAL QUIZ (Sửa lỗi step-by-step) */}
      {showQuizModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative border border-slate-100 overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-black text-orange-500 mb-6 uppercase text-center">
              {quizMode === 'gift' ? '🎁 Chế độ Quà QuiZ' : quizMode === 'free' ? '🎮 QuiZ Tự Do' : '🚀 Chọn chế độ chơi'}
            </h2>

            {!quizMode ? (
              <div className="flex flex-col gap-4">
                <button onClick={() => setQuizMode('free')} className="py-4 bg-blue-500 text-white rounded-2xl font-bold uppercase flex items-center justify-center gap-2 hover:brightness-110 shadow-lg">
                  <i className="fas fa-gamepad text-xl"></i> Chơi Tự Do
                </button>
                <button onClick={() => setQuizMode('gift')} className="py-4 bg-orange-500 text-white rounded-2xl font-bold uppercase flex items-center justify-center gap-2 hover:brightness-110 shadow-lg shadow-orange-200">
                  <i className="fas fa-gift text-xl"></i> Săn Quà QuiZ
                </button>
                <button 
            onClick={() => window.location.href = "https://smartedu-vn.vercel.app/"} 
            className="mt-2 text-slate-400 text-sm font-bold"
              >
            Quay lại trang chủ
            </button>
              </div>
            ) : (
              <form onSubmit={handleStartQuiz} className="space-y-4 animate-fade-in">
                {quizMode === 'gift' && (
                  <input required type="password" placeholder="Nhập mật khẩu Admin cấp " className="w-full p-4 bg-red-50 border-2 border-red-100 rounded-xl font-bold text-center" value={inputPassword} onChange={e => setInputPassword(e.target.value)} />
                )}
                {/* 1. Nhập Họ tên */}
                <input required placeholder="Họ và tên học sinh" 
                className="w-full p-3 bg-slate-100 rounded-xl font-bold" value={quizInfo.name} onChange={e=>setQuizInfo({...quizInfo, name: e.target.value})} />

                {/* 2. Nhập Số điện thoại */}
                <input required type="tel" placeholder="Số điện thoại" 
                className="w-full p-3 bg-slate-100 rounded-xl font-bold" value={quizInfo.phone} onChange={e=>setQuizInfo({...quizInfo, phone: e.target.value})} />

               {/* 3. Chọn Lớp */}
          <div className="space-y-2">
            <select required className="w-full p-3 bg-slate-100 rounded-xl font-bold" 
              onChange={(e) => {
                const val = e.target.value;
                setIsOtherClass(val === "Lớp khác");
                setQuizInfo({...quizInfo, class: val === "Lớp khác" ? "" : val});
              }}>
              <option value="">-- Chọn lớp học --</option>
              {(ADMIN_CONFIG.CLASS_ID || []).filter(c => c !== "Lớp khác").map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="Lớp khác">Lớp khác (Tự nhập...)</option>
            </select>
            {isOtherClass && (
              <input required placeholder="Nhập tên lớp của em..." 
                className="w-full p-3 bg-orange-50 border border-orange-200 rounded-xl font-bold"
                value={quizInfo.class} onChange={e => setQuizInfo({...quizInfo, class: e.target.value})} 
              />
            )}
          </div>
{/*  Chọn Trường học (Đoạn gốc của thầy) */}
<select required className="w-full p-3 bg-slate-100 rounded-xl font-bold" onChange={(e) => {
  const val = e.target.value;
  setIsOtherSchool(val === "Trường khác");
  setQuizInfo({...quizInfo, school: val === "Trường khác" ? "" : val});
}}>
  <option value="">-- Chọn trường học --</option>
  {ADMIN_CONFIG.schools.map(s => <option key={s} value={s}>{s}</option>)}
  <option value="Trường khác"></option>
</select>

{/* Thêm ô nhập tay cho Trường học */}
{isOtherSchool && (
  <input required placeholder="Nhập tên trường của em..." className="w-full p-3 bg-orange-50 border border-orange-200 rounded-xl font-bold animate-in fade-in slide-in-from-top-1" value={quizInfo.school} onChange={e => setQuizInfo({...quizInfo, school: e.target.value})} />
)}

                {quizMode === 'gift' && (
                  <div className="p-4 bg-orange-50 rounded-2xl space-y-3 border border-orange-100">
                    <p className="text-[10px] font-black text-orange-400 uppercase text-center">Thông tin nhận thưởng</p>
                    <input required placeholder="Số tài khoản ngân hàng" className="w-full p-3 bg-white rounded-xl font-bold" value={bankInfo.stk} onChange={e=>setBankInfo({...bankInfo, stk: e.target.value})} />
                   <select required className="w-full p-3 bg-white rounded-xl font-bold" onChange={(e) => {
  const val = e.target.value;
  setIsOtherBank(val === "Ngân hàng khác");
  setBankInfo({...bankInfo, bankName: val === "Ngân hàng khác" ? "" : val});
}}>
  <option value="">-- Ngân hàng --</option>
  {ADMIN_CONFIG.banks.map(b => <option key={b} value={b}>{b}</option>)}
  <option value="Ngân hàng khác"></option>
</select>

{/* Thêm ô nhập tay cho Ngân hàng */}
{isOtherBank && (
  <input required placeholder="Nhập tên ngân hàng (Ví dụ: Agribank...)" className="w-full p-3 bg-white border border-orange-200 rounded-xl font-bold animate-in fade-in slide-in-from-top-1" value={bankInfo.bankName} onChange={e => setBankInfo({...bankInfo, bankName: e.target.value})} />
)}
                  </div>
                )}
                <button className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black shadow-xl uppercase tracking-widest mt-4">Vào Thi Ngay</button>
                <button type="button" onClick={() => setQuizMode(null)} className="w-full text-slate-400 text-xs font-bold uppercase">Quay lại chọn chế độ</button>
              </form>
            )}
          </div>
        </div>
      )}
      {/* MODAL ĐĂNG KÝ / ĐĂNG NHẬP (MỚI THÊM) */}
      {authMode && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl border-4 border-blue-50 relative animate-in zoom-in duration-300">
            <h2 className="text-2xl font-black text-center uppercase mb-6 text-slate-800 tracking-tighter">
              {authMode === 'login' ? 'Đăng Nhập' : 'Tạo Tài Khoản'}
            </h2>
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase ml-2 text-slate-400">Số điện thoại</label>
                <input required type="tel" placeholder="0988..." 
                  className="w-full p-4 bg-slate-100 rounded-2xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all" 
                  value={authForm.phone} onChange={e => setAuthForm({...authForm, phone: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase ml-2 text-slate-400">Mật khẩu</label>
                <input required type="password" placeholder="••••••" 
                  className="w-full p-4 bg-slate-100 rounded-2xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all" 
                  value={authForm.pass} onChange={e => setAuthForm({...authForm, pass: e.target.value})} />
              </div>
              <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase shadow-lg border-b-4 border-blue-800 active:scale-95 transition-all mt-2">
                {authMode === 'login' ? 'Vào hệ thống' : 'Đăng ký ngay'}
              </button>
            </form>
            
            <button 
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} 
              className="w-full mt-4 text-[10px] font-bold text-blue-500 uppercase hover:underline"
            >
              {authMode === 'login' ? 'Chưa có tài khoản? Đăng ký tại đây' : 'Đã có tài khoản? Đăng nhập'}
            </button>
            <button onClick={() => setAuthMode(null)} className="w-full mt-4 text-slate-400 text-[10px] font-bold uppercase">Bỏ qua</button>
          </div>
        </div>
      )}
      {/* GIAO DIỆN BẢNG TÌM LỜI GIẢI */}
        {showModal && (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[999] p-4">
    <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
      
      {/* Header Cam Rực Rỡ */}
      <div className="bg-orange-500 p-8 text-white flex justify-between items-center border-b-8 border-orange-600">
        <h3 className="text-2xl font-black uppercase tracking-widest flex items-center gap-3">
          <i className="fa-solid fa-lightbulb text-3xl"></i> Lời giải chi tiết
        </h3>
        <button onClick={() => {setShowModal(false); setFoundLG(null); setSearchId("");}} className="hover:rotate-90 transition-all bg-white/20 p-2 rounded-full">
          <i className="fa-solid fa-xmark text-3xl"></i>
        </button>
      </div>

      <div className="p-8 md:p-12">
        {/* Ô nhập ID */}
        <div className="flex gap-4 mb-10">
          <input 
            type="text" 
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearchLG()}
            placeholder="Nhập mã ID (VD: 12260128001)..."
            className="flex-1 border-4 border-slate-100 rounded-3xl px-8 py-5 focus:border-orange-500 outline-none font-black text-2xl text-slate-700 shadow-inner"
          />
          <button 
            onClick={handleSearchLG} 
            className="bg-orange-500 hover:bg-orange-600 text-white px-10 rounded-3xl font-black text-xl shadow-lg transition-all active:scale-95"
          >
            {loadingLG ? <i className="fa-solid fa-spinner animate-spin"></i> : "TÌM KIẾM"}
          </button>
        </div>

        {/* Vùng hiển thị Lời giải thuần túy */}
        {foundLG ? (
          <div className="bg-orange-50/50 p-10 rounded-[2.5rem] border-2 border-orange-100 min-h-[350px] max-h-[60vh] overflow-y-auto">
            <div id="modal-lg-content" className="text-2xl leading-relaxed text-slate-800 font-medium">
               <p className="whitespace-pre-wrap italic">
                  {foundLG}
               </p>
            </div>
          </div>
        ) : (
          <div className="py-20 text-center text-slate-200">
            <i className="fa-solid fa-face-smile text-8xl mb-4 opacity-10"></i>
            <p className="text-xl font-bold italic">Mời thầy nhập mã ID để xem hướng dẫn giải!</p>
          </div>
        )}
      </div>

      <div className="bg-slate-50 p-4 text-center">
         <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Hỗ trợ MathJax & Render sạch nội dung</p>
      </div>
    </div>
  </div>
)}
{/* GIAO DIỆN TRA CỨU LỜI GIẢI - BẢN FULL KHÔNG THIẾU THỨ GÌ */}

      {/* ICON FONTAWESOME */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />

     {/* STYLE TỔNG HỢP: CHỮ CHẠY & HIỆU ỨNG VIP */}
      <style>{`
        @keyframes marquee { 
          0% { transform: translateX(100%); } 
          100% { transform: translateX(-100%); } 
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-marquee { 
          display: inline-block; 
          animation: marquee 25s linear infinite; 
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default LandingPage;
