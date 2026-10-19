import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Jurnal() {
  const navigate = useNavigate();
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [riwayat, setRiwayat] = useState([]);
  
  // Ambil user yang lagi login dari localStorage
  const currentUser = JSON.parse(localStorage.getItem('user'));

  // Fungsi narik riwayat jurnal dari backend
  const fetchRiwayat = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`https://absensi-magang-beta.vercel.app/api/jurnal/${currentUser.id}`);
      const data = await res.json();
      if (data.success) {
        setRiwayat(data.data);
      }
    } catch (error) {
      console.error("Gagal narik riwayat:", error);
    }
  };

  useEffect(() => {
    fetchRiwayat();
  }, []);

  // Fungsi simpan jurnal baru
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!judul.trim() || !deskripsi.trim()) {
      alert('Judul dan deskripsi kegiatan wajib diisi bro!');
      return;
    }

    // Kita gabungkan judul dan deskripsi jadi satu string untuk dikirim ke kolom 'kegiatan'
    const gabunganKegiatan = `[${judul}] ${deskripsi}`;

    try {
      const res = await fetch('https://absensi-magang-beta.vercel.app/api/jurnal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          kegiatan: gabunganKegiatan,
          deskripsi: deskripsi
        })
      });
      const result = await res.json();

      if (result.success) {
        alert('Mantap, jurnal berhasil disimpan!');
        setJudul('');
        setDeskripsi('');
        fetchRiwayat(); // Refresh list riwayat otomatis
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("Gagal nyimpen:", error);
      alert('Terjadi kesalahan jaringan.');
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#F8FAFC] font-sans text-slate-800 pb-20">
      <header className="bg-[#1E40AF] p-5 flex items-center gap-4 shadow-sm sticky top-0 z-10 text-white rounded-b-3xl">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/10 text-white rounded-full hover:bg-white/20">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <div>
           <h1 className="text-lg font-bold">Jurnal Magang</h1>
           <p className="text-xs text-blue-200">Catat kegiatan harianmu</p>
        </div>
      </header>

      <main className="p-5 mt-2">
        {/* FORM BUNGKUS DENGAN ONSUBMIT */}
        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4 mb-6">
          <h3 className="text-sm font-bold text-slate-800 border-b pb-2">Entri Jurnal Baru</h3>
          <div>
            <label className="text-xs font-bold text-slate-500">Kegiatan Hari Ini</label>
            <input 
              type="text" 
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Contoh: Membuat API Login" 
              className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500" 
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500">Deskripsi Lengkap & Kendala</label>
            <textarea 
              rows="4" 
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Hari ini saya mengerjakan..." 
              className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"
            ></textarea>
          </div>
          <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 transition-colors text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/30">
            Simpan Jurnal
          </button>
        </form>

        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2">Riwayat Jurnal</h3>
        
        <div className="space-y-3">
          {riwayat.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-4">Belum ada riwayat jurnal yang tersimpan.</p>
          ) : (
            riwayat.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-emerald-500 space-y-1">
                 <p className="text-sm font-bold text-slate-800">{item.kegiatan}</p>
                 <p className="text-[10px] font-bold text-emerald-600 pt-1">
                   {new Date(item.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                 </p>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}