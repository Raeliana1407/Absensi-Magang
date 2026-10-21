import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SettingsPembimbing() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // --- STATE USER (Dibuat dinamis agar berubah otomatis) ---
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')) || {});

  // --- STATE UNTUK TOGGLE SWITCH ---
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  // --- STATE UNTUK MODAL PASSWORD ---
  const [showModal, setShowModal] = useState(false);
  const [passData, setPassData] = useState({ lama: '', baru: '' });
  const [loading, setLoading] = useState(false);

  // --- STATE UNTUK MODAL PROFILE ---
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
  // FUNGSI UPDATE PROFILE & FOTO 
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

  // Fungsi Logout
  const handleLogout = () => {
    const konfirmasi = window.confirm("Apakah Anda yakin ingin keluar?");
    if (konfirmasi) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/');
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col mb-4">
        <h1 className="text-3xl font-black text-slate-800 dark:text-white">Pengaturan</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Kelola preferensi akun dan aplikasi Anda</p>
      </div>

      {/* --- AVATAR PEMBIMBING --- */}
      <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm text-center mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-blue-50 to-transparent dark:from-slate-700/50"></div>
        <div className="relative w-28 h-28 mb-4 z-10">
          {user.foto_profil ? (
            <img src={user.foto_profil} alt="Avatar" className="w-full h-full rounded-full object-cover border-[4px] border-white dark:border-slate-800 shadow-lg" />
          ) : (
            <div className="w-full h-full rounded-full bg-[#0E3CAA] text-white flex items-center justify-center text-4xl font-bold border-[4px] border-white dark:border-slate-800 shadow-lg">
              {user.nama ? user.nama.charAt(0) : 'P'}
            </div>
          )}
        </div>
        <h2 className="text-xl font-extrabold text-slate-800 dark:text-white z-10">{user.nama}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 capitalize font-medium mt-1 z-10">{user.role} {user.divisi ? `• ${user.divisi}` : ''}</p>
        
        <div className="mt-4 inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-4 py-1.5 rounded-full text-xs font-bold border border-emerald-100 dark:border-emerald-500/20 z-10">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Akun Pembimbing Aktif
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* SECTION: AKUN */}
        <div>
          <h2 className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mb-3 uppercase tracking-wider px-1">Keamanan Akun</h2>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden shadow-sm">
            
            <button onClick={() => setShowModal(true)} className="w-full flex justify-between items-center p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Ubah Password</span>
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
            
            {/* TOMBOL UPDATE PROFIL AKTIF */}
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
          <h2 className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mb-3 uppercase tracking-wider px-1">Tampilan Aplikasi</h2>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden shadow-sm">
            
            {/* Toggle Dark Mode */}
            <div className="flex justify-between items-center p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors" onClick={() => setDarkMode(!darkMode)}>
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
      </div>

      {/* SECTION: LOGOUT */}
      <div className="pt-6">
        <button 
          onClick={handleLogout}
          className="w-full md:w-auto px-8 py-3.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 font-bold rounded-xl hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex justify-center items-center gap-2 border border-rose-100 dark:border-rose-500/20"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          Keluar Aplikasi
        </button>
      </div>

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
                  className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:border-blue-500 text-slate-800 dark:text-white" 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">Kata Sandi Baru</label>
                <input 
                  type="password" required minLength="6"
                  value={passData.baru} onChange={(e) => setPassData({...passData, baru: e.target.value})}
                  className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:border-blue-500 text-slate-800 dark:text-white" 
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                  Batal
                </button>
                <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 transition-colors disabled:opacity-70">
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* MODAL UPDATE PROFILE                    */}
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