import React, { useState, useEffect } from 'react';
import { Key, Save, Eye, EyeOff, CheckCircle, ExternalLink, Trash2 } from 'lucide-react';
import { ToastType } from './Toast';

interface ApiKeyManagerProps {
  onClose: () => void;
  notify: (msg: string, type: ToastType) => void;
}

const STORAGE_KEY_API = 'user_api_key';

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ onClose, notify }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY_API);
    if (stored) {
      setSavedKey(stored);
      setApiKey(stored);
    }
  }, []);

  const handleSave = () => {
    if (!apiKey.trim()) {
      notify('Vui lòng nhập API Key hợp lệ', 'error');
      return;
    }
    localStorage.setItem(STORAGE_KEY_API, apiKey.trim());
    setSavedKey(apiKey.trim());
    notify('Đã lưu API Key thành công!', 'success');
  };

  const handleDelete = () => {
    localStorage.removeItem(STORAGE_KEY_API);
    setSavedKey(null);
    setApiKey('');
    notify('Đã xóa API Key khỏi thiết bị', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
              <Key size={24} className="text-white" />
            </div>
            <h2 className="text-xl font-bold">Cấu hình Gemini API Key</h2>
          </div>
          <p className="text-indigo-100 text-sm opacity-90">
            Sử dụng API Key cá nhân để đảm bảo tốc độ và sự riêng tư. Key chỉ được lưu trên trình duyệt của bạn.
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex justify-between">
              Nhập Gemini API Key
              {savedKey && <span className="text-green-600 text-xs flex items-center gap-1"><CheckCircle size={12}/> Đang sử dụng key cá nhân</span>}
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all font-mono text-sm"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm text-gray-600">
            <p className="mb-2 font-medium flex items-center gap-2">
              <ExternalLink size={14} /> Cách lấy API Key miễn phí:
            </p>
            <ol className="list-decimal pl-5 space-y-1 text-xs">
              <li>Truy cập <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-purple-600 hover:underline font-bold">Google AI Studio</a>.</li>
              <li>Đăng nhập bằng tài khoản Google.</li>
              <li>Nhấn <strong>Create API key</strong>.</li>
              <li>Copy và dán vào ô bên trên.</li>
            </ol>
          </div>

          <div className="flex gap-3 pt-2">
             {savedKey && (
              <button
                onClick={handleDelete}
                className="px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
              >
                <Trash2 size={16} /> Xóa Key
              </button>
            )}
            <div className="flex-1"></div>
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium text-sm transition-colors"
            >
              Đóng
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-purple-600 text-white hover:bg-purple-700 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 shadow-lg shadow-purple-200"
            >
              <Save size={16} /> Lưu cài đặt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyManager;