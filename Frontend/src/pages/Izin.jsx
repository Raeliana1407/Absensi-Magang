import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Izin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem('user')) || {};
  
  const [formData, setFormData] = useState({
    kategori: 'Keperluan Keluarga',
    tanggal_mulai: '',
    tanggal_selesai: '',
    keterangan: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Gabungkan kategori ke dalam keterangan untuk database
    const keteranganLengkap = `[${formData.kategori}] ${formData.keterangan}`;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://absensi-magang-beta.vercel.app/api/pengajuan/izin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: user.id,
          tanggal_mulai: formData.tanggal_mulai,
          tanggal_selesai: formData.tanggal_selesai,
          keterangan: keteranganLengkap
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('Berhasil: ' + result.message);
        navigate(-1);
      } else {
        alert('Gagal: ' + result.message);
      }
    } catch (error) {
      alert('Terjadi kesalahan saat mengirim pengajuan.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#F8FAFC] font-sans text-slate-800">
      {/* Ubah header di Izin.jsx dan Sakit.jsx menjadi seperti ini: */}
      <header className="bg-white p-5 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-slate-50 text-slate-600 rounded-full hover:bg-slate-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <h1 className="text-lg font-bold text-[#0B1E46]">Pengajuan Izin</h1>
        </div>
        <button onClick={() => navigate('/riwayat-pengajuan')} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100">
          Riwayat
        </button>
      </header>
      
      <main className="p-5">
        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500">Jenis Izin</label>
            <select name="kategori" value={formData.kategori} onChange={handleChange} className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500">
               <option value="Keperluan Keluarga">Keperluan Keluarga</option>
               <option value="Urusan Akademik / Kampus">Urusan Akademik / Kampus</option>
               <option value="Lainnya">Lainnya</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
             <div>
               <label className="text-xs font-bold text-slate-500">Dari Tanggal</label>
               <input type="date" name="tanggal_mulai" value={formData.tanggal_mulai} onChange={handleChange} required className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
             </div>
             <div>
               <label className="text-xs font-bold text-slate-500">Sampai</label>
               <input type="date" name="tanggal_selesai" value={formData.tanggal_selesai} onChange={handleChange} required className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
             </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500">Alasan Lengkap</label>
            <textarea name="keterangan" value={formData.keterangan} onChange={handleChange} required rows="4" placeholder="Jelaskan alasan izin..." className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"></textarea>
          </div>
          <button type="submit" disabled={loading} className={`w-full text-white font-bold py-3.5 rounded-xl shadow-lg mt-2 ${loading ? 'bg-amber-300' : 'bg-amber-500 hover:bg-amber-600'}`}>
            {loading ? 'Mengirim...' : 'Kirim Pengajuan'}
          </button>
        </form>
      </main>
    </div>
  );
}