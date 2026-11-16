import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/layout/BottomNav';

export default function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // --- Ambil Data User & Jadikan State ---
  const [user, setUser] = useState(() => {
    const userDataString = localStorage.getItem('user');
    return userDataString ? JSON.parse(userDataString) : { 
      id: 1, nama: 'Guest User', username: 'guest', email: 'guest@clocksync.com', divisi: 'Unknown', role: 'magang', lokasi_id: null, foto_profil: null
    };
  });

  const empId = `EMP-${String(user.id).padStart(5, '0')}`;

  // --- State Nama Lokasi ULP ---
  const [namaLokasi, setNamaLokasi] = useState('');

  // --- State Statistik Dinamis ---
  const [stats, setStats] = useState({ leaveBalance: 14, onTimePercent: 100, score: 5.0, pendingLeaves: 0 });
  const [loading, setLoading] = useState(true);

  // --- State untuk Modal Update Profile ---
  const [showModal, setShowModal] = useState(false);
  const [editNama, setEditNama] = useState(user.nama);
  const [editUsername, setEditUsername] = useState(user.username || '');
  const [editFoto, setEditFoto] = useState(null);
  const [previewFoto, setPreviewFoto] = useState(user.foto_profil);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ambil nama lokasi penempatan dari tabel settings
  useEffect(() => {
    const fetchLocationName = async () => {
      if (!user.lokasi_id) return;
      try {
        const res = await fetch('https://absensi-magang-beta.vercel.app/api/admin/settings');
        const result = await res.json();
        if (result.success) {
          const matchedLoc = result.data.find(loc => Number(loc.id) === Number(user.lokasi_id));
          if (matchedLoc) {
            setNamaLokasi(matchedLoc.nama_lokasi);
          }
        }
      } catch (err) {
        console.error('Gagal mengambil nama lokasi:', err);
      }
    };
    fetchLocationName();
  }, [user.lokasi_id]);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token || !user.id) return;

        const resRiwayat = await fetch(`https://absensi-magang-beta.vercel.app/api/riwayat/${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const dataRiwayat = await resRiwayat.json();

        const resPengajuan = await fetch(`https://absensi-magang-beta.vercel.app/api/pengajuan/riwayat/${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const dataPengajuan = await resPengajuan.json();

        if (dataRiwayat.success && dataPengajuan.success) {
          const logsMasuk = dataRiwayat.data.filter(log => log.jenis_absen === 'masuk');
          const tepat = logsMasuk.filter(log => log.status === 'hadir').length;
          const telat = logsMasuk.filter(log => log.status === 'terlambat').length;
          const totalHadir = tepat + telat;

          let onTime = 100;
          if (totalHadir > 0) onTime = (tepat / totalHadir) * 100;
          const score = (onTime / 100) * 5;

          const pengajuanList = dataPengajuan.data;
          const pending = pengajuanList.filter(p => p.status === 'pending').length;
          
          let cutiTerpakai = 0;
          pengajuanList.filter(p => p.status === 'disetujui' && p.jenis_izin === 'izin').forEach(p => {
              const t1 = new Date(p.tanggal_mulai);
              const t2 = new Date(p.tanggal_selesai || p.tanggal_mulai);
              const diffDays = Math.ceil(Math.abs(t2 - t1) / (1000 * 60 * 60 * 24)) + 1;
              cutiTerpakai += diffDays;
          });

          setStats({
            leaveBalance: Math.max(0, 14 - cutiTerpakai),
            onTimePercent: onTime.toFixed(1),
            score: score.toFixed(1),
            pendingLeaves: pending
          });
        }
      } catch (error) {
        console.error("Gagal menghitung statistik:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [user.id]);

  const handleSignOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('shift_phase');
    navigate('/'); 
  };

  // --- Fungsi Handle Perubahan Foto (Lokal Preview) ---
  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditFoto(file);
      setPreviewFoto(URL.createObjectURL(file));
    }
  };

  // --- Fungsi Simpan Profile ke Backend ---
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (/\s/.test(editUsername)) {
      alert('Username tidak boleh mengandung spasi!');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('user_id', user.id);
      formData.append('nama', editNama);
      formData.append('username', editUsername.trim().toLowerCase());
      if (editFoto) {
        formData.append('foto_profil', editFoto);
      }

      const response = await fetch('https://absensi-magang-beta.vercel.app/api/update-profile', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem('user', JSON.stringify(result.user));
        setUser(result.user);
        setShowModal(false);
        alert('✅ Profil berhasil diperbarui!');
      } else {
        alert(result.message || 'Gagal update profil');
      }
    } catch (error) {
      console.error('Error update profile:', error);
      alert('Terjadi kesalahan pada server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTgl = (tglStr) => {
    if (!tglStr) return null;
    const date = new Date(tglStr);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#F8FAFC] dark:bg-slate-900 pb-28 relative shadow-2xl font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* --- Profile Header --- */}
      <header className="bg-white dark:bg-slate-800 rounded-b-[40px] pt-12 pb-6 px-5 shadow-sm border-b border-slate-100 dark:border-slate-700 flex flex-col items-center relative overflow-hidden transition-colors">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-50 dark:from-slate-800 via-teal-50/30 dark:via-slate-700/30 to-transparent"></div>
        
        {/* Avatar */}
        <div className="relative w-24 h-24 mb-3 z-10">
          {user.foto_profil ? (
            <img src={user.foto_profil} alt="Profile" className="w-full h-full rounded-full object-cover border-[4px] border-white dark:border-slate-800 shadow-md" />
          ) : (
            <div className="w-full h-full rounded-full bg-[#0E3CAA] text-white flex items-center justify-center text-4xl font-bold border-[4px] border-white dark:border-slate-800 shadow-md">
              {user.nama.charAt(0)}
            </div>
          )}
          
          {/* Tombol Edit Profil */}
          <button 
            onClick={() => {
              setEditNama(user.nama);
              setEditUsername(user.username || '');
              setPreviewFoto(user.foto_profil);
              setEditFoto(null);
              setShowModal(true);
            }} 
            className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full border-2 border-white dark:border-slate-800 shadow-sm hover:bg-blue-700 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
          </button>
        </div>
        
        {/* Nama, Username, & Badge Lokasi */}
        <div className="z-10 text-center">
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center justify-center gap-1.5">
            {user.nama}
            <svg className="w-5 h-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
          </h2>

          {user.username && (
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-0.5">@{user.username}</p>
          )}
          
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium capitalize mt-1">
            {user.role} {user.divisi ? `• ${user.divisi}` : ''}
          </p>

          {/* 🔥 BADGE LOKASI PENEMPATAN ULP 🔥 */}
          {namaLokasi && (
            <div className="mt-2.5 flex justify-center">
              <span className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-500/30 px-3 py-1 rounded-full text-xs font-bold">
                📍 {namaLokasi}
              </span>
            </div>
          )}

          {user.universitas && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
              🎓 {user.universitas}
            </p>
          )}
          
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded text-xs font-bold">{empId}</span>
            {(user.tgl_mulai || user.tgl_selesai) && (
              <>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {formatTgl(user.tgl_mulai)} - {formatTgl(user.tgl_selesai)}
                </span>
              </>
            )}
          </div>

          <div className="inline-flex mt-3.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-4 py-1.5 rounded-full text-xs font-bold items-center gap-1.5 border border-emerald-100 dark:border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Active Employee
          </div>
        </div>
      </header>

      <main className="px-5 mt-6 space-y-6">
        
        {/* --- Stats Grid (Real Data) --- */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 text-center flex flex-col items-center justify-center">
             <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 rounded-full flex items-center justify-center mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>
             </div>
             <p className="text-sm font-extrabold text-slate-800 dark:text-white leading-none">
                {loading ? '...' : stats.leaveBalance} <span className="text-[10px] font-medium text-slate-500">Days</span>
             </p>
             <p className="text-[10px] font-semibold text-slate-500 mt-1">Leave Bal.</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 text-center flex flex-col items-center justify-center">
             <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
             </div>
             <p className="text-sm font-extrabold text-slate-800 dark:text-white leading-none">
                {loading ? '...' : `${stats.onTimePercent}%`}
             </p>
             <p className="text-[10px] font-semibold text-slate-500 mt-1">On-Time</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 text-center flex flex-col items-center justify-center">
             <div className="w-8 h-8 bg-orange-50 dark:bg-orange-500/10 text-orange-400 rounded-full flex items-center justify-center mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
             </div>
             <p className="text-sm font-extrabold text-slate-800 dark:text-white leading-none">
                {loading ? '...' : stats.score}<span className="text-[10px] text-slate-400 font-medium">/5</span>
             </p>
             <p className="text-[10px] font-semibold text-slate-500 mt-1">Score</p>
          </div>
        </div>

        {/* --- Menus --- */}
        <div className="space-y-5">
          {/* Section 1 */}
          <div>
            <h3 className="text-[11px] font-bold text-blue-700 dark:text-blue-500 uppercase tracking-wider mb-2 ml-1">ATTENDANCE & SCHEDULE</h3>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden divide-y divide-slate-50 dark:divide-slate-700/50">
              
              <div onClick={() => navigate('/timesheet')} className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-full flex items-center justify-center"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Shift & Schedule</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Lihat Timesheet bulanan Anda</p>
                  </div>
                </div>
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </div>
              
              <div onClick={() => navigate('/riwayat-pengajuan')} className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg></div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Riwayat Izin & Sakit</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Cek status persetujuan pembimbing</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {stats.pendingLeaves > 0 && (
                    <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{stats.pendingLeaves} pending</span>
                  )}
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div>
            <h3 className="text-[11px] font-bold text-blue-700 dark:text-blue-500 uppercase tracking-wider mb-2 ml-1">WORK & SECURITY</h3>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden divide-y divide-slate-50 dark:divide-slate-700/50">
              <div className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full flex items-center justify-center"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg></div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Perangkat Saat Ini</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Handphone • Aktif</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div>
            <h3 className="text-[11px] font-bold text-blue-700 dark:text-blue-500 uppercase tracking-wider mb-2 ml-1">GENERAL & PREFERENCES</h3>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden divide-y divide-slate-50 dark:divide-slate-700/50">
              <div onClick={() => navigate('/setting')} className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-violet-50 dark:bg-violet-500/10 text-violet-600 rounded-full flex items-center justify-center"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg></div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Pengaturan Aplikasi</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Ubah Sandi, Dark Mode, & Notif</p>
                  </div>
                </div>
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </div>
            </div>
          </div>
        </div>
        
        {/* --- SIGN OUT BUTTON --- */}
        <button 
          onClick={handleSignOut}
          className="w-full bg-red-50 dark:bg-red-500/10 text-red-600 font-bold py-3.5 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-all flex justify-center items-center gap-2 border border-red-100 dark:border-red-500/20 mt-6"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          Sign Out
        </button>

        <div className="text-center pb-2 text-[10px] font-semibold text-slate-400">
           <p>ClockSync Enterprise v3.4.2</p>
           <p className="font-normal text-slate-300 dark:text-slate-600 mt-0.5">Sistem Informasi Absensi Magang</p>
        </div>
      </main>

      <BottomNav />

      {/* ======================================= */}
      {/* 🔥 MODAL POP-UP EDIT PROFILE & USERNAME 🔥 */}
      {/* ======================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative animate-fadeIn">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 text-center">Edit Profil</h3>
            
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Area Klik Foto */}
              <div className="flex flex-col items-center">
                <div 
                  className="relative w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer overflow-hidden group"
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
                <input 
                  type="file" 
                  accept="image/*"
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFotoChange} 
                />
                <p className="text-[10px] text-slate-400 mt-2">Ketuk untuk mengganti foto</p>
              </div>

              {/* Input Nama */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Nama Lengkap</label>
                <input 
                  type="text" 
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  required
                />
              </div>

              {/* 🔥 INPUT UBAH USERNAME 🔥 */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Username (ID Login)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 font-bold text-sm">@</span>
                  <input 
                    type="text" 
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value.toLowerCase())}
                    placeholder="contoh: joko123"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-3 text-sm font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition lowercase"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Gunakan huruf kecil & angka tanpa spasi.</p>
              </div>

              {/* Tombol Aksi */}
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    'Simpan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}