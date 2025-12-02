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
    let interval: number;
    if (isGenerating && measureMode !== 'writing') {
      // Nếu đang trong smartWait, loadingMsg sẽ được cập nhật bởi hàm đó, effect này không nên can thiệp
      // Tuy nhiên logic cũ vẫn giữ cho các trường hợp đơn giản
    }
    return () => clearInterval(interval);
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
        
        // Update content incrementally (real-time feel)
        onUpdate({ [section.id]: fullContent });
        
        // Ghi nhận thời gian gọi xong
        lastApiCallTime.current = Date.now();
      }

      setWritingProgress(100);
      setMeasureMode('done');
      notify("Đã hoàn thành viết chi tiết tất cả biện pháp!", "success");

    } catch (error: any) {
      console.error(error);
      notify("Lỗi trong quá trình viết chi tiết. Vui lòng thử lại sau ít phút.", "error");
      setMeasureMode('review');
    } finally {
      setIsGenerating(false);
    }
  };

  // --- STANDARD GENERATION (Legacy for other sections) ---
  const handleStandardGenerate = async () => {
    if (!validateRequest()) return;

    setIsGenerating(true);
    setLoadingMsg("AI đang phân tích yêu cầu...");

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
      notify("AI đã tạo nội dung thành công!", "success");
      
      // 3. Ghi lại thời gian
      lastApiCallTime.current = Date.now();

    } catch (error: any) {
      console.error(error);
      notify(`Lỗi: ${error.message || "Hệ thống đang bận, vui lòng thử lại sau 10 giây."}`, "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const currentContent = section.id === SectionId.GENERAL_INFO 
    ? '' 
    : (documentState[section.id as keyof DocumentState] as string) || '';

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
     onUpdate({ [section.id]: e.target.value });
  };

  // --- RENDER: GENERAL INFO FORM ---
  if (section.id === SectionId.GENERAL_INFO) {
    return (
      <div className="max-w-3xl mx-auto pt-10 px-6 relative">
        {/* LOCKED OVERLAY */}
        {isLocked && (
          <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl">
            <div className="bg-red-50 border border-red-200 p-6 rounded-xl shadow-lg max-w-md text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-red-800 mb-2">Tài khoản hết lượt</h3>
              <p className="text-red-700 mb-4">Vui lòng nạp thêm lượt để mở khóa tính năng chỉnh sửa và lưu thông tin.</p>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{section.title}</h2>
          <p className="text-gray-500">{section.description}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
           {section.guideContent && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-900 text-sm leading-relaxed mb-4">
               <div className="flex items-center gap-2 font-bold mb-2 text-amber-700">
                  <Lightbulb size={18} />
                  Gợi ý chuyên môn
               </div>
               <div className="whitespace-pre-line pl-6">{section.guideContent}</div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên đề tài SKKN</label>
            <input
              type="text"
              value={localTopic}
              onChange={(e) => setLocalTopic(e.target.value)}
              placeholder="Ví dụ: Một số biện pháp giúp học sinh lớp 4 học tốt phân môn Lịch sử"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none bg-white text-black"
              disabled={isLocked}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Môn học / Lĩnh vực</label>
              <input
                type="text"
                value={localSubject}
                onChange={(e) => setLocalSubject(e.target.value)}
                placeholder="Ví dụ: Lịch sử, Toán, Công tác chủ nhiệm..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-black"
                disabled={isLocked}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Khối lớp áp dụng</label>
              <input
                type="text"
                value={localGrade}
                onChange={(e) => setLocalGrade(e.target.value)}
                placeholder="Ví dụ: Lớp 4"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-black"
                disabled={isLocked}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleGeneralInfoSave}
              disabled={isLocked}
              className={`flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Save size={18} />
              Lưu thông tin
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER: CONTENT GENERATOR SECTIONS ---
  return (
    <div className="max-w-4xl mx-auto pt-6 px-6 pb-20 relative">
       {/* LOCKED OVERLAY */}
       {isLocked && (
          <div className="absolute inset-0 z-50 bg-white/70 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-xl h-full">
            <div className="bg-white border-2 border-red-100 p-8 rounded-2xl shadow-2xl max-w-lg text-center transform scale-100">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Lock className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Đã hết lượt sử dụng</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Tài khoản của bạn đã hết lượt (Credits: 0). <br/>
                Vui lòng nạp thêm lượt để tiếp tục sử dụng AI và chỉnh sửa văn bản.
              </p>
              <div className="text-sm font-medium text-indigo-600 bg-indigo-50 py-2 px-4 rounded-full inline-block">
                Bấm vào nút "Nạp ngay" trên thanh bên trái
              </div>
            </div>
          </div>
        )}

      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{section.title}</h2>
          <p className="text-sm text-gray-500">{section.description}</p>
        </div>
        
        {section.guideContent && (
          <button
            onClick={() => setShowGuide(!showGuide)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border shadow-sm ${
              showGuide 
                ? 'bg-amber-100 text-amber-800 border-amber-200' 
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Lightbulb size={18} className={showGuide ? "text-amber-600" : "text-gray-400"} />
            {showGuide ? "Ẩn gợi ý" : "Gợi ý viết chuẩn"}
          </button>
        )}
      </div>

      {showGuide && section.guideContent && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
           <div className="flex justify-between items-start mb-2">
             <h4 className="font-bold text-amber-800 flex items-center gap-2">
               <Lightbulb size={20} className="text-amber-600" />
               Hướng dẫn chuyên môn
             </h4>
             <button onClick={() => setShowGuide(false)} className="text-amber-600 hover:bg-amber-100 rounded p-1">
               <X size={16} />
             </button>
           </div>
           <div className="text-amber-900 text-sm whitespace-pre-line leading-relaxed pl-7">
             {section.guideContent}
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className={`p-4 rounded-xl border shadow-sm sticky top-4 transition-all duration-300 bg-white border-indigo-100 ${isLocked ? 'opacity-50' : ''}`}>
            
            {/* Header Box AI */}
            <div className="flex items-center justify-between mb-3 border-b border-indigo-50 pb-2">
              <div className="flex items-center gap-2 font-semibold text-indigo-700">
                <Bot size={20} />
                <h3>Trợ lý AI</h3>
              </div>
              {!isLocked && (
                <span className="text-xs font-bold px-2 py-1 rounded-full border text-green-600 bg-green-50 border-green-100">
                  Đã sẵn sàng
                </span>
              )}
            </div>

            {/* SPECIAL RENDER FOR MEASURES SECTION (DEEP DIVE MODE) */}
            {section.id === SectionId.MEASURES ? (
              <div className="space-y-4">
                 {measureMode === 'init' && (
                    <>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Chế độ chuyên sâu: AI sẽ đề xuất danh sách biện pháp trước, bạn duyệt xong AI mới viết chi tiết từng cái.
                      </p>
                      <button
                        onClick={handleSuggestMeasures}
                        disabled={isGenerating || isLocked}
                        className="w-full mt-2 flex justify-center items-center gap-2 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-md"
                      >
                         {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <ListPlus size={16} />}
                         Bước 1: Đề xuất tên Biện pháp
                      </button>
                    </>
                 )}

                 {measureMode === 'suggesting' && (
                    <div className="text-center py-6">
                      <Loader2 size={32} className="animate-spin text-indigo-600 mx-auto mb-2" />
                      <p className="text-xs text-indigo-600 font-medium">{loadingMsg}</p>
                    </div>
                 )}

                 {(measureMode === 'review' || measureMode === 'writing' || measureMode === 'done') && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                         <span className="text-xs font-bold text-gray-700">Danh sách biện pháp:</span>
                         {measureMode === 'review' && (
                            <button onClick={handleAddMeasure} className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                              <ListPlus size={12} /> Thêm
                            </button>
                         )}
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                         {suggestedMeasures.map((measure, idx) => (
                           <div key={idx} className="group bg-gray-50 p-2 rounded border border-gray-200 text-xs">
                              {measureMode === 'review' ? (
                                <div className="flex gap-2">
                                   <input 
                                     className="flex-1 bg-transparent outline-none border-b border-transparent focus:border-indigo-300 text-black"
                                     value={measure}
                                     onChange={(e) => handleUpdateMeasure(idx, e.target.value)}
                                   />
                                   <button onClick={() => handleRemoveMeasure(idx)} className="text-red-400 hover:text-red-600">
                                      <Trash2 size={12} />
                                   </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-gray-700">
                                   {measureMode === 'writing' && idx < Math.floor((writingProgress/100) * suggestedMeasures.length) ? (
                                      <CheckCircle size={12} className="text-green-500" />
                                   ) : (
                                      <span className="w-3 h-3 rounded-full bg-gray-300"></span>
                                   )}
                                   <span>{measure}</span>
                                </div>
                              )}
                           </div>
                         ))}
                      </div>

                      {measureMode === 'review' && (
                        <button
                          onClick={handleWriteDeepContent}
                          disabled={isGenerating || isLocked || suggestedMeasures.length === 0}
                          className="w-full mt-2 flex justify-center items-center gap-2 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium text-sm shadow-md"
                        >
                           <Play size={16} />
                           Bước 2: Viết chi tiết (Deep Dive)
                        </button>
                      )}

                      {measureMode === 'writing' && (
                        <div>
                          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden mb-1">
                             <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${writingProgress}%` }}></div>
                          </div>
                          <p className="text-[10px] text-center text-indigo-500 animate-pulse">{loadingMsg}</p>
                        </div>
                      )}

                      {measureMode === 'done' && (
                        <button
                          onClick={() => setMeasureMode('init')}
                          className="w-full mt-2 flex justify-center items-center gap-2 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-xs"
                        >
                           <Edit3 size={14} />
                           Làm lại từ đầu
                        </button>
                      )}
                    </div>
                 )}
              </div>
            ) : (
              // STANDARD RENDER FOR OTHER SECTIONS
              <>
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                  AI sẽ tự động phân tích đề tài và ngữ cảnh để viết nội dung.
                </p>

                <label className="block text-xs text-indigo-600 mb-2 font-medium">
                  {section.promptLabel}
                </label>
                
                <textarea
                  className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none resize-none bg-white text-black placeholder-gray-400"
                  rows={4}
                  placeholder={section.placeholder}
                  value={userContext}
                  onChange={(e) => setUserContext(e.target.value)}
                  disabled={isGenerating || isLocked}
                />

                <button
                  onClick={handleStandardGenerate}
                  disabled={isGenerating || isLocked}
                  className={`w-full mt-4 flex justify-center items-center gap-2 py-3 rounded-lg transition-all font-medium text-sm shadow-md ${
                    isGenerating || isLocked
                      ? 'bg-gray-300 cursor-not-allowed text-gray-500 shadow-none' 
                      : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg text-white transform hover:-translate-y-0.5 active:translate-y-0'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Đang xử lý...
                    </>
                  ) : isLocked ? (
                    <>
                      <Lock size={16} />
                      Đã khóa
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      AI Phân tích & Gợi ý
                    </>
                  )}
                </button>

                {isGenerating && (
                    <p className="text-xs text-center mt-3 text-indigo-500 animate-pulse font-medium">{loadingMsg}</p>
                )}
              </>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
           <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[70vh] ${isLocked ? 'opacity-50' : ''}`}>
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                  <Save size={14} />
                  Soạn thảo văn bản
                </span>
                <span className="text-xs text-indigo-500 bg-indigo-50 px-2 py-1 rounded-full border border-indigo-100">Markdown enabled</span>
              </div>
              <textarea
                className="flex-1 w-full p-6 outline-none resize-none text-black bg-white leading-relaxed font-normal text-base"
                style={{ fontFamily: 'Inter, sans-serif' }}
                placeholder={isLocked ? "Nội dung bị khóa..." : "Nội dung AI gợi ý sẽ xuất hiện ở đây. Bạn có thể chỉnh sửa lại theo ý muốn..."}
                value={currentContent}
                onChange={handleContentChange}
                disabled={isLocked}
              />
           </div>
           <div className="mt-2 text-right">
              <span className="text-xs text-green-600 italic flex items-center justify-end gap-1">
                <CheckCircle size={12} /> Tự động lưu
              </span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SectionEditor;