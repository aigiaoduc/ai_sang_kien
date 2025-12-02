import { createClient } from '@supabase/supabase-js';

// Lấy thông tin từ biến môi trường (Vite uses import.meta.env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Thiếu thông tin SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY. Ứng dụng có thể không hoạt động đúng.');
}

// Khởi tạo Client với Service Role Key (Quyền Admin - Bỏ qua RLS)
// CHÚ Ý: Client này chỉ được dùng ở phía Server (API Routes) hoặc môi trường an toàn.
// Trong mô hình Client-only này, chúng ta chấp nhận rủi ro lộ key để demo tính năng.
export const supabaseAdmin = createClient(supabaseUrl || '', supabaseServiceKey || '', {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});