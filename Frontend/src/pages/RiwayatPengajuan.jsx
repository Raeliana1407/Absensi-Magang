import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RiwayatPengajuan() {
  const navigate = useNavigate();
  const [riwayat, setRiwayat] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchRiwayat = async () => {
      try {
        const response = await fetch(`https://absensi-magang-beta.vercel.app/api/pengajuan/riwayat/${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        
        if (result.success) {
          setRiwayat(result.data);
        }
      } catch (error) {
        console.error("Gagal mengambil riwayat:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user.id) fetchRiwayat();
  }, [user.id, token]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', { 
      day: 'numeric', month: 'short', year: 'numeric' 
    });
  };

  const getStatusStyle = (status) => {
    if (status === 'disetujui') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (status === 'ditolak') return 'bg-rose-100 text-rose-700 border-rose-200';
    return 'bg-amber-100 text-amber-700 border-amber-200'; // pending
  };

  const getStatusText = (status) => {
    if (status === 'disetujui') return '✓ Disetujui';
    if (status === 'ditolak') return '✕ Ditolak';
    return '⏳ Menunggu';
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#F8FAFC] font-sans text-slate-800 pb-10">
      <header className="bg-white p-5 flex items-center gap-4 shadow-sm sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 bg-slate-50 text-slate-600 rounded-full hover:bg-slate-100">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <h1 className="text-lg font-bold text-[#0B1E46]">Riwayat Pengajuan</h1>
      </header>

      <main className="p-5">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : riwayat.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
            <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            <p className="text-sm font-bold text-slate-500">Belum ada riwayat pengajuan.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {riwayat.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${item.jenis_izin === 'sakit' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                      {item.jenis_izin}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {formatDate(item.created_at)}
                    </span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusStyle(item.status)}`}>
                    {getStatusText(item.status)}
                  </span>
                </div>
                
                <div className="mt-3">
                  <p className="text-xs font-bold text-slate-700">
                    {formatDate(item.tanggal_mulai)} {item.tanggal_selesai && item.tanggal_selesai !== item.tanggal_mulai ? ` s/d ${formatDate(item.tanggal_selesai)}` : ''}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {item.keterangan}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}