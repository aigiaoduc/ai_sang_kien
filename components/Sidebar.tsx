import React from 'react';
import { SKKN_SECTIONS } from '../constants';
import { SectionId, DocumentState } from '../types';
import { CheckCircle, Circle, FileText, Zap, LogOut, PlusCircle, AlertTriangle, Settings } from 'lucide-react';
import { ToastType } from './Toast';

interface SidebarProps {
  activeSection: SectionId;
  onSelectSection: (id: SectionId) => void;
  documentState: DocumentState;
  credits: number | null;
  onOpenRecharge: () => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  notify: (msg: string, type: ToastType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSelectSection, documentState, credits, onOpenRecharge, onLogout, onOpenSettings }) => {
  const hasContent = (id: SectionId) => {
    if (id === SectionId.GENERAL_INFO) {
      return documentState.topic && documentState.subject;
    }
    const content = documentState[id as keyof DocumentState];
    return content && content.trim().length > 0;
  };

  const handleLogoutClick = () => {
    if (window.confirm("Bạn có chắc muốn đăng xuất? (Sẽ bị trừ 1 lượt khi đăng nhập lại)")) {
      onLogout();
    }
  }

  const isOutOfCredits = credits !== null && credits <= 0;

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col fixed left-0 top-0 overflow-y-auto z-20 shadow-sm select-none">
      <div className="p-6 border-b border-gray-100 bg-gradient-to-b from-indigo-50 to-white">
        
        {/* LOGO */}
        <div className="flex items-center gap-2 text-indigo-700 mb-1 pointer-events-none">
          <FileText size={24} className="fill-indigo-600 text-white" />
          <h1 className="font-extrabold text-xl tracking-tight">SKKN.AI</h1>
        </div>

        <p className="text-[10px] text-gray-500 font-medium ml-8 uppercase tracking-widest select-none">Trợ lý Sư phạm</p>
        
        {/* Credit Badge */}
        <div 
          className={`mt-5 border rounded-xl p-3 shadow-sm relative overflow-hidden group transition-all duration-300 ${
            isOutOfCredits 
              ? 'bg-red-50 border-red-200 animate-pulse' 
              : 'bg-white border-indigo-100'
          }`}
        >
           {/* Thanh màu bên trái */}
           <div className={`absolute top-0 left-0 w-1 h-full ${isOutOfCredits ? 'bg-red-500' : 'bg-yellow-400'}`}></div>
           
           <div className="flex justify-between items-center mb-1">
             <span className={`text-xs font-medium uppercase ${isOutOfCredits ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
               {isOutOfCredits ? 'HẾT LƯỢT DÙNG' : 'Số dư tài khoản'}
             </span>
             {isOutOfCredits ? (
               <AlertTriangle size={14} className="text-red-500 animate-bounce" />
             ) : (
               <Zap size={14} className="text-yellow-500 fill-yellow-500" />
             )}
           </div>
           
           <div className="flex items-end justify-between">
              <div className={`text-2xl font-bold leading-none ${isOutOfCredits ? 'text-red-600' : 'text-gray-800'}`}>
                {credits !== null ? credits : '-'}
              </div>
              <button 
                onClick={onOpenRecharge}
                className={`text-xs px-2 py-1 rounded flex items-center gap-1 transition-colors animate-bounce font-bold shadow-sm ${
                  isOutOfCredits 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
                style={{ animationDuration: '2s' }}
              >
                <PlusCircle size={10} />
                Nạp ngay
              </button>
           </div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {SKKN_SECTIONS.map((section) => {
          const isActive = activeSection === section.id;
          const completed = hasContent(section.id);

          return (
            <button
              key={section.id}
              onClick={() => onSelectSection(section.id)}
              className={`w-full text-left px-3 py-3 rounded-lg flex items-center gap-3 transition-all duration-200 group ${
                isActive 
                  ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm translate-x-1' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex-shrink-0 transition-transform group-hover:scale-110">
                {completed ? (
                  <CheckCircle size={18} className="text-green-500 fill-green-50" />
                ) : (
                  <Circle size={18} className={isActive ? "text-indigo-600 fill-indigo-100" : "text-gray-300"} />
                )}
              </div>
              <span className={`text-sm truncate ${isActive ? 'text-indigo-800' : ''}`}>{section.title}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100 bg-gray-50 space-y-2">
         <button 
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 py-2 px-3 rounded-lg transition-colors text-sm font-medium"
        >
          <Settings size={16} />
          Cấu hình API Key
        </button>

        <button 
          onClick={handleLogoutClick}
          className="w-full flex items-center gap-2 text-gray-500 hover:text-red-600 hover:bg-red-50 py-2 px-3 rounded-lg transition-colors text-sm font-medium"
        >
          <LogOut size={16} />
          Đăng xuất an toàn
        </button>
      </div>
      
      <div className="h-4"></div> 
    </div>
  );
};

export default Sidebar;