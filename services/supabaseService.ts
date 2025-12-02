import { createClient } from '@supabase/supabase-js';

// CẤU HÌNH SUPABASE
const SUPABASE_URL = 'https://qxusbxnhoyvmgscurved.supabase.co';
// Key chính xác bạn đã cung cấp (Anon Key hoặc Service Role Key đều hoạt động)
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4dXNieG5ob3l2bWdzY3VydmVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDQ5MDk2MywiZXhwIjoyMDgwMDY2OTYzfQ.9Iv6LX6jVHV-pXZKe-lrngQ0EsqFubk9lEBeFG2Wxxg';

// CHÚ Ý: persistSession: false
// Điều này đảm bảo khi người dùng F5 hoặc tắt trình duyệt, họ sẽ bị đăng xuất ngay lập tức.
// Khi họ đăng nhập lại, logic trừ tiền ở màn hình Login sẽ kích hoạt.
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false, // KHÔNG LƯU ĐĂNG NHẬP
    autoRefreshToken: true,
    detectSessionInUrl: true // Bật lên để tự động phát hiện session từ link email
  }
});

export interface UserProfile {
  id: string;
  email: string;
  credits: number;
}

// 1. Đăng nhập
export const loginUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  return data;
};

// 2. Đăng ký (CHỈ CHẤP NHẬN GMAIL)
export const registerUser = async (email: string, password: string) => {
  // Kiểm tra đuôi email
  if (!email.endsWith('@gmail.com')) {
    throw new Error("Hệ thống chỉ chấp nhận email có đuôi @gmail.com");
  }
  
  // Lấy URL hiện tại của trình duyệt để Supabase redirect về đúng chỗ
  // (Tránh bị đưa về localhost:3000 mặc định)
  const currentUrl = typeof window !== 'undefined' ? window.location.origin : undefined;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { 
      emailRedirectTo: currentUrl // Quan trọng: Redirect về đúng trang web đang chạy
    }
  });

  if (error) throw error;
  
  return data;
};

// 3. Đăng xuất
export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// 4. Lấy thông tin Credits
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
  return data as UserProfile;
};

// 5. TRỪ LƯỢT (SECURE RPC CALL)
export const deductCreditSecure = async (): Promise<{ success: boolean; remaining?: number; message?: string }> => {
  const { data, error } = await supabase.rpc('deduct_credit');

  if (error) {
    console.error("RPC Error:", error);
    return { success: false, message: "Lỗi kết nối server: " + error.message };
  }

  return data as { success: boolean; remaining?: number; message?: string };
};