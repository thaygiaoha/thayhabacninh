const [examData, setExamData] = useState({
  // Cột A -> F
  Exams: "",      // Tên mã đề (vd: Toan10_GK1)
  IdNumber: "",   // IDGV (Dùng để xác minh)
  fulltime: 90,   // Mặc định 90 phút
  mintime: 15,    // Nộp bài sau 15 phút
  tab: 3,         // Cho phép thoát 3 lần
  close: "",      // Thời điểm đóng đề (ISO String)
  
  // Cột G
  imgURL: "",     // Kho ảnh của giáo viên
  
  // Cột H -> M (Phần cấu hình điểm)
  MCQ: 0, scoremcq: 0, // Phần I
  TF: 0, scoretf: 0,   // Phần II
  SA: 0, scoresa: 0    // Phần III
});
