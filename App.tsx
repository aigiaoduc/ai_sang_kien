import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import SectionEditor from './components/SectionEditor';
import DocumentPreview from './components/DocumentPreview';
import LoginScreen from './components/LoginScreen';
import RechargeModal from './components/RechargeModal';
import ApiKeyManager from './components/ApiKeyManager';
import ToastContainer, { ToastMessage, ToastType } from './components/Toast';
import MobileBlocker from './components/MobileBlocker'; 
import { SKKN_SECTIONS } from './constants';
import { SectionId, DocumentState } from './types';
import { Eye, Loader2 } from 'lucide-react';
import { supabase, getUserProfile, logoutUser } from './services/supabaseService';

// Giá trị khởi tạo mặc định cho văn bản
const INITIAL_DOCUMENT_STATE: DocumentState = {
  topic: '',
  subject: '',
  grade: '',
  [SectionId.REASON]: '',
  [SectionId.OBJECTIVE_METHOD]: '',
  [SectionId.THEORY]: '',
  [SectionId.REALITY]: '',
  [SectionId.MEASURES]: '',
  [SectionId.NEW_POINTS]: '',
  [SectionId.EFFECTIVENESS]: '',
  [SectionId.CONCLUSION]: '',
  [SectionId.RECOMMENDATION]: '',
  [SectionId.REFERENCES]: ''
};

const STORAGE_KEY = 'skkn_document_data';

const App: React.FC = () => {
  // Auth State
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [credits, setCredits] = useState<number | null>(null);

  // App State
  const [activeSectionId, setActiveSectionId] = useState<SectionId>(SectionId.GENERAL_INFO);
  const [showPreview, setShowPreview] = useState(false);
  const [showRecharge, setShowRecharge] = useState(false);
  const [showSettings, setShowSettings] = useState(false); // New state for Settings Modal
  
  // Auto-save State Initialization
  const [documentState, setDocumentState] = useState<DocumentState>(() => {
    // 1. Thử lấy từ LocalStorage trước
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Lỗi đọc cache, dùng mặc định", e);
        }
      }
    }
    // 2. Nếu không có, dùng mặc định
    return INITIAL_DOCUMENT_STATE;
  });

  // Toast State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // --- TOAST MANAGER ---
  const notify = (message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 3s
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // --- AUTO SAVE EFFECT ---
  useEffect(() => {
    if (documentState) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(documentState));
    }
  }, [documentState]);
  
  // Init Auth & Listen for changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);
      if (session) {
        fetchCredits(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoadingSession(false);
      
      if (session) {
        fetchCredits(session.user.id);
      } else {
        // Nếu mất session (F5), giữ nguyên documentState (nhờ LocalStorage)
        // Chỉ reset Credits
        setCredits(null);
        setShowRecharge(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchCredits = async (userId: string) => {
    try {
      const profile = await getUserProfile(userId);
      if (profile) {
        setCredits(profile.credits);
      } else {
        setCredits(0);
      }
    } catch (e) {
      console.error("Failed to fetch credits", e);
      setCredits(0);
    }
  };

  const handleUpdateDocument = (data: Partial<DocumentState>) => {
    setDocumentState(prev => ({
      ...prev,
      ...data
    }));
  };

  // Hàm Force Logout: Xóa session và XÓA SẠCH DỮ LIỆU
  const handleForceLogout = async () => {
    // 1. Xóa dữ liệu cục bộ để bảo mật
    localStorage.removeItem(STORAGE_KEY);
    setDocumentState(INITIAL_DOCUMENT_STATE);
    
    // 2. Reset UI
    setSession(null);
    setCredits(null);
    
    // 3. Gọi API đăng xuất
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  // --- RENDER ---
  
  // Mobile Blocker Render Logic (Always render first)
  // Logic inside MobileBlocker component handles visibility via CSS (lg:hidden)

  if (loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        {/* <MobileBlocker /> Ensure blocker shows even during load */}
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-indigo-600" size={48} />
          <p className="text-gray-500 font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  // If not logged in, show Login Screen
  if (!session) {
    return (
      <>
        {/* <MobileBlocker /> */}
        <LoginScreen onLoginSuccess={() => {}} />
      </>
    );
  }

  const isLocked = credits !== null && credits <= 0;
  const activeSectionDef = SKKN_SECTIONS.find(s => s.id === activeSectionId) || SKKN_SECTIONS[0];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Mobile Blocker Overlay - TEMPORARILY DISABLED */}
      {/* <MobileBlocker /> */}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Sidebar Navigation */}
      <Sidebar 
        activeSection={activeSectionId} 
        onSelectSection={setActiveSectionId} 
        documentState={documentState}
        credits={credits}
        onOpenRecharge={() => setShowRecharge(true)}
        onLogout={handleForceLogout}
        onOpenSettings={() => setShowSettings(true)}
        notify={notify}
      />

      {/* Main Content */}
      <main className="ml-64 w-full relative">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-10 flex justify-between items-center px-8 shadow-sm">
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-500">Đang soạn thảo:</span>
            <span className="ml-2 font-bold text-gray-800">
               {documentState.topic ? (documentState.topic.length > 50 ? documentState.topic.substring(0, 50) + '...' : documentState.topic) : "Chưa có tên đề tài"}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-full transition-colors"
            >
              <Eye size={18} />
              Xem toàn văn
            </button>
          </div>
        </header>

        {/* Editor Area */}
        <SectionEditor 
          section={activeSectionDef}
          documentState={documentState}
          onUpdate={handleUpdateDocument}
          credits={credits}
          isLocked={isLocked}
          notify={notify}
        />
      </main>

      {/* Preview Modal */}
      {showPreview && (
        <DocumentPreview 
          documentState={documentState}
          onClose={() => setShowPreview(false)}
          notify={notify}
        />
      )}

      {/* Recharge Modal */}
      {showRecharge && (
        <RechargeModal 
          userEmail={session.user.email} 
          onClose={() => setShowRecharge(false)} 
        />
      )}

      {/* Api Key Manager Modal */}
      {showSettings && (
        <ApiKeyManager 
          onClose={() => setShowSettings(false)}
          notify={notify}
        />
      )}
    </div>
  );
};

export default App;