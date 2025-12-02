import { useState } from 'react';

export default function Login() {
  // State cho Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]); // Lưu log hoạt động
  const [quotaInfo, setQuotaInfo] = useState(null);

  // State cho Admin (Tạo user)
  const [newEmail, setNewEmail] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newQuota, setNewQuota] = useState(10);

  const addLog = (msg) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

  // Xử lý Login -> Sau đó tự động gọi API trừ lượt
  const handleLogin = async (e) => {
    e.preventDefault();
    addLog('Đang đăng nhập...');
    setQuotaInfo(null);

    try {
      // 1. Gọi API Login
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      setUser(data.user);
      addLog(`Đăng nhập thành công! User ID: ${data.user.id}`);
      
      // 2. Tự động gọi API trừ lượt ngay sau khi login
      await consumeQuota(data.user.id);

    } catch (err) {
      addLog(`LỖI Login: ${err.message}`);
    }
  };

  // Hàm gọi API trừ lượt
  const consumeQuota = async (userId) => {
    addLog('Đang gọi API trừ lượt (/api/use-quota)...');
    
    try {
      const res = await fetch('/api/use-quota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();

      if (res.status === 200) {
        addLog(`✅ THÀNH CÔNG: ${data.message}`);
        setQuotaInfo({ remaining: data.remainingQuota, status: 'Active' });
      } else if (res.status === 402) {
        addLog(`⚠️ HẾT LƯỢT: ${data.message}`);
        setQuotaInfo({ remaining: 0, status: 'Hết lượt' });
      } else if (res.status === 403) {
        addLog(`⛔ BỊ KHÓA: ${data.message}`);
        setQuotaInfo({ remaining: 0, status: 'Locked' });
      } else {
        throw new Error(data.message);
      }

    } catch (err) {
      addLog(`LỖI API Quota: ${err.message}`);
    }
  };

  // Xử lý Admin tạo User
  const handleCreateUser = async (e) => {
    e.preventDefault();
    addLog(`Đang tạo user ${newEmail}...`);

    try {
      const res = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, password: newPass, quota: newQuota }),
      });
      const data = await res.json();
      
      if (res.ok) {
        addLog(`🎉 Tạo user thành công: ${data.user.email} (Quota: ${data.user.quota})`);
        setNewEmail('');
        setNewPass('');
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      addLog(`LỖI Tạo User: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Hệ Thống Quản Lý Lượt (Supabase)</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* CỘT TRÁI: LOGIN & INFO */}
        <div>
          <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
            <h2>1. Đăng nhập User</h2>
            {!user ? (
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input 
                  type="email" placeholder="Email" required 
                  value={email} onChange={e => setEmail(e.target.value)}
                  style={{ padding: '8px' }}
                />
                <input 
                  type="password" placeholder="Mật khẩu" required 
                  value={password} onChange={e => setPassword(e.target.value)} 
                  style={{ padding: '8px' }}
                />
                <button type="submit" style={{ padding: '10px', background: '#0070f3', color: 'white', border: 'none', cursor: 'pointer' }}>
                  Đăng nhập & Trừ lượt
                </button>
              </form>
            ) : (
              <div>
                <p>Xin chào, <strong>{user.email}</strong></p>
                <button onClick={() => { setUser(null); setQuotaInfo(null); addLog('Đã đăng xuất'); }} style={{ padding: '5px 10px' }}>
                  Đăng xuất
                </button>
                <button onClick={() => consumeQuota(user.id)} style={{ padding: '5px 10px', marginLeft: '10px', background: 'green', color: 'white' }}>
                  Trừ thêm 1 lượt thủ công
                </button>
              </div>
            )}
          </div>

          {/* HIỂN THỊ QUOTA */}
          {quotaInfo && (
            <div style={{ 
              border: '2px solid ' + (quotaInfo.remaining > 0 ? 'green' : 'red'), 
              padding: '20px', borderRadius: '8px', background: '#f9f9f9', textAlign: 'center' 
            }}>
              <h3>Lượt còn lại</h3>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: (quotaInfo.remaining > 0 ? 'green' : 'red') }}>
                {quotaInfo.remaining}
              </div>
              <p>Trạng thái: {quotaInfo.status}</p>
            </div>
          )}
        </div>

        {/* CỘT PHẢI: ADMIN & LOGS */}
        <div>
          <div style={{ border: '1px solid #ff9800', padding: '20px', borderRadius: '8px', marginBottom: '20px', background: '#fff8e1' }}>
            <h2 style={{ marginTop: 0 }}>Admin: Tạo User Mới</h2>
            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input 
                type="email" placeholder="Email user mới" required 
                value={newEmail} onChange={e => setNewEmail(e.target.value)}
                style={{ padding: '8px' }}
              />
              <input 
                type="text" placeholder="Mật khẩu" required 
                value={newPass} onChange={e => setNewPass(e.target.value)}
                style={{ padding: '8px' }}
              />
              <label>
                Số lượt cấp (Quota):
                <input 
                  type="number" min="0" 
                  value={newQuota} onChange={e => setNewQuota(e.target.value)}
                  style={{ marginLeft: '10px', padding: '5px', width: '60px' }}
                />
              </label>
              <button type="submit" style={{ padding: '10px', background: '#ff9800', color: 'white', border: 'none', cursor: 'pointer' }}>
                Tạo User
              </button>
            </form>
          </div>

          <div style={{ background: '#333', color: '#0f0', padding: '15px', borderRadius: '5px', height: '300px', overflowY: 'auto', fontSize: '12px', fontFamily: 'monospace' }}>
            <div style={{ borderBottom: '1px solid #555', paddingBottom: '5px', marginBottom: '5px' }}><strong>SYSTEM LOGS</strong></div>
            {logs.map((log, i) => <div key={i}>{log}</div>)}
            {logs.length === 0 && <div>Chờ thao tác...</div>}
          </div>
        </div>

      </div>
    </div>
  );
}