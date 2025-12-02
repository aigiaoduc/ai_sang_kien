import React, { useState, useEffect } from 'react';
import { loginUser, registerUser, deductCreditSecure, logoutUser } from '../services/supabaseService';
import { LogIn, UserPlus, Loader2, AlertCircle, CheckCircle2, ShieldCheck, Zap, Mail, ShoppingCart, Lock, MessageSquare, X } from 'lucide-react';
import RechargeModal from './RechargeModal';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // State quản lý hiển thị Modal nạp tiền và trạng thái hết tiền
  const [showRecharge, setShowRecharge] = useState(false);
  const [isOutOfCredits, setIsOutOfCredits] = useState(false);

  // State Forgot Password Modal
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // useEffect để bắt sự kiện người dùng quay lại từ Email xác thực
  useEffect(() => {
    const hash = window.location.hash;
    const search = window.location.search;
    
    // Kiểm tra xem URL có chứa thông tin xác thực từ Supabase không
    // Thường là #access_token=...&type=signup hoặc #type=signup
    if ((hash && (hash.includes('access_token') || hash.includes('type=signup') || hash.includes('type=recovery'))) ||
        (search && search.includes('type=signup'))) {
        
      setSuccessMsg("🎉 Xác thực email thành công! Tài khoản của bạn đã được kích hoạt. Vui lòng đăng nhập.");
      setIsLoginMode(true); // Chuyển về tab đăng nhập
      
      // Xóa hash trên URL cho đẹp (Optional)
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setIsOutOfCredits(false);

    try {
      if (isLoginMode) {
        // 1. ĐĂNG NHẬP
        await loginUser(email, password);
        
        // 2. TRỪ LƯỢT NGAY TẠI CỬA ("Vé vào cổng")
        // Người dùng đã xác thực thành công ở bước trên, giờ kiểm tra xem có tiền mua vé vào không.
        const deduction = await deductCreditSecure();
        
        if (deduction.success) {
          // Trừ thành công -> Vào chế độ bình thường
          onLoginSuccess();
        } else {
          // Trừ thất bại (Hết tiền) -> VẪN CHO VÀO nhưng App sẽ tự nhận biết để khóa tính năng (Locked Mode)
          // Không logout nữa
          console.log("Login successful but deduction failed (Zero credits). Entering Locked Mode.");
          onLoginSuccess();
        }

      } else {
        // ĐĂNG KÝ
        if (!email.endsWith('@gmail.com')) {
           setErrorMsg("Vui lòng sử dụng địa chỉ @gmail.com để đăng ký tài khoản.");
           setIsLoading(false);
           return;
        }

        const data = await registerUser(email, password);
        
        if (data) {
          setSuccessMsg(
            'Đăng ký thành công! Vui lòng kiểm tra hộp thư email (kể cả mục Spam) và bấm vào link xác nhận để kích hoạt tài khoản.'
          );
          // Không tự động chuyển tab ngay để người dùng kịp đọc thông báo
        }
      }
    } catch (error: any) {
      console.error(error);
      if (error.message.includes("Email not confirmed")) {
        setErrorMsg("Email chưa được xác thực. Vui lòng kiểm tra hộp thư của bạn.");
      } else if (error.message.includes("Invalid login credentials")) {
        setErrorMsg("Sai email hoặc mật khẩu.");
      } else {
        setErrorMsg(error.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-white flex items-center justify-center p-4 font-sans relative">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-indigo-50">
        <div className="bg-indigo-700 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-white opacity-5 transform rotate-12 scale-150"></div>
          <h1 className="text-3xl font-extrabold text-white mb-2 relative z-10 tracking-tight">SKKN.AI</h1>
          <p className="text-indigo-200 text-sm relative z-10">Hệ thống soạn thảo Sáng kiến kinh nghiệm<br/>dành riêng cho Giáo viên</p>
        </div>

        <div className="p-8">
          <div className="flex gap-4 mb-8 border-b border-gray-100 pb-1">
            <button
              onClick={() => { setIsLoginMode(true); setErrorMsg(''); setSuccessMsg(''); setIsOutOfCredits(false); }}
              className={`flex-1 pb-3 text-sm font-bold transition-all ${isLoginMode ? 'text-black border-b-2 border-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Đăng nhập
            </button>
            <button
              onClick={() => { setIsLoginMode(false); setErrorMsg(''); setSuccessMsg(''); setIsOutOfCredits(false); }}
              className={`flex-1 pb-3 text-sm font-bold transition-all ${!isLoginMode ? 'text-black border-b-2 border-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Tạo tài khoản mới
            </button>
          </div>

          {errorMsg && (
            <div className="mb-5 p-4 bg-red-50 text-red-700 rounded-xl flex flex-col items-start gap-2 text-sm border border-red-100 animate-pulse">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
              
              {/* Nút Mua thêm lượt khi hết tiền */}
              {isOutOfCredits && (
                <button 
                  onClick={() => setShowRecharge(true)}
                  className="mt-2 w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-bold flex items-center justify-center gap-2 shadow-sm"
                >
                  <ShoppingCart size={16} />
                  Mua thêm lượt ngay
                </button>
              )}
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-4 bg-green-50 text-green-700 rounded-xl flex items-start gap-3 text-sm border border-green-100">
              <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-black mb-1.5">Email</label>
              <input
                type="email"
                required
                className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-gray-50 focus:bg-white text-black placeholder-gray-400"
                placeholder="vidu@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-black mb-1.5">Mật khẩu</label>
              <input
                type="password"
                required
                className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-gray-50 focus:bg-white text-black placeholder-gray-400"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              
              {/* Forgot Password Link */}
              {isLoginMode && (
                <div className="flex justify-end mt-2">
                  <button 
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
              )}
            </div>

            {isLoginMode ? (
               <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
                 <Zap size={14} className="fill-amber-500 text-amber-500" />
                 <span>Phí truy cập: <strong>1 lượt</strong> / lần đăng nhập.</span>
               </div>
            ) : (
               <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-100">
                 <Mail size={14} />
                 <span>Yêu cầu email @gmail.com để nhận mã xác nhận.</span>
               </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold shadow-lg shadow-indigo-200 flex justify-center items-center gap-2 disabled:bg-indigo-400 disabled:shadow-none transform active:scale-[0.98]"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : isLoginMode ? (
                <>
                  <LogIn size={20} /> Vào ứng dụng (-1 lượt)
                </>
              ) : (
                <>
                  <UserPlus size={20} /> Đăng ký miễn phí
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center bg-gray-50 p-4 rounded-xl border border-gray-100">
             <div className="flex justify-center mb-2 text-indigo-500">
               <ShieldCheck size={24} />
             </div>
             <p className="text-xs text-gray-500 font-medium">
                Hệ thống yêu cầu xác thực email để bảo mật.<br/>
                Mỗi tài khoản mới được tặng <strong>1 lượt</strong> dùng thử.
             </p>
          </div>
        </div>
      </div>

      {/* RECHARGE MODAL ON LOGIN SCREEN */}
      {showRecharge && (
        <RechargeModal 
          userEmail={email} 
          onClose={() => setShowRecharge(false)} 
        />
      )}

      {/* FORGOT PASSWORD MODAL */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden p-6 relative transform transition-all scale-100">
            <button 
              onClick={() => setShowForgotPassword(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Quên mật khẩu?</h3>
              <p className="text-sm text-gray-500 mb-6">
                Để đảm bảo bảo mật và kiểm soát tài khoản, vui lòng liên hệ trực tiếp với Admin để được cấp lại mật khẩu mới.
              </p>

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
                <p className="text-xs font-bold text-blue-600 uppercase mb-2">Thông tin liên hệ</p>
                <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                  <div className="bg-blue-600 text-white p-2 rounded-full">
                    <MessageSquare size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-gray-500">Zalo Admin</p>
                    <p className="font-bold text-lg text-gray-900 select-all">0355213107</p>
                    <p className="text-xs text-gray-600 font-medium">Trần Hồng Quân</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowForgotPassword(false)}
                className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginScreen;