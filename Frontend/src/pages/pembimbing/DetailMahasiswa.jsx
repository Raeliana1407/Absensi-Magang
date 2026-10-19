import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function DetailMahasiswa() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('timesheet');
  
  // State untuk nyimpan data dari database
  const [data, setData] = useState({ profil: null, absen: [], logbook: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await fetch(`https://absensi-magang-beta.vercel.app/api/pembimbing/mahasiswa/${id}/detail`);
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error("Gagal menarik data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  if (loading) {
    return <div className="text-center p-10 text-slate-500 font-bold">Memuat data dari database...</div>;
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      
      {/* Tombol Kembali & Header Dinamis */}
      <div className="flex items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <button onClick={() => navigate(-1)} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <div>
          <span className="text-[10px] font-bold text-blue-600 tracking-widest uppercase">Detail Bimbingan • {data.profil?.divisi}</span>
          <h1 className="text-2xl font-black text-slate-800 mt-1">Rekap {data.profil?.nama}</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100 w-fit">
        <button 
          onClick={() => setActiveTab('timesheet')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'timesheet' ? 'bg-[#1E40AF] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          Riwayat Timesheet ({data.absen.length})
        </button>
        <button 
          onClick={() => setActiveTab('logbook')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'logbook' ? 'bg-[#1E40AF] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          Jurnal / Logbook ({data.logbook.length})
        </button>
      </div>

      {/* Konten Berdasarkan Tab */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {activeTab === 'timesheet' ? (
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase">
              <tr>
                <th className="p-5">Tanggal</th>
                <th className="p-5">Jam Masuk</th>
                <th className="p-5">Jam Pulang</th>
                <th className="p-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {data.absen.length === 0 ? (
                <tr><td colSpan="4" className="p-5 text-center text-slate-500">Belum ada riwayat absen.</td></tr>
              ) : (
                data.absen.map((absen, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-5 font-medium text-slate-700">
                      {new Date(absen.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </td>
                    <td className="p-5 font-bold text-slate-800">{absen.jam_masuk || '-'}</td>
                    <td className="p-5 font-bold text-slate-800">{absen.jam_pulang || '-'}</td>
                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${absen.status === 'Hadir' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {absen.status || 'Hadir'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <div className="p-6 space-y-4">
             {data.logbook.length === 0 ? (
                <p className="text-center text-slate-500">Belum ada jurnal/logbook yang diisi.</p>
              ) : (
                data.logbook.map((log, idx) => (
                  <div key={idx} className="p-4 border border-slate-200 rounded-2xl bg-slate-50">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-xs font-bold text-slate-500">
                         {new Date(log.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                      </p>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${log.status === 'Disetujui' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {log.status || 'Menunggu Review'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-800 font-medium">{log.kegiatan}</p>
                  </div>
                ))
             )}
          </div>
        )}
      </div>
      
    </div>
  );
}