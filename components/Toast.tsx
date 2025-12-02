import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: number) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border w-80 transform transition-all duration-300 animate-in slide-in-from-right
            ${toast.type === 'success' ? 'bg-white border-green-200 text-green-800' : ''}
            ${toast.type === 'error' ? 'bg-white border-red-200 text-red-800' : ''}
            ${toast.type === 'warning' ? 'bg-white border-amber-200 text-amber-800' : ''}
            ${toast.type === 'info' ? 'bg-white border-blue-200 text-blue-800' : ''}
          `}
        >
          <div className="flex-shrink-0 mt-0.5">
            {toast.type === 'success' && <CheckCircle size={20} className="text-green-500" />}
            {toast.type === 'error' && <AlertCircle size={20} className="text-red-500" />}
            {toast.type === 'warning' && <AlertTriangle size={20} className="text-amber-500" />}
            {toast.type === 'info' && <Info size={20} className="text-blue-500" />}
          </div>
          <p className="flex-1 text-sm font-medium leading-relaxed">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;