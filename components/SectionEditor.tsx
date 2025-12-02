import React, { useState, useEffect, useRef } from 'react';
import { SectionDef, SectionId, DocumentState } from '../types';
import { generateSectionContent, generateMeasureNames, generateMeasureDetail } from '../services/geminiService';
import { Sparkles, Loader2, Save, Bot, Lightbulb, X, Lock, AlertTriangle, CheckCircle, ListPlus, Play, Edit3, Trash2 } from 'lucide-react';
import { MOCK_LOADING_MESSAGES } from '../constants';
import { ToastType } from './Toast';

interface SectionEditorProps {
  section: SectionDef;
  documentState: DocumentState;
  onUpdate: (data: Partial<DocumentState>) => void;
  credits: number | null;
  isLocked?: boolean;
  notify: (msg: string, type: ToastType) => void;
}

// Cấu hình thời gian nghỉ để tránh lỗi API (Rate Limit)
const MIN_API_INTERVAL = 12000; // Tối thiểu 12s giữa các lần bấm nút bất kỳ
const DEEP_DIVE_DELAY = 20000; // 20s nghỉ giữa các biện pháp trong vòng lặp

const SectionEditor: React.FC<SectionEditorProps> = ({ 
  section, 
  documentState, 
  onUpdate, 
  credits,
  isLocked = false,
  notify
}) => {
  const [localTopic, setLocalTopic] = useState(documentState.topic);
  const [localSubject, setLocalSubject] = useState(documentState.subject);
  const [localGrade, setLocalGrade] = useState(documentState.grade);

  const [userContext, setUserContext] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  
  const [showGuide, setShowGuide] = useState(false);

  // DEEP DIVE STATES
  const [measureMode, setMeasureMode] = useState<'init' | 'suggesting' | 'review' | 'writing' | 'done'>('init');
  const [suggestedMeasures, setSuggestedMeasures] = useState<string[]>([]);
  const [writingProgress, setWritingProgress] = useState(0);

  // API THROTTLING REF
  const lastApiCallTime = useRef<number>(0);

  useEffect(() => {
    setUserContext("");
    setShowGuide(false); 
    setMeasureMode('init');
    setSuggestedMeasures([]);
  }, [section.id]);

  useEffect(() => {
    setLocalTopic(documentState.topic);
    setLocalSubject(documentState.subject);
    setLocalGrade(documentState.grade);
  }, [documentState.topic, documentState.subject, documentState.grade]);

  // Hiệu ứng đổi tin nhắn loading (Chỉ dùng khi KHÔNG PHẢI chế độ chờ thông minh)
  useEffect(() => {
    // Logic cũ đã được smartWait thay thế, giữ effect trống để tránh lỗi hook
  }, [isGenerating, measureMode]);

  // --- SMART WAIT FUNCTION ---
  // Hàm này giúp tạo cảm giác "AI đang suy nghĩ" trong lúc chờ cooldown
  const smartWait = async (ms: number, baseMsg: string = "AI đang suy nghĩ") => {
    const steps = Math.ceil(ms / 2500);
    const thinkingMessages = [
      `${baseMsg}...`,
      "Đang đối chiếu dữ liệu sư phạm...",
      "Đang phân tích tính liên kết logic...",
      "Đang tối ưu hóa câu từ...",
      "Đang tổng hợp các ý tưởng tốt nhất..."
    ];

    for (let i = 0; i < steps; i++) {
      setLoadingMsg(thinkingMessages[i % thinkingMessages.length]);
      await new Promise(resolve => setTimeout(resolve, 2500));
    }
  };

  const checkAndApplyThrottling = async () => {
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCallTime.current;

    if (timeSinceLastCall < MIN_API_INTERVAL) {
      const waitTime = MIN_API_INTERVAL - timeSinceLastCall;
      console.log(`Throttling: Waiting ${waitTime}ms`);
      await smartWait(waitTime, "AI đang phân tích sâu hơn");
    }
  };

  const handleGeneralInfoSave = () => {
    if (isLocked) {
      notify("Tài khoản hết lượt. Vui lòng nạp thêm để chỉnh sửa.", "error");
      return;
    }
    onUpdate({
      topic: localTopic,
      subject: localSubject,
      grade: localGrade
    });
    notify("Đã lưu thông tin chung thành công!", "success");
  };

  const validateRequest = () => {
    if (isLocked) {
      notify("Tài khoản hết lượt. Vui lòng nạp thêm để sử dụng AI.", "error");
      return false;
    }
    if (!documentState.topic || !documentState.subject) {
      notify("Vui lòng điền 'Thông tin chung' trước.", "warning");
      return false;
    }
    return true;
  };

  // --- STEP 1: SUGGEST MEASURES ---
  const handleSuggestMeasures = async () => {
    if (!validateRequest()) return;

    setIsGenerating(true);
    setMeasureMode('suggesting');
    setLoadingMsg("AI đang nghiên cứu đề tài...");
    
    try {
      // 1. Kiểm tra rate limit
      await checkAndApplyThrottling();

      // 2. Gọi API
      const measures = await generateMeasureNames({
        sectionId: section.id,
        userContext,
        documentState
      });
      setSuggestedMeasures(measures);
      setMeasureMode('review');
      notify("Đã đề xuất xong biện pháp. Vui lòng kiểm tra!", "success");
      
      // 3. Ghi lại thời gian
      lastApiCallTime.current = Date.now();

    } catch (error: any) {
      console.error(error);
      notify("Lỗi khi đề xuất biện pháp.", "error");
      setMeasureMode('init');
    } finally {
      setIsGenerating(false);
    }
  };

  // --- STEP 2: EDIT LIST ---
  const handleUpdateMeasure = (idx: number, newVal: string) => {
    const newArr = [...suggestedMeasures];
    newArr[idx] = newVal;
    setSuggestedMeasures(newArr);
  };

  const handleRemoveMeasure = (idx: number) => {
    const newArr = suggestedMeasures.filter((_, i) => i !== idx);
    setSuggestedMeasures(newArr);
  };

  const handleAddMeasure = () => {
    setSuggestedMeasures([...suggestedMeasures, `Biện pháp ${suggestedMeasures.length + 1}: ...`]);
  };

  // --- STEP 3: WRITE DEEP CONTENT ---
  const handleWriteDeepContent = async () => {
    if (!validateRequest()) return;

    setMeasureMode('writing');
    setIsGenerating(true);
    let fullContent = "III.3. CÁC BIỆN PHÁP THỰC HIỆN\n\nDưới đây là các biện pháp cụ thể tôi đã áp dụng:\n\n";
    
    try {
      // Loop through each measure sequentially
      for (let i = 0; i < suggestedMeasures.length; i++) {
        
        // --- LOGIC NGHỈ GIỮA CÁC BƯỚC (QUAN TRỌNG) ---
        if (i > 0) {
          // Từ biện pháp thứ 2 trở đi, nghỉ 20s
          // Nhưng không hiện là "Nghỉ", mà hiện các thông báo tích cực
          await smartWait(DEEP_DIVE_DELAY, `Đang nghiên cứu sâu biện pháp số ${i + 1}`);
        } else {
           // Biện pháp đầu tiên: Vẫn kiểm tra throttling chung nếu vừa bấm nút khác xong
           await checkAndApplyThrottling();
        }

        setLoadingMsg(`Đang viết chi tiết: ${suggestedMeasures[i]}...`);
        setWritingProgress(Math.round(((i) / suggestedMeasures.length) * 100));
        
        const detail = await generateMeasureDetail({
          sectionId: section.id,
          userContext,
          documentState
        }, suggestedMeasures[i], i);

        fullContent += detail + "\n\n";
        
        // Update document state incrementally (optional, but safer)
        onUpdate({ [section.id]: fullContent });
      }

      setLoadingMsg("Đang tổng hợp và hoàn thiện văn bản...");
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      onUpdate({ [section.id]: fullContent });
      setMeasureMode('done');
      notify("Đã viết xong tất cả biện pháp!", "success");
      
      lastApiCallTime.current = Date.now();

    } catch (error: any) {
      console.error(error);
      notify(`Lỗi khi viết biện pháp: ${error.message}`, "error");
    } finally {
      setIsGenerating(false);
      setWritingProgress(0);
    }
  };

  // --- STANDARD GENERATION (OTHER SECTIONS) ---
  const handleStandardGenerate = async () => {
    if (!validateRequest()) return;
    
    setIsGenerating(true);
    setLoadingMsg(MOCK_LOADING_MESSAGES[0]);

    try {
      // 1. Kiểm tra rate limit
      await checkAndApplyThrottling();

      // 2. Gọi API
      const content = await generateSectionContent({
        sectionId: section.id,
        userContext,
        documentState
      });
      
      onUpdate({ [section.id]: content });
      notify("Đã viết xong nội dung!", "success");
      
      // 3. Ghi lại thời gian
      lastApiCallTime.current = Date.now();

    } catch (error: any) {
      console.error(error);
      notify(error.message || "Có lỗi xảy ra khi tạo nội dung.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  // RENDER GENERAL INFO
  if (section.id === SectionId.GENERAL_INFO) {
    return (
      <div className="p-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white rounded-2xl shadow-sm border border-indigo-50 p-8">
          <div className="flex items-center gap-3 mb-6 text-indigo-800">
            <Sparkles className="fill-indigo-100" />
            <h2 className="text-2xl font-bold">Thiết lập thông tin chung</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tên đề tài sáng kiến</label>
              <input 
                type="text" 
                value={localTopic}
                onChange={(e) => setLocalTopic(e.target.value)}
                placeholder={section.placeholder}
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white text-black placeholder-gray-400 font-medium"
                disabled={isLocked}
              />
              <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                <Lightbulb size={12} className="text-yellow-500" />
                Mẹo: Tên đề tài nên chứa "Biện pháp" và "Đối tượng áp dụng".
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Lĩnh vực / Môn học</label>
                <input 
                  type="text" 
                  value={localSubject}
                  onChange={(e) => setLocalSubject(e.target.value)}
                  placeholder="Ví dụ: Toán học, Tiếng Việt..."
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white text-black placeholder-gray-400"
                  disabled={isLocked}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Khối lớp áp dụng</label>
                <input 
                  type="text" 
                  value={localGrade}
                  onChange={(e) => setLocalGrade(e.target.value)}
                  placeholder="Ví dụ: Lớp 5"
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white text-black placeholder-gray-400"
                  disabled={isLocked}
                />
              </div>
            </div>

            <button 
              onClick={handleGeneralInfoSave}
              disabled={isLocked}
              className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 disabled:bg-gray-400 disabled:shadow-none"
            >
              <Save size={18} /> Lưu thông tin
            </button>
          </div>
        </div>
        
        {/* LOCKED OVERLAY */}
        {isLocked && (
           <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
             <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-2xl animate-in zoom-in-95">
               <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Lock size={32} className="text-red-600" />
               </div>
               <h3 className="text-xl font-bold text-gray-900 mb-2">Tài khoản hết lượt sử dụng</h3>
               <p className="text-gray-500 mb-6">
                 Vui lòng nạp thêm lượt để mở khóa tính năng chỉnh sửa và sử dụng AI nâng cao.
               </p>
               <button className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors">
                 Nạp ngay
               </button>
             </div>
           </div>
        )}
      </div>
    );
  }

  // RENDER SECTIONS
  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden relative">
      
      {/* LOCKED OVERLAY FOR SECTIONS */}
      {isLocked && (
          <div className="absolute inset-0 bg-white/60 z-10 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-6">
            <div className="bg-white p-8 rounded-2xl shadow-2xl border border-red-100 max-w-lg">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Lock size={32} className="text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Tính năng bị khóa</h2>
              <p className="text-gray-600 mb-6">
                Bạn đã sử dụng hết lượt miễn phí. Để tiếp tục soạn thảo và sử dụng AI, vui lòng nạp thêm lượt.
              </p>
              <button className="px-8 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg hover:shadow-red-200">
                Mở khóa ngay
              </button>
            </div>
          </div>
      )}

      {/* LEFT: INPUT AREA */}
      <div className={`w-1/3 border-r border-gray-200 bg-white flex flex-col ${isLocked ? 'pointer-events-none opacity-50' : ''}`}>
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">{section.title}</h2>
            <p className="text-sm text-gray-500 leading-relaxed">{section.description}</p>
          </div>

          {/* Guide Button */}
          {section.guideContent && (
             <div className="mb-4">
               <button 
                onClick={() => setShowGuide(!showGuide)}
                className="text-xs font-bold text-teal-600 flex items-center gap-1 hover:text-teal-700 bg-teal-50 px-3 py-2 rounded-lg border border-teal-100 w-full justify-center transition-colors"
               >
                 <Lightbulb size={14} /> 
                 {showGuide ? "Ẩn hướng dẫn" : "💡 Hướng dẫn viết (Gợi ý chuyên môn)"}
               </button>
               
               {showGuide && (
                 <div className="mt-2 p-4 bg-teal-50 rounded-xl border border-teal-100 text-sm text-teal-900 whitespace-pre-line leading-relaxed animate-in slide-in-from-top-2">
                   {section.guideContent}
                 </div>
               )}
             </div>
          )}

          {/* DEEP DIVE UI FOR MEASURES SECTION */}
          {section.id === SectionId.MEASURES ? (
            <div className="space-y-4">
              {/* STEP 1: INITIAL */}
              {measureMode === 'init' && (
                <>
                  <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <p className="text-sm font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                       <Sparkles size={16} /> Chế độ viết sâu (Deep Dive)
                    </p>
                    <p className="text-xs text-indigo-700 mb-4">
                      AI sẽ đề xuất tên các biện pháp trước. Bạn có thể chỉnh sửa danh sách này, sau đó AI sẽ viết chi tiết từng biện pháp một để đảm bảo độ dài và chất lượng.
                    </p>
                    
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                       Gợi ý thêm cho AI (Tùy chọn)
                    </label>
                    <textarea 
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm h-24 focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-white text-black"
                      placeholder="Ví dụ: Tập trung vào trò chơi học tập, ứng dụng CNTT..."
                      value={userContext}
                      onChange={(e) => setUserContext(e.target.value)}
                    />
                  </div>

                  <button
                    onClick={handleSuggestMeasures}
                    disabled={isGenerating}
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold shadow-lg shadow-indigo-200 flex justify-center items-center gap-2"
                  >
                    {isGenerating ? <Loader2 className="animate-spin" /> : <ListPlus size={20} />}
                    Bước 1: Đề xuất tên biện pháp
                  </button>
                </>
              )}

              {/* STEP 2: REVIEW & EDIT */}
              {measureMode === 'review' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right">
                   <div className="flex justify-between items-center">
                      <h3 className="font-bold text-gray-800">Danh sách biện pháp ({suggestedMeasures.length})</h3>
                      <button onClick={handleAddMeasure} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded flex items-center gap-1 text-gray-700">
                        <ListPlus size={12} /> Thêm
                      </button>
                   </div>
                   
                   <div className="space-y-2">
                     {suggestedMeasures.map((m, idx) => (
                       <div key={idx} className="flex gap-2 items-center">
                         <span className="text-xs font-bold text-gray-400 w-4">{idx + 1}.</span>
                         <input 
                            value={m}
                            onChange={(e) => handleUpdateMeasure(idx, e.target.value)}
                            className="flex-1 p-2 text-sm border border-gray-200 rounded-lg focus:border-indigo-500 outline-none bg-white text-black"
                         />
                         <button onClick={() => handleRemoveMeasure(idx)} className="text-red-400 hover:text-red-600 p-1">
                           <Trash2 size={16} />
                         </button>
                       </div>
                     ))}
                   </div>

                   <div className="flex gap-2 pt-2">
                      <button 
                        onClick={() => setMeasureMode('init')}
                        className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-semibold"
                      >
                        Quay lại
                      </button>
                      <button 
                        onClick={handleWriteDeepContent}
                        className="flex-[2] py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-semibold flex justify-center items-center gap-2 shadow-md"
                      >
                        <Bot size={18} /> Bước 2: Viết chi tiết
                      </button>
                   </div>
                </div>
              )}

              {/* STEP 3: WRITING */}
              {measureMode === 'writing' && (
                <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 text-center space-y-4 animate-in zoom-in-95">
                   <div className="relative w-16 h-16 mx-auto">
                     <div className="absolute inset-0 border-4 border-indigo-200 rounded-full"></div>
                     <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                     <Bot className="absolute inset-0 m-auto text-indigo-600" size={24} />
                   </div>
                   
                   <div>
                     <p className="font-bold text-indigo-900 text-lg mb-1">{loadingMsg}</p>
                     <p className="text-xs text-indigo-600">Vui lòng không tắt trình duyệt...</p>
                   </div>

                   {/* Progress Bar */}
                   <div className="w-full bg-indigo-200 rounded-full h-2 overflow-hidden">
                     <div 
                        className="bg-indigo-600 h-full transition-all duration-500 ease-out"
                        style={{ width: `${writingProgress}%` }}
                     ></div>
                   </div>
                   <p className="text-xs text-indigo-500 font-mono">{writingProgress}% hoàn thành</p>
                </div>
              )}

              {/* DONE */}
              {measureMode === 'done' && (
                 <div className="text-center p-6 bg-green-50 rounded-xl border border-green-100">
                    <CheckCircle className="mx-auto text-green-500 mb-2" size={32} />
                    <p className="font-bold text-green-800">Đã hoàn thành!</p>
                    <button 
                      onClick={() => setMeasureMode('init')}
                      className="mt-4 text-sm text-indigo-600 hover:underline"
                    >
                      Viết lại từ đầu
                    </button>
                 </div>
              )}

            </div>
          ) : (
            // STANDARD UI FOR OTHER SECTIONS
            <>
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 flex justify-between">
                  {section.promptLabel || "Hướng dẫn thêm cho AI (Tùy chọn)"}
                  {userContext.length > 0 && <span className="text-indigo-600 cursor-pointer" onClick={() => setUserContext("")}>Xóa</span>}
                </label>
                <textarea 
                  className="w-full p-4 border border-gray-200 rounded-xl text-sm h-32 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none transition-all bg-white text-black placeholder-gray-400"
                  placeholder={section.placeholder}
                  value={userContext}
                  onChange={(e) => setUserContext(e.target.value)}
                />
              </div>

              <button
                onClick={handleStandardGenerate}
                disabled={isGenerating}
                className={`w-full py-3.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold shadow-lg shadow-indigo-200 flex justify-center items-center gap-2 group ${isGenerating ? 'cursor-not-allowed opacity-80' : 'hover:-translate-y-0.5'}`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span className="animate-pulse">{loadingMsg}</span>
                  </>
                ) : (
                  <>
                    <Bot size={20} className="group-hover:rotate-12 transition-transform" />
                    AI Phân tích & Gợi ý chi tiết
                  </>
                )}
              </button>
            </>
          )}

        </div>
      </div>

      {/* RIGHT: EDITOR AREA */}
      <div className={`flex-1 bg-gray-50 p-6 overflow-hidden flex flex-col ${isLocked ? 'pointer-events-none opacity-50 filter blur-[1px]' : ''}`}>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
          <div className="border-b border-gray-100 p-3 bg-gray-50 flex justify-between items-center">
             <div className="flex gap-2">
               <div className="w-3 h-3 rounded-full bg-red-400"></div>
               <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
               <div className="w-3 h-3 rounded-full bg-green-400"></div>
             </div>
             <span className="text-xs font-mono text-gray-400">editor.md</span>
          </div>
          <textarea 
            className="flex-1 w-full p-8 outline-none resize-none text-gray-800 leading-relaxed custom-scrollbar text-base bg-white placeholder-gray-300"
            placeholder="Nội dung chi tiết sẽ hiện ở đây..."
            value={documentState[section.id as keyof DocumentState] || ""}
            onChange={(e) => onUpdate({ [section.id]: e.target.value })}
            readOnly={isLocked} // Prevent manual edit if locked
          />
        </div>
        <div className="mt-2 text-right">
          <p className="text-xs text-gray-400">
            {documentState[section.id as keyof DocumentState]?.length || 0} ký tự
          </p>
        </div>
      </div>

    </div>
  );
};

export default SectionEditor;