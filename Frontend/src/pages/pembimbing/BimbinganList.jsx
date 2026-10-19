import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function BimbinganList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [listBimbingan, setListBimbingan] = useState([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Ambil data user (pembimbing) yang sedang login dari localStorage
  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchBimbingan = async () => {
      if (!currentUser || !currentUser.id) return;
      
      try {
        const response = await fetch(`https://absensi-magang-beta.vercel.app/api/pembimbing/bimbingan/${currentUser.id}`);
        const result = await response.json();
        
        if (result.success) {
          setListBimbingan(result.data);
        }
      } catch (error) {
        console.error("Gagal menarik data bimbingan:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBimbingan();
  }, [currentUser]);

  // Filter berdasarkan pencarian
  const filteredBimbingan = listBimbingan.filter(mhs => 
    mhs.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (mhs.divisi && mhs.divisi.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      
      {/* HEADER */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold text-blue-600 tracking-widest uppercase bg-blue-50 px-3 py-1 rounded-full">Modul Supervisor</span>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 mt-2">Daftar Mahasiswa & Tim Bimbingan</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">Kelola progres magang, logbook, dan evaluasi berkala.</p>
        </div>
      </div>

      {/* STATS RINGKASAN */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Bimbingan</p>
          <h3 className="text-3xl font-black text-slate-800 mt-2">{listBimbingan.length} <span className="text-xs text-slate-400 font-normal">Mahasiswa</span></h3>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Aktif</p>
          <h3 className="text-3xl font-black text-emerald-600 mt-2">{listBimbingan.filter(m => m.status === 'aktif').length}</h3>
        </div>
      </div>

      {/* PENCARIAN */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
         <div className="w-full md:w-1/3 flex items-center bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
            <svg className="w-5 h-5 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input 
              type="text" 
              placeholder="Cari nama atau divisi..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full font-medium" 
            />
         </div>
      </div>

      {/* LIST DATA MAHASISWA BIMBINGAN */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-center text-slate-500 py-8">Memuat data mahasiswa...</p>
        ) : filteredBimbingan.length === 0 ? (
          <p className="text-center text-slate-500 py-8">Belum ada mahasiswa yang ditugaskan ke Anda.</p>
        ) : (
          filteredBimbingan.map((mhs) => (
            <div key={mhs.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              
              <div className="flex items-start gap-4 w-full lg:w-1/3">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center font-black text-blue-600 shrink-0 text-xl">
                  {mhs.nama.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-800 text-sm">{mhs.nama}</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${mhs.status === 'aktif' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      {mhs.status || 'aktif'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{mhs.divisi || 'Belum ada divisi'}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{mhs.email}</p>
                </div>
              </div>

              <div className="w-full lg:w-1/3 flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 ml-auto">
                <div className="flex gap-2 w-full sm:w-auto">
                  <button 
                    onClick={() => navigate(`/pembimbing/mahasiswa/${mhs.id}`)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors"
                  >
                    Lihat Timesheet
                  </button>
                  <button 
                    onClick={() => navigate(`/pembimbing/mahasiswa/${mhs.id}`)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold rounded-xl transition-colors"
                  >
                    Cek Logbook
                  </button>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}