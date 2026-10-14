import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Cek apakah halaman sedang aktif
  const isActive = (path) => location.pathname === path || location.pathname === `${path}/`;

  return (
    <>
      {/* --- MODAL / BOTTOM SHEET UNTUK MENU LAINNYA --- */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center max-w-md mx-auto">
          {/* Background Gelap (Backdrop) */}
          <div 
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMenuOpen(false)}
          ></div>
          
          {/* Panel Menu Meluncur dari Bawah */}
          <div className="relative w-full bg-white rounded-t-[32px] p-6 shadow-2xl animate-slide-up pb-10">
            {/* Garis Handle di Atas */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
            
            <div className="flex justify-between items-center mb-5 ml-1">
               <h3 className="text-lg font-black text-[#0B1E46]">Menu Pintasan</h3>
               <button onClick={() => setIsMenuOpen(false)} className="bg-slate-100 p-1.5 rounded-full text-slate-500 hover:bg-slate-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
               </button>
            </div>
            
            <div className="grid grid-cols-4 gap-3">
              {/* Menu 1: Sakit */}
              <div onClick={() => navigate('/sakit')} className="flex flex-col items-center gap-2 cursor-pointer group">
                <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shadow-sm border border-rose-100 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                </div>
                <span className="text-[10px] font-bold text-slate-600">Sakit</span>
              </div>

              {/* Menu 2: Izin */}
              <div onClick={() => navigate('/izin')} className="flex flex-col items-center gap-2 cursor-pointer group">
                <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shadow-sm border border-amber-100 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                </div>
                <span className="text-[10px] font-bold text-slate-600">Izin</span>
              </div>

              {/* Menu 3: Jurnal */}
              <div onClick={() => navigate('/jurnal')} className="flex flex-col items-center gap-2 cursor-pointer group">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </div>
                <span className="text-[10px] font-bold text-slate-600">Jurnal</span>
              </div>

              {/* Menu 4: Setting */}
              <div onClick={() => navigate('/setting')} className="flex flex-col items-center gap-2 cursor-pointer group">
                <div className="w-14 h-14 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center shadow-sm border border-slate-200 group-hover:bg-slate-600 group-hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                </div>
                <span className="text-[10px] font-bold text-slate-600">Setting</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- NAVIGATION BAR BAWAH --- */}
      <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-slate-100 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.05)] z-40 rounded-t-3xl px-6 py-4 flex justify-between items-end">
        
        {/* 1. Home */}
        <Link to="/home" className={`flex flex-col items-center gap-1.5 transition-colors ${isActive('/home') ? 'text-[#1E40AF]' : 'text-slate-400 hover:text-slate-600'}`}>
          <svg className="w-6 h-6" fill={isActive('/home') ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
          <span className="text-[10px] font-bold">Home</span>
        </Link>

        {/* 2. Timesheet */}
        <Link to="/timesheet" className={`flex flex-col items-center gap-1.5 transition-colors ${isActive('/timesheet') ? 'text-[#1E40AF]' : 'text-slate-400 hover:text-slate-600'}`}>
          <svg className="w-6 h-6" fill={isActive('/timesheet') ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
          <span className="text-[10px] font-bold">Riwayat</span>
        </Link>

        {/* 3. CENTER TOMBOL LAINNYA / MENU */}
        <div className="relative -top-5 flex flex-col items-center">
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="w-14 h-14 bg-[#1E3A8A] text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-900/30 border-4 border-[#F8FAFC] active:scale-95 transition-transform"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
          </button>
          <span className="text-[10px] font-bold text-slate-500 mt-1">Menu</span>
        </div>

        {/* 4. Location */}
        <Link to="/location" className={`flex flex-col items-center gap-1.5 transition-colors ${isActive('/location') ? 'text-[#1E40AF]' : 'text-slate-400 hover:text-slate-600'}`}>
          <svg className="w-6 h-6" fill={isActive('/location') ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          <span className="text-[10px] font-bold">Lokasi</span>
        </Link>

        {/* 5. Profile */}
        <Link to="/profile" className={`flex flex-col items-center gap-1.5 transition-colors ${isActive('/profile') ? 'text-[#1E40AF]' : 'text-slate-400 hover:text-slate-600'}`}>
          <svg className="w-6 h-6" fill={isActive('/profile') ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          <span className="text-[10px] font-bold">Profil</span>
        </Link>

      </nav>
      
      {/* CSS Tambahan untuk Animasi Bottom Sheet */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </>
  );
}