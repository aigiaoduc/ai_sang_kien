import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password, quota } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Thiếu email hoặc password' });
  }

  try {
    // 1. Tạo User trong Supabase Auth
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true // Tự động xác thực email
    });

    if (userError) throw userError;

    const userId = userData.user.id;

    // 2. Tạo bản ghi trong bảng Account với số quota được cấp
    const { error: accountError } = await supabaseAdmin
      .from('Account')
      .insert([
        { 
          id: userId, 
          quota: quota || 10, // Mặc định 10 lượt nếu không nhập
          is_active: true 
        }
      ]);

    if (accountError) {
      // Nếu lỗi tạo Account, xóa user vừa tạo để tránh rác
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw accountError;
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Tạo user thành công', 
      user: { email, id: userId, quota: quota || 10 } 
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}