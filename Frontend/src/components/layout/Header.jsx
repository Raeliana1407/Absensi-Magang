import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Header({ pageTitle }) {
  const navigate = useNavigate();

  // Ambil data user dari LocalStorage
  const userDataString = localStorage.getItem('user');
  const user = userDataString ? JSON.parse(userDataString) : { id: 1, nama: 'User' };
  
  const namaDepan = user.nama ? user.nama.split(' ')[0] : 'U';
  const inisial = namaDepan.charAt(0).toUpperCase();

  return (
    <header className="flex items-center justify-between p-5 bg-white shadow-sm border-b border-slate-100 sticky top-0 z-50">
      
      {/* KIRI: Logo & Judul Halaman Dinamis */}
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 text-white p-2 rounded-xl shadow-md">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <div>
          <h1 className="text-xs font-black text-blue-600 tracking-wider uppercase">ClockSync</h1>
          {/* Ini akan berubah sesuai prop yang dikirim dari halaman (misal: Attendance Home / Location Hub) */}
          <h2 className="text-sm font-semibold text-slate-700">{pageTitle}</h2>
        </div>
      </div>

      {/* KANAN: Status Live & Profil */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-2.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Live
        </div>
        
        {/* Tombol Profil yang bisa diklik */}
        <button 
          onClick={() => navigate('/profile')} // Sesuaikan dengan route profil Anda
          className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-lg border-2 border-white shadow-sm overflow-hidden hover:scale-105 active:scale-95 transition-all"
        >
          {user.foto_profil ? (
            <img 
              src={user.foto_profil.startsWith('http') ? user.foto_profil : `https://absensi-magang-beta.vercel.app/uploads/${user.foto_profil}`} 
              alt="Profil" 
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{inisial}</span>
          )}
        </button>
      </div>
    </header>
  );
}