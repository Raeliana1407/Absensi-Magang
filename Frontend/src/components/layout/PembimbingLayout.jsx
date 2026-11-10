import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

export default function PembimbingLayout() {
  const location = useLocation();
  const isActive = (path) => location.pathname.includes(path);

  // Ambil data user untuk cek role
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const isAdmin = user.role === 'admin';

  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const cekPending = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const res = await fetch('https://absensi-magang-beta.vercel.app/api/pengajuan/pending', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.success) {
          setPendingCount(data.data.length);
        }
      } catch (error) {
        console.error("Gagal mengambil notif pending:", error);
      }
    };

    cekPending();
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-800">
      
      {/* =========================================
          1. SIDEBAR (DESKTOP MODE) - Hidden di HP
      ============================================= */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 fixed h-full z-20">
        <div className="p-6">
          <h2 className="text-[#1E40AF] font-black text-2xl flex items-center gap-2">
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM11 19.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.22.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
            ClockSync
          </h2>
          <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-1 uppercase">
            {isAdmin ? 'Superadmin Portal' : 'Supervisor Portal'}
          </p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          
          {/* --- MENU SHARED (ADMIN & PEMBIMBING) --- */}
          <Link to="/pembimbing/dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive('/dashboard') ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
            <span className="text-sm font-bold">Dashboard</span>
          </Link>
          <Link to="/pembimbing/bimbingan" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive('/bimbingan') ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
             <span className="text-sm font-bold">{isAdmin ? 'All Employees' : 'My Employees'}</span>
          </Link>

          <Link to="/pembimbing/persetujuan" className={`flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${isActive('/persetujuan') ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span className="text-sm font-bold">Approvals</span>
            </div>
            {!isActive('/persetujuan') && pendingCount > 0 && <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>}
          </Link>

          <Link to="/pembimbing/laporan" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive('/laporan') ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
             <span className="text-sm font-bold">Reports</span>
          </Link>

          {/* --- MENU KHUSUS ADMIN (Hanya render jika role === 'admin') --- */}
          {isAdmin && (
            <>
              <div className="pt-4 pb-1">
                 <p className="px-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">Admin Control</p>
              </div>
              <Link to="/pembimbing/admin-users" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive('/admin-users') ? 'bg-amber-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                 <span className="text-sm font-bold">Users Manager</span>
              </Link>
              <Link to="/pembimbing/admin-settings" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive('/admin-settings') ? 'bg-amber-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                 <span className="text-sm font-bold">Locations</span>
              </Link>
            </>
          )}

        </nav>

        {/* SETTINGS DESKTOP */}
        <div className="p-4 border-t border-slate-100">
          <Link to="/pembimbing/settings" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive('/settings') && !isActive('/admin-settings') ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            <span className="text-sm font-bold">Profile Settings</span>
          </Link>
        </div>
      </aside>

      {/* =========================================
          2. MAIN CONTENT
      ============================================= */}
      <main className="flex-1 md:ml-64 w-full pb-24 md:pb-8 pt-4 md:pt-8 px-4 md:px-8">
        <Outlet />
      </main>

      {/* =========================================
          3. BOTTOM NAV (MOBILE MODE)
      ============================================= */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-100 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.05)] z-40 px-4 py-4 flex justify-between items-end rounded-t-3xl max-w-md mx-auto inset-x-0">
         <Link to="/pembimbing/dashboard" className={`flex flex-col items-center gap-1.5 transition-colors ${isActive('/dashboard') ? 'text-[#1E40AF]' : 'text-slate-400 hover:text-slate-600'}`}>
            <svg className="w-6 h-6" fill={isActive('/dashboard') ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
            <span className="text-[10px] font-bold">Home</span>
         </Link>

         <Link to="/pembimbing/bimbingan" className={`flex flex-col items-center gap-1.5 transition-colors ${isActive('/bimbingan') ? 'text-[#1E40AF]' : 'text-slate-400 hover:text-slate-600'}`}>
            <svg className="w-6 h-6" fill={isActive('/bimbingan') ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            <span className="text-[10px] font-bold">Team</span>
         </Link>

         {/* Di Mobile, kalau dia Admin, kita kasih icon Gear utk Admin Panel, kalo bukan, icon File laporan */}
         {isAdmin ? (
           <Link to="/pembimbing/admin-users" className={`flex flex-col items-center gap-1.5 transition-colors ${isActive('/admin-users') || isActive('/admin-settings') ? 'text-amber-500' : 'text-slate-400 hover:text-slate-600'}`}>
              <svg className="w-6 h-6" fill={isActive('/admin-users') || isActive('/admin-settings') ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
              <span className="text-[10px] font-bold">Admin</span>
           </Link>
         ) : (
           <Link to="/pembimbing/laporan" className={`flex flex-col items-center gap-1.5 transition-colors ${isActive('/laporan') ? 'text-[#1E40AF]' : 'text-slate-400 hover:text-slate-600'}`}>
              <svg className="w-6 h-6" fill={isActive('/laporan') ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              <span className="text-[10px] font-bold">Reports</span>
           </Link>
         )}

         <Link to="/pembimbing/settings" className={`flex flex-col items-center gap-1.5 transition-colors ${isActive('/settings') && !isActive('/admin-settings') ? 'text-[#1E40AF]' : 'text-slate-400 hover:text-slate-600'}`}>
            <svg className="w-6 h-6" fill={isActive('/settings') && !isActive('/admin-settings') ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            <span className="text-[10px] font-bold">Settings</span>
         </Link>
      </nav>

    </div>
  );
}