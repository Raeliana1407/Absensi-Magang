import React, { useState, useEffect } from 'react';

export default function DashboardPembimbing() {
  const [bimbingan, setBimbingan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterActive, setFilterActive] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  const userDataString = localStorage.getItem('user');
  const user = userDataString ? JSON.parse(userDataString) : { id: 1, nama: 'Dr. Pembimbing' };

  const todayFormatted = new Date().toLocaleDateString('id-ID', { 
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
  });
  const shortDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`https://absensi-magang-beta.vercel.app/api/pembimbing/dashboard-hari-ini/${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        
        if (result.success) {
          setBimbingan(result.data);
        }
      } catch (error) {
        console.error("Gagal menarik data dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user.id) fetchDashboard();
  }, [user.id]);

  const totalBimbingan = bimbingan.length;
  const countOnTrack = bimbingan.filter(b => b.status === 'ontrack').length;
  const countLate = bimbingan.filter(b => b.status === 'late').length;
  const countAbsent = bimbingan.filter(b => b.status === 'absent').length;
  const hadirPercent = totalBimbingan ? Math.round(((countOnTrack + countLate) / totalBimbingan) * 100) : 0;

  const filteredData = bimbingan.filter((mhs) => {
    const matchesSearch = mhs.name?.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesFilter = true;
    if (filterActive === 'In-Zone') matchesFilter = mhs.status === 'ontrack';
    if (filterActive === 'Terlambat') matchesFilter = mhs.status === 'late';
    if (filterActive === 'Izin Sakit') matchesFilter = mhs.status === 'absent';
    return matchesSearch && matchesFilter;
  }).sort((a, b) => a.id - b.id); // 🔥 TAMBAHKAN BARIS INI UNTUK URUTAN BERDASARKAN ID 🔥

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      
      {/* 1. HEADER SECTION */}
      <div className="hidden md:flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Selamat Pagi, {user.nama}</h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-slate-500 font-medium">
            <span>Portal Pemantauan & Bimbingan Mahasiswa / Magang</span>
            <span>•</span>
            <span>{todayFormatted}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-bold">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            Live Radar Sync
          </div>
        </div>
      </div>

      <div className="md:hidden bg-[#1E40AF] -mx-4 -mt-4 p-6 rounded-b-[40px] text-white shadow-lg relative overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-10 -translate-y-10"></div>
         <p className="text-xs font-bold tracking-widest text-blue-200 uppercase mb-1">Selamat Pagi</p>
         <h1 className="text-2xl font-black leading-tight w-3/4">{user.nama}</h1>
         <div className="flex items-center gap-2 mt-3 text-[11px] bg-white/10 w-fit px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/20">
            <span>{shortDate}</span>
            <span className="w-1 h-1 bg-white rounded-full"></span>
            <span className="text-emerald-300 font-bold flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
              Live {totalBimbingan} Bimbingan
            </span>
         </div>
      </div>

      {/* 2. STATS CARDS SECTION */}
      <div className="grid grid-cols-3 gap-3 md:gap-6">
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Hadir / On-Track</p>
          <div className="flex items-baseline gap-1 md:gap-2">
            <h2 className="text-3xl md:text-5xl font-black text-slate-800">{countOnTrack}</h2>
            <span className="text-[10px] md:text-sm font-bold text-slate-400">/ {totalBimbingan}</span>
          </div>
          <div className="mt-3 inline-block bg-emerald-50 text-emerald-600 text-[10px] md:text-xs font-bold px-2 py-1 rounded-md w-fit">
            {hadirPercent}% Kehadiran
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Terlambat / Tinjau</p>
          <div className="flex items-baseline gap-1 md:gap-2">
            <h2 className="text-3xl md:text-5xl font-black text-amber-500">{countLate}</h2>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Izin / Sakit</p>
          <div className="flex items-baseline gap-1 md:gap-2">
            <h2 className="text-3xl md:text-5xl font-black text-rose-500">{countAbsent}</h2>
          </div>
        </div>
      </div>

      {/* 3. FILTER & SEARCH */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-slate-100">
         <div className="w-full md:w-1/3 flex items-center bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
            <svg className="w-5 h-5 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input 
              type="text" 
              placeholder="Cari nama bimbingan..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full font-medium" 
            />
         </div>
         <div className="w-full md:w-auto flex overflow-x-auto gap-2 pb-1 md:pb-0 hide-scrollbar">
            {['Semua', 'In-Zone', 'Terlambat', 'Izin Sakit'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setFilterActive(tab)}
                className={`whitespace-nowrap px-4 py-2 text-xs font-bold rounded-full transition-colors ${
                  filterActive === tab 
                    ? 'bg-[#1E40AF] text-white shadow-md' 
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {tab} {tab === 'Semua' ? `(${totalBimbingan})` : tab === 'In-Zone' ? `(${countOnTrack})` : tab === 'Terlambat' ? `(${countLate})` : `(${countAbsent})`}
              </button>
            ))}
         </div>
      </div>

      {/* 4. LIST MAHASISWA */}
      {loading ? (
         <div className="py-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
         </div>
      ) : filteredData.length === 0 ? (
         <div className="py-12 text-center text-slate-500 font-bold bg-white rounded-2xl border border-slate-100">
            Tidak ada data yang cocok dengan pencarian / filter Anda.
         </div>
      ) : (
        <>
          {/* DESKTOP TABLE */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase">
                <tr>
                  <th className="p-5">Mahasiswa / Bimbingan</th>
                  <th className="p-5">Waktu Masuk</th>
                  <th className="p-5">Status Lokasi & Geofence</th>
                  <th className="p-5">Aktivitas / Logbook</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map((mhs) => (
                  <tr key={mhs.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        
                        {/* 🔥 BAGIAN FOTO PROFIL DINAMIS (DESKTOP) 🔥 */}
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700 overflow-hidden border border-slate-200">
                          {mhs.foto_profil ? (
                            <img 
                              src={mhs.foto_profil.startsWith('http') ? mhs.foto_profil : `https://absensi-magang-beta.vercel.app/uploads/${mhs.foto_profil}`} 
                              alt={mhs.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            mhs.img
                          )}
                        </div>

                        <div>
                          <p className="font-bold text-slate-800 text-sm">{mhs.name}</p>
                          <p className="text-xs text-slate-500">{mhs.nim} {mhs.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <p className={`font-bold text-sm ${mhs.status === 'absent' || mhs.status === 'belum_absen' ? 'text-slate-400' : 'text-slate-700'}`}>{mhs.time}</p>
                      <p className={`text-xs mt-0.5 font-medium ${mhs.status === 'late' ? 'text-amber-500' : mhs.status === 'absent' ? 'text-rose-500' : mhs.status === 'belum_absen' ? 'text-slate-400' : 'text-emerald-500'}`}>{mhs.timeStatus}</p>
                    </td>
                    <td className="p-5">
                      {/* 🔥 BAGIAN LOKASI DINAMIS 🔥 */}
                      <p className="text-sm font-bold text-slate-700">{mhs.loc}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${mhs.status === 'absent' || mhs.status === 'belum_absen' ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                        <p className={`text-xs font-bold ${mhs.status === 'absent' || mhs.status === 'belum_absen' ? 'text-rose-500' : 'text-emerald-600'}`}>{mhs.geo}</p>
                      </div>
                    </td>
                    <td className="p-5">
                      <p className="text-xs text-slate-600 max-w-[200px] truncate">{mhs.activity}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS */}
          <div className="md:hidden space-y-4">
            <h3 className="text-sm font-black text-slate-800 ml-1">Aktivitas Hari Ini</h3>
            {filteredData.map((mhs) => (
              <div key={mhs.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    
                    {/* 🔥 BAGIAN FOTO PROFIL DINAMIS (MOBILE) 🔥 */}
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700 relative overflow-hidden border border-slate-200">
                      {mhs.foto_profil ? (
                        <img 
                          src={mhs.foto_profil.startsWith('http') ? mhs.foto_profil : `https://absensi-magang-beta.vercel.app/uploads/${mhs.foto_profil}`} 
                          alt={mhs.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        mhs.img
                      )}
                    </div>

                    <div>
                      <p className="font-bold text-slate-800 text-sm">{mhs.name}</p>
                      <p className="text-[10px] text-slate-500">{mhs.role}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-md text-[10px] font-bold ${mhs.status === 'late' ? 'bg-amber-50 text-amber-600' : mhs.status === 'absent' || mhs.status === 'belum_absen' ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600'}`}>
                    {mhs.status === 'late' ? mhs.timeStatus : mhs.time}
                  </div>
                </div>
                
                <div className="bg-slate-50 p-3 rounded-xl mb-3">
                  <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    {/* 🔥 BAGIAN LOKASI DINAMIS 🔥 */}
                    {mhs.loc}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 ml-5 truncate">{mhs.activity}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="h-10 md:hidden"></div>
    </div>
  );
}