import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Setting() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  // Jadikan user sebagai state agar kalau diupdate, data langsung refresh
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')) || {});

  // --- STATE UNTUK TOGGLE SWITCH ---
  const [notifOn, setNotifOn] = useState(true);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  // --- STATE UNTUK MODAL PASSWORD ---
  const [showModal, setShowModal] = useState(false);
  const [passData, setPassData] = useState({ lama: '', baru: '' });
  const [loading, setLoading] = useState(false);

  // --- STATE UNTUK MODAL PROFILE (BARU) ---
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editNama, setEditNama] = useState(user.nama || '');
  const [editFoto, setEditFoto] = useState(null);
  const [previewFoto, setPreviewFoto] = useState(user.foto_profil || null);
  const [loadingProfile, setLoadingProfile] = useState(false);

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
      const response = await fetch('https://absensi-magang-beta.vercel.app/api/ubah-kata-sandi', {
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

  // ==========================================
  // FUNGSI UPDATE PROFILE & FOTO (BARU)
  // ==========================================
  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditFoto(file);
      setPreviewFoto(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoadingProfile(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('user_id', user.id);
      formData.append('nama', editNama);
      if (editFoto) formData.append('foto_profil', editFoto);

      const response = await fetch('https://absensi-magang-beta.vercel.app/api/update-profile', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem('user', JSON.stringify(result.user));
        setUser(result.user);
        setShowProfileModal(false);
      } else {
        alert(result.message || 'Gagal update profil');
      }
    } catch (error) {
      console.error('Error update profile:', error);
      alert('Terjadi kesalahan pada server.');
    } finally {
      setLoadingProfile(false);
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
            
            {/* TOMBOL UPDATE PROFIL (SUDAH AKTIF) */}
            <button 
              onClick={() => {
                setEditNama(user.nama);
                setPreviewFoto(user.foto_profil);
                setEditFoto(null);
                setShowProfileModal(true);
              }} 
              className="w-full flex justify-between items-center p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
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

      {/* ======================================= */}
      {/* MODAL UPDATE PROFILE (BARU)             */}
      {/* ======================================= */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 text-center">Edit Profil</h3>
            
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div className="flex flex-col items-center">
                <div 
                  className="relative w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center cursor-pointer overflow-hidden group"
                  onClick={() => fileInputRef.current.click()}
                >
                  {previewFoto ? (
                    <img src={previewFoto} alt="Preview" className="w-full h-full object-cover group-hover:opacity-50 transition" />
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">Pilih Foto</span>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path></svg>
                  </div>
                </div>
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFotoChange} />
                <p className="text-[10px] text-slate-400 mt-2">Ketuk untuk mengganti foto</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Nama Lengkap</label>
                <input 
                  type="text" 
                  value={editNama} onChange={(e) => setEditNama(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowProfileModal(false)} className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 transition">
                  Batal
                </button>
                <button type="submit" disabled={loadingProfile} className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {loadingProfile ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}