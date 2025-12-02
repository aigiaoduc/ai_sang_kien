import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password } = req.body;

  try {
    // Sử dụng admin client để đăng nhập
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Trả về user và session token cho frontend
    return res.status(200).json({ user: data.user, session: data.session });

  } catch (error) {
    return res.status(401).json({ message: 'Đăng nhập thất bại: ' + error.message });
  }
}