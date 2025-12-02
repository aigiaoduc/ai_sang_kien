import { SectionDef, SectionId } from './types';

export const SKKN_SECTIONS: SectionDef[] = [
  {
    id: SectionId.GENERAL_INFO,
    title: "Thông tin chung",
    description: "Thiết lập tên đề tài, môn học và khối lớp để AI hiểu ngữ cảnh.",
    promptLabel: "",
    placeholder: "",
    guideContent: "Tên đề tài cần ngắn gọn, súc tích, thể hiện được biện pháp (cái mới) và đối tượng áp dụng.\nVí dụ: 'Một số biện pháp rèn kỹ năng đọc hiểu cho học sinh lớp 5 thông qua bản đồ tư duy'."
  },
  {
    id: SectionId.REASON,
    title: "I. Lý do chọn đề tài",
    description: "Nêu tính cấp thiết, lý do khách quan (yêu cầu đổi mới) và chủ quan (thực tế giảng dạy).",
    promptLabel: "Hướng dẫn thêm cho AI (Nếu để trống, AI sẽ tự phân tích Tên đề tài để viết):",
    placeholder: "Để trống để AI tự viết dựa trên tên đề tài. Hoặc nhập ý riêng: 'Nhấn mạnh vào việc học sinh sợ học môn này...'",
    guideContent: "Nội dung cần có:\n1. Cơ sở pháp lý: Nghị quyết, Chương trình GDPT 2018 đòi hỏi gì về năng lực này?\n2. Cơ sở thực tiễn: Thực tế học sinh đang yếu ở điểm nào? Giáo viên gặp khó khăn gì?\n3. Khẳng định: Từ những lý do trên, tôi chọn đề tài này để giải quyết vấn đề."
  },
  {
    id: SectionId.OBJECTIVE_METHOD,
    title: "II. Mục đích & Phương pháp nghiên cứu",
    description: "Xác định mục đích nghiên cứu, đối tượng, phạm vi và phương pháp nghiên cứu.",
    promptLabel: "Hướng dẫn thêm cho AI (Nếu để trống, AI sẽ tự đề xuất phương pháp phù hợp):",
    placeholder: "Để trống để AI tự đề xuất phương pháp nghiên cứu khoa học phù hợp với đề tài.",
    guideContent: "Lưu ý đặc biệt về Phương pháp nghiên cứu:\nBạn cần liệt kê các phương pháp cụ thể sẽ dùng để chứng minh sáng kiến:\n- Phương pháp nghiên cứu tài liệu: Đọc sách, báo, module.\n- Phương pháp điều tra/khảo sát: Dùng phiếu hỏi học sinh đầu năm và cuối năm.\n- Phương pháp thực nghiệm: Dạy thử nghiệm tại lớp A và so sánh với lớp B (lớp đối chứng).\n- Phương pháp thống kê: Lập bảng số liệu so sánh điểm số trước và sau khi áp dụng."
  },
  {
    id: SectionId.THEORY,
    title: "III.1. Cơ sở lý luận",
    description: "Các khái niệm, định nghĩa, văn bản chỉ đạo và quan điểm giáo dục liên quan.",
    promptLabel: "Hướng dẫn thêm cho AI (Nếu để trống, AI sẽ tự trích dẫn văn bản/lý thuyết):",
    placeholder: "Để trống để AI tự tìm kiếm các cơ sở lý luận, văn bản GDPT 2018 liên quan.",
    guideContent: "Phần này cần trả lời các câu hỏi:\n- Những khái niệm chính trong đề tài là gì? (Ví dụ: 'Kỹ năng sống là gì?', 'Bản đồ tư duy là gì?').\n- Đặc điểm tâm sinh lý của học sinh lứa tuổi này có gì đặc biệt ảnh hưởng đến vấn đề nghiên cứu?\n- Vai trò của môn học này trong chương trình giáo dục."
  },
  {
    id: SectionId.REALITY,
    title: "III.2. Thực trạng vấn đề",
    description: "Phân tích đặc điểm tình hình, thuận lợi và khó khăn/hạn chế trước khi áp dụng.",
    promptLabel: "Hướng dẫn thêm cho AI (AI sẽ tự giả định số liệu thực tế nếu bạn không nhập):",
    placeholder: "Để trống để AI tự xây dựng kịch bản thực trạng phổ biến. Hoặc nhập: 'Lớp có 35 HS, 10 em yếu...'",
    guideContent: "Cấu trúc chuẩn:\n1. Thuận lợi: Nhà trường quan tâm, học sinh năng động...\n2. Khó khăn (Quan trọng): Nêu rõ các hạn chế. Ví dụ: Học sinh còn thụ động, chưa hứng thú...\n3. Số liệu khảo sát đầu năm: Kẻ bảng thống kê (Giỏi, Khá, Trung bình, Yếu) để làm bằng chứng cho thấy chất lượng đang thấp -> Cần có biện pháp khắc phục."
  },
  {
    id: SectionId.MEASURES,
    title: "III.3. Các biện pháp thực hiện",
    description: "Nội dung trọng tâm: Trình bày chi tiết các giải pháp, cách làm mới đã áp dụng.",
    promptLabel: "Hướng dẫn thêm cho AI (Quan trọng: AI sẽ dựa vào Lý do & Thực trạng để đề xuất):",
    placeholder: "Để trống để AI tự đề xuất 3-5 biện pháp sáng tạo nhất giải quyết vấn đề.",
    guideContent: "Đây là phần quan trọng nhất (chiếm 60% điểm số).\n- Chia thành các Biện pháp nhỏ (Biện pháp 1, Biện pháp 2...).\n- Mỗi biện pháp trình bày theo quy trình: Tên biện pháp -> Mục đích -> Cách tiến hành (Bước 1, Bước 2...) -> Ví dụ minh họa (Bài tập cụ thể).\n- Tuyệt đối không viết lý thuyết suông, phải là việc làm cụ thể của giáo viên trên lớp."
  },
  {
    id: SectionId.NEW_POINTS,
    title: "III.4. Điểm mới của sáng kiến",
    description: "Chỉ ra những điểm sáng tạo, khác biệt so với các phương pháp truyền thống.",
    promptLabel: "Hướng dẫn thêm cho AI (AI sẽ so sánh Biện pháp mới và cách cũ):",
    placeholder: "Để trống để AI tự phân tích điểm mới dựa trên các biện pháp đã viết ở trên.",
    guideContent: "So sánh ngắn gọn:\n- Trước khi có sáng kiến: Giáo viên dạy thuyết trình, học sinh thụ động.\n- Sau khi có sáng kiến: Giáo viên tổ chức trò chơi, học sinh chủ động hợp tác.\n-> Điểm mới là sự thay đổi trong phương pháp tổ chức và công cụ hỗ trợ."
  },
  {
    id: SectionId.EFFECTIVENESS,
    title: "III.5. Hiệu quả sáng kiến",
    description: "Kết quả đạt được sau khi áp dụng sáng kiến (số liệu so sánh đối chứng).",
    promptLabel: "Hướng dẫn thêm cho AI (AI sẽ tự tạo bảng so sánh số liệu giả định):",
    placeholder: "Để trống để AI tự viết báo cáo kết quả và so sánh số liệu trước/sau.",
    guideContent: "Phải có minh chứng bằng số liệu:\n- Lập bảng so sánh kết quả: Đối chiếu số liệu đầu năm (ở phần Thực trạng) và cuối năm.\n- Biểu đồ (nếu có).\n- Nhận xét: Tỷ lệ học sinh Khá/Giỏi tăng bao nhiêu %? Tỷ lệ Yếu kém giảm bao nhiêu %?\n- Sự thay đổi về thái độ, nề nếp của học sinh."
  },
  {
    id: SectionId.CONCLUSION,
    title: "IV.1. Kết luận",
    description: "Khẳng định lại giá trị của sáng kiến, bài học kinh nghiệm rút ra.",
    promptLabel: "Hướng dẫn thêm cho AI:",
    placeholder: "Để trống để AI tự đúc kết bài học kinh nghiệm sư phạm.",
    guideContent: "Tóm tắt lại: Sáng kiến đã giải quyết được vấn đề gì?\nBài học kinh nghiệm: Để áp dụng thành công, giáo viên cần có tâm huyết, chuẩn bị đồ dùng kỹ lưỡng, v.v..."
  },
  {
    id: SectionId.RECOMMENDATION,
    title: "IV.2. Kiến nghị",
    description: "Đề xuất với Tổ chuyên môn, Ban giám hiệu, Phòng/Sở GD&ĐT.",
    promptLabel: "Hướng dẫn thêm cho AI:",
    placeholder: "Để trống để AI tự đề xuất các kiến nghị hợp lý.",
    guideContent: "Kiến nghị về:\n- Cơ sở vật chất (Máy chiếu, phòng chức năng).\n- Tài liệu tham khảo.\n- Chế độ chính sách hoặc tổ chức các lớp tập huấn chuyên môn."
  },
  {
    id: SectionId.REFERENCES,
    title: "Tài liệu tham khảo",
    description: "Liệt kê các tài liệu, sách báo, website đã tham khảo.",
    promptLabel: "Hướng dẫn thêm cho AI:",
    placeholder: "Để trống để AI tự liệt kê các tài liệu tham khảo chuẩn mực.",
    guideContent: "Sắp xếp theo thứ tự Alpha tên tác giả.\nVí dụ:\n1. Bộ Giáo dục và Đào tạo (2018), Chương trình giáo dục phổ thông môn...\n2. Nguyễn Văn A (2020), Phương pháp dạy học tích cực, NXB Giáo dục."
  }
];

export const MOCK_LOADING_MESSAGES = [
  "AI đang phân tích tên đề tài và cấu trúc...",
  "Đang đọc lại các phần trước để đảm bảo tính liên kết...",
  "Đang xây dựng nội dung chi tiết và logic...",
  "Đang trau chuốt câu từ theo văn phong sư phạm...",
  "Đang hoàn thiện các gợi ý tốt nhất cho bạn..."
];