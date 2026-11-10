import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  // 'email' di sini kita fungsikan ganda sebagai Username atau Email
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // 🔥 FITUR MATA 🔥
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
        localStorage.setItem('user', JSON.stringify(result.user));
        localStorage.setItem('token', result.token);
        
        const userRole = result.user.role;
        
        if (userRole === 'admin' || userRole === 'pembimbing') {
          navigate('/pembimbing/dashboard'); // Leburan Admin & Pembimbing
        } else {
          navigate('/home'); 
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
            <label className="block text-xs font-bold text-slate-700 mb-1">Username / Email</label>
            <input 
              type="text" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan Username atau Email"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600 bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600 bg-slate-50"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-blue-600 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 011.5-2.825mC5.813 7.027 8.528 5 12 5c4.478 0 8.268 2.943 9.542 7a10.05 10.05 0 01-1.393 2.502M15 12a3 3 0 11-6 0 3 3 0 016 0zm-1.121 4.243l-8.485-8.485m8.485 8.485l2.121 2.121M13.879 7.757l-2.121-2.121"></path></svg>
                )}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#0E3CAA] hover:bg-blue-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-900/20 transition-all text-sm mt-2 flex justify-center items-center gap-2"
          >
            {loading ? (
               <>
                 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                 Memproses...
               </>
            ) : 'Masuk Aplikasi'}
          </button>
        </form>

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