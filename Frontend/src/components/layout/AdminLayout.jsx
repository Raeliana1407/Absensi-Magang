import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

export default function AdminLayout() {
  const location = useLocation();
  const isActive = (path) => location.pathname.includes(path);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-800">
      
      {/* --- SIDEBAR DESKTOP --- */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 fixed h-full z-20">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-white font-black text-2xl flex items-center gap-2">
            <svg className="w-7 h-7 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM11 19.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.22.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
            ClockSync
          </h2>
          <p className="text-[10px] text-blue-400 font-bold tracking-widest mt-1 uppercase">Superadmin Portal</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-6">
          <Link to="/admin/users" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive('/users') ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            <span className="text-sm font-bold">Manajemen User</span>
          </Link>
          <Link to="/admin/settings" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive('/settings') ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}>
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
             <span className="text-sm font-bold">Sistem & Geofence</span>
          </Link>
        </nav>
        {/* Tombol Logout Sidebar Desktop */}
        <div className="p-4 mt-auto border-t border-slate-800">
          <button 
            onClick={() => {
              if(window.confirm('Yakin ingin keluar?')) {
                localStorage.clear();
                window.location.href = '/login';
              }
            }}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-colors text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            <span className="text-sm font-bold">Logout</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 md:ml-64 w-full pb-24 md:pb-8 pt-4 md:pt-8 px-4 md:px-8">
        <Outlet />
      </main>

      {/* --- BOTTOM NAV MOBILE --- */}
      <nav className="md:hidden fixed bottom-0 w-full bg-slate-900 text-slate-400 z-40 px-6 py-4 flex justify-around items-end rounded-t-3xl max-w-md mx-auto inset-x-0 shadow-2xl">
         <Link to="/admin/users" className={`flex flex-col items-center gap-1.5 transition-colors ${isActive('/users') ? 'text-white' : 'hover:text-slate-200'}`}>
            <svg className="w-6 h-6" fill={isActive('/users') ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            <span className="text-[10px] font-bold">Users</span>
         </Link>

         <Link to="/admin/settings" className={`flex flex-col items-center gap-1.5 transition-colors ${isActive('/settings') ? 'text-white' : 'hover:text-slate-200'}`}>
            <svg className="w-6 h-6" fill={isActive('/settings') ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            <span className="text-[10px] font-bold">Settings</span>
         </Link>
      </nav>
    </div>
  );
}