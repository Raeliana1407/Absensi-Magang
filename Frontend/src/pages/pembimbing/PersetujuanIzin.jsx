import React, { useState, useEffect } from 'react';

export default function PersetujuanIzin() {
  const [pengajuan, setPengajuan] = useState([]);
  const [riwayat, setRiwayat] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  // STATE UNTUK MODAL DETAIL RIWAYAT
  const [selectedRiwayat, setSelectedRiwayat] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user')) || {};

  const fetchData = async () => {
    try {
      const resPending = await fetch('https://absensi-magang-beta.vercel.app/api/pengajuan/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataPending = await resPending.json();
      if (dataPending.success) setPengajuan(dataPending.data);

      if (user.id) {
        const resRiwayat = await fetch(`https://absensi-magang-beta.vercel.app/api/pengajuan/riwayat-pembimbing/${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const dataRiwayat = await resRiwayat.json();
        if (dataRiwayat.success) setRiwayat(dataRiwayat.data);
      }
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, user.id]);

  const handleAksi = async (id, statusBaru) => {
    const konfirmasi = window.confirm(`Apakah Anda yakin ingin ${statusBaru === 'disetujui' ? 'MENYETUJUI' : 'MENOLAK'} pengajuan ini?`);
    if (!konfirmasi) return;

    try {
      const response = await fetch(`https://absensi-magang-beta.vercel.app/api/pengajuan/status/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: statusBaru })
      });

      const result = await response.json();
      if (result.success) {
        const itemDiproses = pengajuan.find(item => item.id === id);
        setPengajuan(pengajuan.filter(item => item.id !== id)); 
        
        if (itemDiproses) {
          const itemTelahDiproses = { ...itemDiproses, status: statusBaru };
          setRiwayat([itemTelahDiproses, ...riwayat]); 
        }
      } else {
        alert('Gagal memperbarui status.');
      }
    } catch (error) {
      alert('Terjadi kesalahan server.');
    }
  };

  // 🔥 FUNGSI BARU: AKHIRI IZIN LEBIH AWAL 🔥
  const handleAkhiriIzin = async (id) => {
    const konfirmasi = window.confirm("Anak magang sudah kembali bekerja hari ini? Tanggal selesai izin akan diubah ke hari ini.");
    if (!konfirmasi) return;

    try {
      const response = await fetch(`https://absensi-magang-beta.vercel.app/api/pengajuan/akhiri/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const result = await response.json();
      if (result.success) {
        alert("Izin berhasil diselesaikan lebih awal.");
        setShowModal(false);
        fetchData(); // Refresh data untuk update tanggal selesai
      } else {
        alert("Gagal mengakhiri izin.");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan server.");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', { 
      day: 'numeric', month: 'short', year: 'numeric' 
    });
  };

  // Cek apakah izin masih berlangsung (belum kedaluwarsa)
  const isIzinAktif = (tanggalSelesai) => {
    const hariIni = new Date();
    hariIni.setHours(0,0,0,0);
    const selesai = new Date(tanggalSelesai);
    selesai.setHours(0,0,0,0);
    return selesai >= hariIni;
  };

  return (
    <div className="max-w-4xl mx-auto min-h-screen bg-[#F8FAFC] font-sans text-slate-800 pb-20 relative shadow-2xl">
      <header className="bg-[#1E40AF] p-6 shadow-lg rounded-b-[32px] sticky top-0 z-10 flex justify-between items-center">
        <div>
           <h1 className="text-xl font-bold text-white mb-1">Approval Dashboard</h1>
           <p className="text-sm text-blue-200">Konfirmasi Izin & Sakit Anak Magang</p>
        </div>
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-bold">
           {user.nama ? user.nama.charAt(0) : 'P'}
        </div>
      </header>

      <main className="p-6">
        
        {/* ==================================
            BAGIAN 1: PENDING APPROVALS
        =================================== */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-slate-700">Menunggu Persetujuan</h2>
          <span className="bg-amber-100 text-amber-700 font-bold px-3 py-1 rounded-full text-xs">
            {pengajuan.length} Pending
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-10">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : pengajuan.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <p className="text-slate-500 font-bold">Semua beres!</p>
            <p className="text-xs text-slate-400 mt-1">Tidak ada pengajuan yang perlu dikonfirmasi.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pengajuan.map((item) => (
              <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400"></div>
                <div className="flex justify-between items-start mb-3 pl-2">
                  <div>
                    <h3 className="font-bold text-[#0B1E46] text-lg">{item.nama_user}</h3>
                    <div className="flex gap-2 items-center mt-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${item.jenis_izin === 'sakit' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                        {item.jenis_izin}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {formatDate(item.tanggal_mulai)} {item.tanggal_selesai !== item.tanggal_mulai && `- ${formatDate(item.tanggal_selesai)}`}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold">{formatDate(item.created_at)}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4 ml-2">
                  <p className="text-sm text-slate-600"><strong>Alasan:</strong> {item.keterangan}</p>
                </div>

                {item.file_lampiran && (
                  <a 
                    href={item.file_lampiran.startsWith('http') ? item.file_lampiran : `https://absensi-magang-beta.vercel.app/uploads/${item.file_lampiran}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 mb-4 hover:underline ml-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                    Lihat Surat Dokter
                  </a>
                )}

                <div className="flex gap-3 mt-2 ml-2">
                  <button onClick={() => handleAksi(item.id, 'ditolak')} className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 transition">
                    Tolak
                  </button>
                  <button onClick={() => handleAksi(item.id, 'disetujui')} className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-500/20 hover:bg-emerald-600 transition">
                    ✓ Setujui
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ==================================
            BAGIAN 2: RIWAYAT PERSETUJUAN
        =================================== */}
        <div className="mt-12">
           <div className="flex justify-between items-center mb-4">
             <h2 className="font-bold text-slate-700">Riwayat Terakhir</h2>
           </div>

           {riwayat.length === 0 && !loading ? (
             <div className="text-center py-8 text-sm text-slate-400 font-medium bg-white rounded-2xl border border-slate-100 border-dashed">
               Belum ada riwayat persetujuan.
             </div>
           ) : (
             <div className="space-y-3">
               {riwayat.map((item) => (
                 <div 
                   key={item.id} 
                   onClick={() => { setSelectedRiwayat(item); setShowModal(true); }}
                   className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center cursor-pointer hover:border-blue-300 transition"
                 >
                   <div>
                     <p className="font-bold text-sm text-slate-800">{item.nama_user}</p>
                     <p className="text-xs text-slate-500 mt-0.5">
                       {item.jenis_izin.toUpperCase()} • {formatDate(item.tanggal_mulai)}
                     </p>
                   </div>
                   <div className="flex items-center gap-2">
                     <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                       item.status === 'disetujui' 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                          : 'bg-rose-50 text-rose-600 border border-rose-100'
                     }`}>
                       {item.status}
                     </span>
                     <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                   </div>
                 </div>
               ))}
             </div>
           )}
        </div>

      </main>

      {/* ==================================
          MODAL DETAIL RIWAYAT
      =================================== */}
      {showModal && selectedRiwayat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-black text-slate-800">Detail Pengajuan</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 font-bold">NAMA</p>
                <p className="font-bold text-slate-800">{selectedRiwayat.nama_user}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 font-bold">TANGGAL MULAI</p>
                  <p className="font-bold text-slate-700">{formatDate(selectedRiwayat.tanggal_mulai)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold">TANGGAL SELESAI</p>
                  <p className="font-bold text-slate-700">{formatDate(selectedRiwayat.tanggal_selesai)}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-400 font-bold">ALASAN / KETERANGAN</p>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mt-1">
                  <p className="text-sm text-slate-600">{selectedRiwayat.keterangan}</p>
                </div>
              </div>

              {selectedRiwayat.file_lampiran && (
                <div>
                  <p className="text-xs text-slate-400 font-bold mb-1">LAMPIRAN</p>
                  <a 
                    href={selectedRiwayat.file_lampiran.startsWith('http') ? selectedRiwayat.file_lampiran : `https://absensi-magang-beta.vercel.app/uploads/${selectedRiwayat.file_lampiran}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                    Lihat Dokumen / Surat Sakit
                  </a>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                <div className={`px-4 py-3 rounded-xl border text-center font-bold text-sm ${
                  selectedRiwayat.status === 'disetujui' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'
                }`}>
                  Status: {selectedRiwayat.status.toUpperCase()}
                </div>

                {/* TOMBOL AKHIRI IZIN MUNCUL JIKA STATUS DISETUJUI & TANGGAL SELESAI MASIH DI DEPAN */}
                {selectedRiwayat.status === 'disetujui' && isIzinAktif(selectedRiwayat.tanggal_selesai) && (
                  <button 
                    onClick={() => handleAkhiriIzin(selectedRiwayat.id)}
                    className="w-full py-3 bg-[#1E40AF] text-white font-bold rounded-xl text-sm shadow-md hover:bg-blue-800 transition flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    Selesaikan Izin Hari Ini
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}