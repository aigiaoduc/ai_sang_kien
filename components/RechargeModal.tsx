import React, { useState } from 'react';
import { X, Check, Copy, CreditCard, MessageSquare } from 'lucide-react';

interface RechargeModalProps {
  userEmail: string;
  onClose: () => void;
}

const PACKAGES = [
  {
    id: 'COBAN',
    name: 'Gói Cơ Bản',
    credits: 4,
    price: 100000,
    priceStr: '100.000đ',
    perCredit: '25k/lượt',
    features: ['Dành cho GV viết ít', 'Hỗ trợ cơ bản', 'Lưu trữ vĩnh viễn'],
    color: 'bg-blue-50 border-blue-200 text-blue-900',
    btnColor: 'bg-blue-600 hover:bg-blue-700',
    recommended: false
  },
  {
    id: 'NANGCAO',
    name: 'Gói Nâng Cao',
    credits: 10,
    price: 200000,
    priceStr: '200.000đ',
    perCredit: '20k/lượt',
    features: ['Tiết kiệm 20%', 'Viết được 2-3 đề tài', 'Ưu tiên hỗ trợ Zalo'],
    color: 'bg-indigo-50 border-indigo-200 text-indigo-900',
    btnColor: 'bg-indigo-600 hover:bg-indigo-700',
    recommended: true
  },
  {
    id: 'VIP',
    name: 'Gói VIP',
    credits: 30,
    price: 500000,
    priceStr: '500.000đ',
    perCredit: '16k/lượt',
    features: ['Tiết kiệm 35%', 'Dùng cho cả tổ/nhóm', 'Hỗ trợ 1-1 nhanh chóng'],
    color: 'bg-amber-50 border-amber-200 text-amber-900',
    btnColor: 'bg-amber-600 hover:bg-amber-700',
    recommended: false
  }
];

const RechargeModal: React.FC<RechargeModalProps> = ({ userEmail, onClose }) => {
  const [selectedPackage, setSelectedPackage] = useState(PACKAGES[0]);

  // Tạo cú pháp chuyển khoản: email_TenGoi (Bỏ phần @domain cho ngắn nếu cần, nhưng để full cho chắc)
  // Ví dụ: namnguyen@gmail.com_COBAN
  const transferSyntax = `${userEmail}_${selectedPackage.id}`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`Đã sao chép: ${text}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        
        {/* LEFT COLUMN: PACKAGES */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Chọn gói nạp</h2>
            <button onClick={onClose} className="md:hidden p-2 text-gray-500 bg-gray-100 rounded-full">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {PACKAGES.map((pkg) => (
              <div 
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg)}
                className={`relative border-2 rounded-xl p-5 cursor-pointer transition-all ${
                  selectedPackage.id === pkg.id 
                    ? 'border-indigo-600 shadow-md transform scale-[1.02]' 
                    : 'border-gray-100 hover:border-gray-300'
                } ${pkg.color}`}
              >
                {pkg.recommended && (
                  <div className="absolute -top-3 right-4 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                    KHUYÊN DÙNG
                  </div>
                )}
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="font-bold text-lg">{pkg.name}</h3>
                    <p className="text-xs opacity-80">{pkg.perCredit}</p>
                  </div>
                  <div className="text-xl font-extrabold">{pkg.priceStr}</div>
                </div>
                <ul className="text-sm space-y-1 opacity-90">
                  {pkg.features.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check size={14} /> {feat}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
             <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <MessageSquare size={20} className="text-blue-600" />
                <div>
                  <p className="font-bold text-gray-800">Hỗ trợ & Kích hoạt nhanh:</p>
                  <p>Zalo: <span className="font-bold text-blue-700 select-all">0355213107</span> (Trần Hồng Quân)</p>
                </div>
             </div>
          </div>
        </div>

        {/* RIGHT COLUMN: BANKING INFO */}
        <div className="md:w-[400px] bg-indigo-900 text-white p-6 md:p-8 flex flex-col relative">
          <button onClick={onClose} className="hidden md:block absolute top-4 right-4 p-2 text-white/50 hover:text-white transition-colors">
            <X size={24} />
          </button>

          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <CreditCard size={24} />
            Thông tin chuyển khoản
          </h2>

          <div className="flex-1 space-y-6">
            <div className="bg-white/10 p-4 rounded-xl border border-white/20 backdrop-blur-sm">
              <p className="text-indigo-200 text-xs uppercase font-bold mb-1">Ngân hàng</p>
              <p className="text-lg font-bold">Vietcombank</p>
            </div>

            <div className="bg-white/10 p-4 rounded-xl border border-white/20 backdrop-blur-sm group relative">
              <p className="text-indigo-200 text-xs uppercase font-bold mb-1">Số tài khoản</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-mono font-bold tracking-wider">1022936211</p>
                <button 
                  onClick={() => handleCopy('1022936211')}
                  className="p-1.5 bg-white/20 rounded hover:bg-white/30 transition-colors"
                  title="Sao chép"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>

            <div className="bg-white/10 p-4 rounded-xl border border-white/20 backdrop-blur-sm">
              <p className="text-indigo-200 text-xs uppercase font-bold mb-1">Chủ tài khoản</p>
              <p className="text-lg font-bold uppercase">TRAN HONG QUAN</p>
            </div>

            <div className="bg-white p-4 rounded-xl text-gray-900 shadow-lg">
              <p className="text-gray-500 text-xs uppercase font-bold mb-2">Nội dung chuyển khoản (Bắt buộc)</p>
              <div className="bg-gray-100 p-3 rounded-lg border border-gray-200 font-mono text-sm font-bold break-all flex justify-between items-center gap-2">
                <span>{transferSyntax}</span>
                <button 
                  onClick={() => handleCopy(transferSyntax)}
                  className="text-indigo-600 hover:text-indigo-800"
                  title="Sao chép nội dung"
                >
                  <Copy size={18} />
                </button>
              </div>
              <p className="text-[10px] text-red-500 mt-2 italic leading-tight">
                *Vui lòng nhập đúng nội dung để được kích hoạt tự động nhanh nhất.
              </p>
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-indigo-300">
            <p>Sau khi chuyển khoản, vui lòng nhắn tin Zalo hoặc chờ 5-10 phút để hệ thống cập nhật.</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RechargeModal;
