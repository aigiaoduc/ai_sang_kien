import { createClient } from '@supabase/supabase-js';

// Lấy thông tin từ biến môi trường
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Thiếu thông tin SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY');
}

// Khởi tạo Client với Service Role Key (Quyền Admin - Bỏ qua RLS)
// CHÚ Ý: Client này chỉ được dùng ở phía Server (API Routes), KHÔNG dùng ở Client (Frontend)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});