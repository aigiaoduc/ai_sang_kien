import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'Thiếu User ID' });
  }

  try {
    // 1. Lấy thông tin tài khoản hiện tại từ bảng Account
    const { data: account, error: fetchError } = await supabaseAdmin
      .from('Account')
      .select('quota, is_active')
      .eq('id', userId)
      .single();

    if (fetchError || !account) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản hoặc lỗi kết nối.' });
    }

    // 2. Kiểm tra trạng thái Active
    if (!account.is_active) {
      return res.status(403).json({ 
        success: false, 
        message: 'Tài khoản của bạn đã bị khóa (Inactive).' 
      });
    }

    // 3. Kiểm tra số lượt còn lại (Quota)
    if (account.quota <= 0) {
      return res.status(402).json({ 
        success: false, 
        message: 'Bạn đã hết lượt sử dụng. Vui lòng nạp thêm.',
        currentQuota: 0
      });
    }

    // 4. Trừ 1 lượt
    const newQuota = account.quota - 1;
    const { error: updateError } = await supabaseAdmin
      .from('Account')
      .update({ quota: newQuota })
      .eq('id', userId);

    if (updateError) throw updateError;

    // 5. Thành công
    return res.status(200).json({ 
      success: true, 
      message: 'Đã trừ 1 lượt sử dụng.', 
      remainingQuota: newQuota 
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
}