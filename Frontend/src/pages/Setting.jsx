import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Setting() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};

  // --- STATE UNTUK TOGGLE SWITCH ---
  const [notifOn, setNotifOn] = useState(true);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  // --- STATE UNTUK MODAL PASSWORD ---
  const [showModal, setShowModal] = useState(false);
  const [passData, setPassData] = useState({ lama: '', baru: '' });
  const [loading, setLoading] = useState(false);

  // Efek untuk mengaktifkan Dark Mode di seluruh aplikasi
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Fungsi Submit Password
  const handleUbahPassword = async (e) => {
    e.preventDefault();
    if (passData.baru.length < 6) return alert("Password baru minimal 6 karakter!");
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Pastikan endpoint ini sesuai dengan backend Anda
      // Asumsi rute ini didaftarkan dengan app.use('/api/auth', ...) di server.js Anda
      // Pastikan method-nya POST dan URL-nya tepat
      const response = await fetch('http://localhost:3000/api/ubah-kata-sandi', {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: user.id,
          passwordLama: passData.lama,
          passwordBaru: passData.baru
        })
      });

      const result = await response.json();
      if (result.success) {
        alert("Sukses: " + result.message);
        setShowModal(false);
        setPassData({ lama: '', baru: '' });
      } else {
        alert("Gagal: " + result.message);
      }
    } catch (error) {
      alert("Terjadi kesalahan server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#F8FAFC] dark:bg-slate-900 transition-colors duration-300">
      
      {/* HEADER */}
      <header className="bg-white dark:bg-slate-800 p-5 flex items-center gap-4 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full hover:bg-slate-100">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <h1 className="text-lg font-bold text-[#0B1E46] dark:text-white">Pengaturan</h1>
      </header>

      <main className="p-5 space-y-6">
        
        {/* SECTION: AKUN */}
        <div>
          <h2 className="text-[11px] font-bold text-blue-600 mb-3 uppercase tracking-wider px-1">Akun</h2>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden shadow-sm">
            
            <button onClick={() => setShowModal(true)} className="w-full flex justify-between items-center p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Ubah Password</span>
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
            
            <button onClick={() => alert("Fitur Update Profil sedang dikembangkan!")} className="w-full flex justify-between items-center p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Update Profil & Foto</span>
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
            
          </div>
        </div>

        {/* SECTION: APLIKASI */}
        <div>
          <h2 className="text-[11px] font-bold text-blue-600 mb-3 uppercase tracking-wider px-1">Aplikasi</h2>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden shadow-sm">
            
            {/* Toggle Notifikasi */}
            <div className="flex justify-between items-center p-4 cursor-pointer" onClick={() => setNotifOn(!notifOn)}>
              <div>
                <p className="font-bold text-sm text-slate-800 dark:text-slate-200">Notifikasi Shift</p>
                <p className="text-[11px] text-slate-400">Ingatkan absen 15 mnt sebelum</p>
              </div>
              {/* Desain Toggle */}
              <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out ${notifOn ? 'bg-[#1E40AF]' : 'bg-slate-200 dark:bg-slate-600'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${notifOn ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </div>
            </div>

            {/* Toggle Dark Mode */}
            <div className="flex justify-between items-center p-4 cursor-pointer" onClick={() => setDarkMode(!darkMode)}>
              <div>
                <p className="font-bold text-sm text-slate-800 dark:text-slate-200">Mode Gelap (Dark Mode)</p>
                <p className="text-[11px] text-slate-400">Ikuti sistem perangkat</p>
              </div>
              {/* Desain Toggle */}
              <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out ${darkMode ? 'bg-[#1E40AF]' : 'bg-slate-200 dark:bg-slate-600'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${darkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* =======================
          MODAL UBAH PASSWORD
      ======================== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl transform transition-all">
            <h3 className="text-lg font-black text-slate-800 dark:text-white mb-4">Ubah Kata Sandi</h3>
            
            <form onSubmit={handleUbahPassword} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500">Kata Sandi Lama</label>
                <input 
                  type="password" required
                  value={passData.lama} onChange={(e) => setPassData({...passData, lama: e.target.value})}
                  className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:border-blue-500" 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">Kata Sandi Baru</label>
                <input 
                  type="password" required minLength="6"
                  value={passData.baru} onChange={(e) => setPassData({...passData, baru: e.target.value})}
                  className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:border-blue-500" 
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-sm">
                  Batal
                </button>
                <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl text-sm">
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}