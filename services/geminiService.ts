import { GoogleGenAI } from "@google/genai";
import { DocumentState, SectionId, GenerationRequest } from "../types";

// Hàm lấy AI Client động từ LocalStorage hoặc Env
const getAiClient = () => {
  let apiKey = '';
  
  // 1. Ưu tiên lấy từ LocalStorage (Người dùng nhập)
  if (typeof window !== 'undefined') {
    const userKey = localStorage.getItem('user_api_key');
    if (userKey) apiKey = userKey;
  }

  // 2. Nếu không có, lấy từ biến môi trường (Cấu hình Vercel)
  if (!apiKey) {
    // Vite uses import.meta.env
    apiKey = import.meta.env.VITE_GOOGLE_API_KEY || '';
  }

  if (!apiKey) {
    throw new Error("Chưa có API Key. Vui lòng vào Cấu hình để nhập Google Gemini API Key.");
  }

  return new GoogleGenAI({ apiKey });
};

const MODEL_NAME = 'gemini-2.0-flash-exp'; // Using a stable model name or whatever is supported

const SYSTEM_INSTRUCTION = `
Bạn là một công cụ tạo văn bản Sáng kiến kinh nghiệm (SKKN) tự động chất lượng cao.
VAI TRÒ CỦA BẠN KHÔNG PHẢI LÀ CHATBOT HAY TRỢ LÝ. BẠN LÀ MỘT MÁY IN VĂN BẢN.

QUY TẮC CỐT TỬ (BẮT BUỘC TUÂN THỦ):
1. KHÔNG BAO GIỜ có lời dẫn, lời chào, lời giải thích hay mô tả quy trình (Ví dụ: "Để viết phần này...", "Dưới đây là nội dung...", "Chúng ta cần phân tích...").
2. ĐẦU RA PHẢI LÀ SẢN PHẨM CUỐI CÙNG: Chỉ xuất ra nội dung văn bản chính thức để người dùng copy vào báo cáo.
3. Bắt đầu ngay vào tiêu đề mục hoặc đoạn văn đầu tiên.
4. Văn phong: Trang trọng, khoa học, sư phạm (theo chuẩn Bộ Giáo dục Việt Nam).
5. Luôn tuân thủ tính liên kết logic với các phần trước đó.
`;

const getPrevContent = (documentState: DocumentState, id: SectionId, limit: number = 1000) => {
  const content = documentState[id as keyof DocumentState] || "";
  return content.length > limit ? content.substring(0, limit) + "..." : content;
};

const buildBaseContext = (documentState: DocumentState) => `
  --- THÔNG TIN ĐỀ TÀI ---
  ĐỀ TÀI: "${documentState.topic}"
  MÔN HỌC: "${documentState.subject}"
  KHỐI LỚP: "${documentState.grade}"
  -------------------------
`;

// --- DEEP DIVE: STEP 1 - GENERATE NAMES ---
export const generateMeasureNames = async (req: GenerationRequest): Promise<string[]> => {
  const ai = getAiClient();
  const { userContext, documentState } = req;
  const baseContext = buildBaseContext(documentState);
  
  const prompt = `
    ${baseContext}
    >>> NGỮ CẢNH KHÓ KHĂN (Thực trạng): "${getPrevContent(documentState, SectionId.REALITY, 1500)}"
    ${userContext ? `YÊU CẦU CỦA NGƯỜI DÙNG: "${userContext}"` : ""}

    NHIỆM VỤ: Đề xuất 4 tên biện pháp sư phạm sáng tạo, cụ thể, thực tế để giải quyết các khó khăn trên.
    
    YÊU CẦU ĐẦU RA (NGHIÊM NGẶT):
    - Chỉ trả về một mảng JSON chứa các chuỗi ký tự (tên biện pháp).
    - Không viết thêm bất kỳ lời dẫn nào.
    - Định dạng: ["Biện pháp 1: Tên biện pháp...", "Biện pháp 2: Tên biện pháp..."]
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Gemini Suggest Error:", error);
    if (error.message?.includes("API Key")) {
        throw new Error("API Key không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại trong Cấu hình.");
    }
    // Fallback giả định nếu lỗi
    return ["Biện pháp 1: Xây dựng kế hoạch dạy học linh hoạt", "Biện pháp 2: Đổi mới phương pháp kiểm tra đánh giá", "Biện pháp 3: Tăng cường ứng dụng công nghệ thông tin"];
  }
};

// --- DEEP DIVE: STEP 2 - GENERATE DETAIL FOR ONE MEASURE ---
export const generateMeasureDetail = async (req: GenerationRequest, measureName: string, index: number): Promise<string> => {
  const ai = getAiClient();
  const { documentState } = req;
  const baseContext = buildBaseContext(documentState);

  const prompt = `
    ${baseContext}
    
    NHIỆM VỤ: Viết nội dung chi tiết cho BIỆN PHÁP SỐ ${index + 1}: "${measureName}".
    
    YÊU CẦU NỘI DUNG (CHẾ ĐỘ VIẾT SÂU - DEEP DIVE):
    - Hãy viết thật chi tiết, dài và sâu sắc (khoảng 400-600 từ cho biện pháp này).
    - Cấu trúc bắt buộc:
      1. Mục đích của biện pháp (Tại sao lại làm cách này?).
      2. Cách thức tiến hành (Mô tả tỉ mỉ từng bước giáo viên làm gì, học sinh làm gì).
      3. Ví dụ minh họa thực tế (RẤT QUAN TRỌNG: Hãy đưa ra ví dụ cụ thể về một bài dạy, một trò chơi, hoặc một tình huống trong môn ${documentState.subject} lớp ${documentState.grade}).
      4. Kết quả mong đợi của biện pháp này.

    ĐỊNH DẠNG:
    - Bắt đầu bằng tiêu đề: "### ${index + 1}. ${measureName}"
    - Sử dụng Markdown chuẩn (Bold, list).
    - Văn phong sư phạm, thuyết phục.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });
    return response.text || "";
  } catch (error: any) {
    console.error("Gemini Detail Error:", error);
    if (error.message?.includes("API Key")) {
        throw new Error("API Key không hợp lệ hoặc đã hết hạn.");
    }
    return `### ${index + 1}. ${measureName}\n\n(Lỗi khi tạo nội dung chi tiết. Vui lòng thử lại.)\n`;
  }
};

// --- STANDARD GENERATION ---
export const generateSectionContent = async (req: GenerationRequest): Promise<string> => {
  const ai = getAiClient();
  const { sectionId, userContext, documentState } = req;
  const baseContext = buildBaseContext(documentState);
  
  // 3. Quy tắc đầu ra nghiêm ngặt
  const STRICT_OUTPUT_RULES = `
  --- QUY ĐỊNH ĐẦU RA (NGHIÊM NGẶT) ---
  - TUYỆT ĐỐI KHÔNG viết: "Dưới đây là...", "Đây là phần...", "Để giải quyết vấn đề...".
  - VIẾT THẲNG VÀO NỘI DUNG. Ví dụ nếu là phần Lý do, bắt đầu ngay bằng "Hiện nay, việc dạy học..." hoặc "Trong bối cảnh đổi mới...".
  - Sử dụng định dạng Markdown chuyên nghiệp (Bold các ý chính, gạch đầu dòng rõ ràng).
  `;

  let prompt = "";

  const userInstruction = userContext && userContext.trim() !== "" 
    ? `YÊU CẦU CHI TIẾT CỦA NGƯỜI DÙNG: "${userContext}"` 
    : `CHẾ ĐỘ TỰ ĐỘNG: Hãy tự phân tích Đề tài và ngữ cảnh để viết nội dung tốt nhất.`;

  switch (sectionId) {
    case SectionId.REASON:
      prompt = `
      ${baseContext}
      ${userInstruction}
      ${STRICT_OUTPUT_RULES}

      NHIỆM VỤ: Soạn thảo nội dung hoàn chỉnh cho phần "I. Lý do chọn đề tài".
      
      YÊU CẦU NỘI DUNG:
      - Đoạn 1: Nêu bối cảnh chung (Yêu cầu đổi mới GDPT 2018, vai trò môn ${documentState.subject}).
      - Đoạn 2: Nêu thực trạng/mâu thuẫn (Học sinh gặp khó khăn gì, phương pháp cũ hạn chế gì).
      - Đoạn 3: Khẳng định tính cấp thiết và chốt tên đề tài.
      `;
      break;

    case SectionId.OBJECTIVE_METHOD:
      prompt = `
      ${baseContext}
      ${userInstruction}
      >>> NGỮ CẢNH (Lý do chọn đề tài): "${getPrevContent(documentState, SectionId.REASON)}"
      ${STRICT_OUTPUT_RULES}

      NHIỆM VỤ: Soạn thảo nội dung cho phần "Mục đích nghiên cứu" và "Phương pháp nghiên cứu".

      YÊU CẦU NỘI DUNG:
      1. Mục đích nghiên cứu: Trình bày ngắn gọn mục tiêu giải quyết vấn đề đã nêu ở phần Lý do.
      2. Phương pháp nghiên cứu: Liệt kê và mô tả ngắn gọn các phương pháp (VD: Phương pháp nghiên cứu tài liệu, phương pháp điều tra khảo sát, phương pháp thực nghiệm...).
      `;
      break;
    
    case SectionId.THEORY:
      prompt = `
      ${baseContext}
      ${userInstruction}
      ${STRICT_OUTPUT_RULES}
      
      NHIỆM VỤ: Soạn thảo nội dung "II.1. Cơ sở lý luận".

      YÊU CẦU NỘI DUNG:
      - Định nghĩa các khái niệm chính trong đề tài "${documentState.topic}".
      - Trích dẫn quan điểm giáo dục hiện đại, vai trò của vấn đề này trong việc hình thành phẩm chất/năng lực học sinh.
      `;
      break;

    case SectionId.REALITY:
      prompt = `
      ${baseContext}
      ${userInstruction}
      ${STRICT_OUTPUT_RULES}
      
      NHIỆM VỤ: Soạn thảo nội dung "II.2. Thực trạng vấn đề".

      YÊU CẦU NỘI DUNG:
      - Đặc điểm tình hình: Nêu thuận lợi chủ quan và khách quan.
      - Khó khăn/Tồn tại (Trọng tâm): Mô tả chi tiết các lỗi sai, hạn chế của học sinh, sự lúng túng của giáo viên.
      - Số liệu khảo sát (Bắt buộc): Tạo một bảng Markdown giả định số liệu khảo sát đầu năm (Trước khi áp dụng SKKN) cho thấy tỉ lệ đạt yêu cầu thấp.
      `;
      break;

    case SectionId.MEASURES:
      // FALLBACK for standard generation (if Deep Dive not used)
      prompt = `
      ${baseContext}
      ${userInstruction}
      >>> NGỮ CẢNH KHÓ KHĂN (Đã nêu ở Thực trạng): "${getPrevContent(documentState, SectionId.REALITY, 1500)}"
      ${STRICT_OUTPUT_RULES}

      NHIỆM VỤ: Soạn thảo nội dung "II.3. Các biện pháp thực hiện".

      YÊU CẦU NỘI DUNG:
      - Đây là phần quan trọng nhất. Hãy viết chi tiết 3-4 biện pháp cụ thể.
      - Mỗi biện pháp trình bày theo cấu trúc: 
        + Tên biện pháp (Rõ ràng, hành động).
        + Cách tiến hành (Mô tả từng bước giáo viên làm gì, học sinh làm gì).
        + Ví dụ minh họa (Bài tập cụ thể, tình huống cụ thể trong môn ${documentState.subject}).
      `;
      break;

    case SectionId.NEW_POINTS:
      prompt = `
      ${baseContext}
      ${userInstruction}
      >>> NGỮ CẢNH BIỆN PHÁP (Đã viết): "${getPrevContent(documentState, SectionId.MEASURES, 800)}"
      ${STRICT_OUTPUT_RULES}

      NHIỆM VỤ: Soạn thảo nội dung "II.4. Điểm mới của sáng kiến".

      YÊU CẦU NỘI DUNG:
      - Chỉ ra sự khác biệt giữa cách làm cũ và cách làm mới (vừa trình bày).
      - Nhấn mạnh tính sáng tạo và khả năng áp dụng thực tiễn.
      `;
      break;

    case SectionId.EFFECTIVENESS:
      prompt = `
      ${baseContext}
      ${userInstruction}
      ${STRICT_OUTPUT_RULES}

      NHIỆM VỤ: Soạn thảo nội dung "II.5. Hiệu quả của sáng kiến".

      YÊU CẦU NỘI DUNG:
      - Mô tả sự thay đổi tích cực của học sinh (Thái độ, kỹ năng, kết quả).
      - Bảng so sánh số liệu (Bắt buộc): Tạo bảng so sánh đối chứng (Đầu năm vs Cuối năm/Sau khi áp dụng) cho thấy tỉ lệ Khá/Giỏi tăng lên, Yếu/Kém giảm đi.
      `;
      break;

    case SectionId.CONCLUSION:
      prompt = `
      ${baseContext}
      ${userInstruction}
      ${STRICT_OUTPUT_RULES}
      
      NHIỆM VỤ: Soạn thảo nội dung "III.1. Kết luận".

      YÊU CẦU NỘI DUNG:
      - Khẳng định lại ý nghĩa của đề tài.
      - Rút ra bài học kinh nghiệm sư phạm cho bản thân và đồng nghiệp.
      `;
      break;
    
    case SectionId.RECOMMENDATION:
      prompt = `
      ${baseContext}
      ${userInstruction}
      ${STRICT_OUTPUT_RULES}
      
      NHIỆM VỤ: Soạn thảo nội dung "III.2. Kiến nghị".

      YÊU CẦU NỘI DUNG:
      - Đề xuất cụ thể với Tổ chuyên môn, Ban giám hiệu nhà trường và Phòng/Sở GD&ĐT về cơ sở vật chất, bồi dưỡng chuyên môn... để áp dụng sáng kiến tốt hơn.
      `;
      break;

    case SectionId.REFERENCES:
      prompt = `
      ${baseContext}
      ${userInstruction}
      ${STRICT_OUTPUT_RULES}
      
      NHIỆM VỤ: Soạn thảo danh mục "Tài liệu tham khảo".

      YÊU CẦU NỘI DUNG:
      - Liệt kê 5-7 tài liệu (Sách giáo khoa, Chương trình GDPT 2018, Sách giáo viên, Các bài báo giáo dục) liên quan đến môn ${documentState.subject}.
      - Trình bày theo chuẩn trích dẫn tài liệu tham khảo.
      `;
      break;

    default:
      return "Phần này chưa được cấu hình.";
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });
    
    return response.text || "";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes("API Key")) {
        throw new Error("API Key không hợp lệ. Vui lòng kiểm tra lại cấu hình.");
    }
    throw new Error("Không thể kết nối với AI. Vui lòng kiểm tra API Key hoặc mạng internet.");
  }
};