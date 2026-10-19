import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Sakit() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem('user')) || {};
  
  const [formData, setFormData] = useState({ tanggal_mulai: '', tanggal_selesai: '', keterangan: '' });
  const [file, setFile] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const submitData = new FormData();
    submitData.append('user_id', user.id);
    submitData.append('tanggal_mulai', formData.tanggal_mulai);
    submitData.append('tanggal_selesai', formData.tanggal_selesai); // Wajib diisi sesuai DB
    submitData.append('keterangan', formData.keterangan);
    if (file) {
        submitData.append('file_lampiran', file); // Sesuai nama kolom DB
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://absensi-magang-beta.vercel.app/api/pengajuan/sakit', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }, // Form Data tidak butuh Content-Type header
        body: submitData
      });

      const result = await response.json();
      if (result.success) {
        alert('Berhasil: ' + result.message);
        navigate(-1);
      } else {
        alert('Gagal: ' + result.message);
      }
    } catch (error) {
      alert('Terjadi kesalahan koneksi.');
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
          <div className="grid grid-cols-2 gap-3">
             <div>
               <label className="text-xs font-bold text-slate-500">Mulai Sakit</label>
               <input type="date" name="tanggal_mulai" value={formData.tanggal_mulai} onChange={handleChange} required className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
             </div>
             <div>
               <label className="text-xs font-bold text-slate-500">Sampai Dengan</label>
               <input type="date" name="tanggal_selesai" value={formData.tanggal_selesai} onChange={handleChange} required className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
             </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500">Keterangan / Gejala</label>
            <textarea name="keterangan" value={formData.keterangan} onChange={handleChange} required rows="3" placeholder="Contoh: Demam tinggi dan flu..." className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"></textarea>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500">Surat Dokter (Opsional)</label>
            <input type="file" onChange={handleFileChange} accept=".jpg,.jpeg,.png,.pdf" className="mt-1 w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100 bg-slate-50 p-2 rounded-xl border border-dashed border-slate-300" />
          </div>
          
          <button type="submit" disabled={loading} className={`w-full text-white font-bold py-3.5 rounded-xl shadow-lg mt-2 ${loading ? 'bg-rose-300' : 'bg-rose-500 hover:bg-rose-600'}`}>
            {loading ? 'Memproses...' : 'Kirim Pengajuan'}
          </button>
        </form>
      </main>
    </div>
  );
}