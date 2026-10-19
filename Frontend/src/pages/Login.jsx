import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // PERBAIKAN: Import Link ditambahkan

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('https://absensi-magang-beta.vercel.app/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // 1. Simpan data profil user
        localStorage.setItem('user', JSON.stringify(result.user));
        
        // 2. Simpan token JWT
        localStorage.setItem('token', result.token);
        
        // 3. LOGIKA REDIRECT BERDASARKAN ROLE
        const userRole = result.user.role;
        
        if (userRole === 'admin') {
          navigate('/admin/users'); // Admin masuk ke manajemen user
        } else if (userRole === 'pembimbing') {
          navigate('/pembimbing/dashboard'); // Pembimbing ke dashboard
        } else {
          navigate('/home'); // Anak magang ke beranda
        }
      } else {
        setErrorMsg(result.message || 'Login gagal.');
      }
    } catch (err) {
      console.error("Error Detail:", err);
      setErrorMsg('Gagal terhubung ke server backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#F8FAFC] flex flex-col justify-center px-6 relative shadow-2xl font-sans text-slate-800">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="text-center mb-8">
          <div className="bg-blue-600 text-white p-3 rounded-2xl w-12 h-12 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-600/20">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">ClockSync Enterprise</h1>
          <p className="text-xs text-slate-500 mt-1">Silakan masuk menggunakan akun Anda</p>
        </div>

        {errorMsg && (
          <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-xl text-xs font-semibold text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Kantor / Magang</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@perusahaan.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600 bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600 bg-slate-50"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#0E3CAA] hover:bg-blue-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-900/20 transition-all text-sm mt-2"
          >
            {loading ? 'Memproses...' : 'Masuk Aplikasi'}
          </button>
        </form>

        {/* PERBAIKAN: Tambahan teks dan link untuk mendaftar */}
        <p className="text-center text-sm text-slate-500 mt-8">
          Belum punya akun?{' '}
          <Link to="/register" className="font-bold text-blue-600 hover:underline">
            Daftar di sini
          </Link>
        </p>

      </div>
    </div>
  );
}