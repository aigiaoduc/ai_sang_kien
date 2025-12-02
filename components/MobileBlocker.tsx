import React from 'react';
import { Monitor, Smartphone, XCircle } from 'lucide-react';

const MobileBlocker: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-indigo-900 to-indigo-700 flex flex-col items-center justify-center p-6 text-center text-white lg:hidden">
      <div className="bg-white/10 p-6 rounded-full mb-6 backdrop-blur-sm border border-white/20">
        <Monitor size={64} className="text-white" />
      </div>
      
      <h2 className="text-2xl font-bold mb-4 uppercase tracking-wider">Vui lòng sử dụng Máy tính</h2>
      
      <p className="text-indigo-100 max-w-sm leading-relaxed mb-8">
        Ứng dụng <strong>SKKN.AI</strong> là công cụ soạn thảo văn bản chuyên sâu, yêu cầu màn hình lớn và bàn phím vật lý để đảm bảo trải nghiệm tốt nhất.
      </p>

      <div className="flex items-center gap-4 text-sm bg-black/20 py-3 px-6 rounded-lg border border-white/10">
        <div className="flex flex-col items-center gap-1 opacity-50">
          <Smartphone size={24} />
          <span className="line-through decoration-red-500 decoration-2">Điện thoại</span>
        </div>
        <div className="h-8 w-px bg-white/20 mx-2"></div>
        <div className="flex flex-col items-center gap-1 font-bold text-green-400">
          <Monitor size={24} />
          <span>PC / Laptop</span>
        </div>
      </div>

      <div className="mt-10 text-xs text-indigo-300">
        © Bản quyền thuộc về Trần Hồng Quân
      </div>
    </div>
  );
};

export default MobileBlocker;