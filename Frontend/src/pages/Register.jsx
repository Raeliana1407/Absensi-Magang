import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();
  // Tambahkan field username dan lokasi_id di state form
  const [formData, setFormData] = useState({ nama: '', username: '', email: '', password: '', lokasi_id: '' });
  const [showPassword, setShowPassword] = useState(false); // 🔥 FITUR MATA 🔥
  const [loading, setLoading] = useState(false);
  const [pesan, setPesan] = useState({ type: '', text: '' });
  
  const [locations, setLocations] = useState([]); // State untuk nampung data ULP dari DB

  // Ambil daftar lokasi saat form di-load
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch('https://absensi-magang-beta.vercel.app/api/admin/settings');
        const result = await response.json();
        if (result.success) {
          setLocations(result.data);
          // Set lokasi default jika data ada
          if(result.data.length > 0) {
            setFormData(prev => ({...prev, lokasi_id: result.data[0].id}));
          }
        }
      } catch (error) {
        console.error("Gagal mengambil data lokasi", error);
      }
    };
    fetchLocations();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      setPesan({ type: 'error', text: 'Password minimal 6 karakter!' });
      return;
    }
    // Validasi tambahan untuk username yang tidak boleh ada spasi
    if (/\s/.test(formData.username)) {
      setPesan({ type: 'error', text: 'Username tidak boleh mengandung spasi!' });
      return;
    }

    setLoading(true);
    setPesan({ type: '', text: '' });

    try {
      const response = await fetch('https://absensi-magang-beta.vercel.app/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result = await response.json();

      if (result.success) {
        setPesan({ type: 'success', text: result.message });
        setFormData({ nama: '', username: '', email: '', password: '', lokasi_id: locations.length > 0 ? locations[0].id : '' });
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setPesan({ type: 'error', text: result.message });
      }
    } catch (error) {
      setPesan({ type: 'error', text: 'Terjadi kesalahan pada server.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800 relative overflow-hidden">
      
      {/* Background Ornamen */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden relative z-10 my-8">
        <div className="p-8 sm:p-10">
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-2xl mb-4 shadow-lg shadow-blue-600/30">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM11 19.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.22.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
            </div>
            <h1 className="text-2xl font-black text-slate-900">Buat Akun Baru</h1>
            <p className="text-sm text-slate-500 mt-2">Daftar untuk mengakses portal presensi.</p>
          </div>

          {pesan.text && (
            <div className={`p-4 rounded-xl mb-6 text-sm font-bold flex gap-3 items-start ${pesan.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {pesan.type === 'success' ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>}
              </svg>
              <span>{pesan.text}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Nama Lengkap</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                </div>
                <input 
                  type="text" required
                  value={formData.nama} onChange={(e) => setFormData({...formData, nama: e.target.value})}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none bg-slate-50 transition-all" 
                  placeholder="Masukkan nama lengkap"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Username (ID Login)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <span className="font-bold text-lg leading-none">@</span>
                </div>
                <input 
                  type="text" required
                  value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none bg-slate-50 transition-all lowercase" 
                  placeholder="contoh: joko123"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">
                Email Opsional <span className="text-[10px] font-medium text-slate-400 font-normal">(Untuk Support)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                </div>
                <input 
                  type="email"
                  value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none bg-slate-50 transition-all" 
                  placeholder="Kosongkan jika tidak ada"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Pilih Titik Lokasi Magang</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                </div>
                <select 
                  required
                  value={formData.lokasi_id} onChange={(e) => setFormData({...formData, lokasi_id: e.target.value})}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none bg-slate-50 transition-all appearance-none cursor-pointer"
                >
                  <option value="" disabled>-- Pilih ULP / Unit Kerja --</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.nama_lokasi}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Kata Sandi</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  required minLength="6"
                  value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none bg-slate-50 transition-all" 
                  placeholder="Minimal 6 karakter"
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
              type="submit" disabled={loading}
              className="w-full py-3.5 mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-600/30 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Memproses...
                </>
              ) : 'Daftar Sekarang'}
            </button>
          </form>
          
          <p className="text-center text-sm text-slate-500 mt-8">
            Sudah memiliki akun? <Link to="/" className="font-bold text-blue-600 hover:underline">Masuk di sini</Link>
          </p>
        </div>
      </div>
    </div>
  );
}