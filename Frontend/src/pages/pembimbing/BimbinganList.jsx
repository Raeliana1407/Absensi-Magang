import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export default function BimbinganList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLokasi, setFilterLokasi] = useState('semua');
  const [filterDivisi, setFilterDivisi] = useState('semua');
  const [filterUniversitas, setFilterUniversitas] = useState('semua');

  const [listBimbingan, setListBimbingan] = useState([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // State Modal Edit Tanggal Magang (Khusus Pembimbing / Admin)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMhs, setSelectedMhs] = useState(null);
  const [editTglMulai, setEditTglMulai] = useState('');
  const [editTglSelesai, setEditTglSelesai] = useState('');
  const [isSavingPeriode, setIsSavingPeriode] = useState(false);

  // Ambil data user yang sedang login
  const currentUser = JSON.parse(localStorage.getItem('user'));
  const userId = currentUser?.id;
  const userRole = currentUser?.role;

  const fetchBimbingan = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await fetch(`https://absensi-magang-beta.vercel.app/api/pembimbing/bimbingan/${userId}?role=${userRole}`);
      const result = await response.json();
      
      if (result.success) {
        setListBimbingan(result.data);
      }
    } catch (error) {
      console.error("Gagal menarik data bimbingan:", error);
    } finally {
      setLoading(false);
    }
  }, [userId, userRole]);

  useEffect(() => {
    fetchBimbingan();
  }, [fetchBimbingan]);

  // Ekstrak daftar unik untuk opsi dropdown filter
  const uniqueLocations = [...new Set(listBimbingan.map(m => m.nama_lokasi).filter(Boolean))];
  const uniqueDivisi = [...new Set(listBimbingan.map(m => m.divisi).filter(Boolean))];
  const uniqueUniversitas = [...new Set(listBimbingan.map(m => m.universitas).filter(Boolean))];

  // Helper format tanggal Indonesia
  const formatTgl = (tglStr) => {
    if (!tglStr) return '-';
    const date = new Date(tglStr);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Helper hitung sisa hari magang
  const getSisaHariInfo = (tglSelesai) => {
    if (!tglSelesai) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(tglSelesai);
    end.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'Masa Magang Selesai', color: 'bg-slate-100 text-slate-600' };
    if (diffDays === 0) return { label: 'Berakhir Hari Ini', color: 'bg-rose-100 text-rose-700' };
    if (diffDays <= 7) return { label: `Sisa ${diffDays} Hari`, color: 'bg-amber-100 text-amber-700' };
    return null;
  };

  // Logika Filter Gabungan (Search + ULP + Divisi + Universitas)
  const filteredBimbingan = listBimbingan.filter(mhs => {
    const matchSearch = mhs.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (mhs.username && mhs.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
                        (mhs.divisi && mhs.divisi.toLowerCase().includes(searchTerm.toLowerCase())) ||
                        (mhs.universitas && mhs.universitas.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchLokasi = filterLokasi === 'semua' ? true : mhs.nama_lokasi === filterLokasi;
    const matchDivisi = filterDivisi === 'semua' ? true : mhs.divisi === filterDivisi;
    const matchUniv = filterUniversitas === 'semua' ? true : mhs.universitas === filterUniversitas;

    return matchSearch && matchLokasi && matchDivisi && matchUniv;
  });

  // Reset semua filter
  const handleResetFilter = () => {
    setSearchTerm('');
    setFilterLokasi('semua');
    setFilterDivisi('semua');
    setFilterUniversitas('semua');
  };

  const isFilterActive = searchTerm !== '' || filterLokasi !== 'semua' || filterDivisi !== 'semua' || filterUniversitas !== 'semua';

  // Buka Modal Edit Periode
  const handleOpenEditPeriode = (mhs) => {
    setSelectedMhs(mhs);
    setEditTglMulai(mhs.tgl_mulai || '');
    setEditTglSelesai(mhs.tgl_selesai || '');
    setIsEditModalOpen(true);
  };

  // Simpan Perubahan Tanggal Magang
  const handleSavePeriode = async (e) => {
    e.preventDefault();
    if (editTglMulai && editTglSelesai && editTglSelesai < editTglMulai) {
      alert('Tanggal selesai tidak boleh lebih awal dari tanggal mulai!');
      return;
    }

    setIsSavingPeriode(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://absensi-magang-beta.vercel.app/api/pembimbing/mahasiswa/${selectedMhs.id}/periode`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tgl_mulai: editTglMulai,
          tgl_selesai: editTglSelesai
        })
      });
      const result = await response.json();

      if (result.success) {
        alert('✅ Periode magang berhasil diperbarui!');
        setIsEditModalOpen(false);
        fetchBimbingan();
      } else {
        alert(result.message || 'Gagal memperbarui tanggal magang.');
      }
    } catch (error) {
      console.error('Error update periode:', error);
      alert('Terjadi kesalahan server.');
    } finally {
      setIsSavingPeriode(false);
    }
  };

  // Hitung jumlah yang segera selesai (<= 7 hari) dari data terfilter
  const segeraSelesaiCount = filteredBimbingan.filter(m => {
    if (!m.tgl_selesai) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(m.tgl_selesai);
    end.setHours(0, 0, 0, 0);
    const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 7;
  }).length;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      
      {/* HEADER */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold text-blue-600 tracking-widest uppercase bg-blue-50 px-3 py-1 rounded-full">
            {userRole === 'admin' ? 'Monitoring Global UP3 & ULP' : 'Modul Supervisor'}
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 mt-2">Daftar Mahasiswa & Tim Bimbingan</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">Klasifikasi populasi peserta magang, masa aktif, dan evaluasi berkala.</p>
        </div>
      </div>

      {/* STATS RINGKASAN POPULASI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Keseluruhan</p>
          <h3 className="text-3xl font-black text-slate-800 mt-2">{listBimbingan.length} <span className="text-xs text-slate-400 font-normal">Orang</span></h3>
        </div>
        <div className="bg-blue-600 p-5 rounded-2xl shadow-sm text-white">
          <p className="text-[10px] font-bold text-blue-100 uppercase tracking-wider">Populasi Terfilter</p>
          <h3 className="text-3xl font-black mt-2">{filteredBimbingan.length} <span className="text-xs text-blue-200 font-normal">Orang</span></h3>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Aktif</p>
          <h3 className="text-3xl font-black text-emerald-600 mt-2">{filteredBimbingan.filter(m => m.status === 'aktif').length} <span className="text-xs text-slate-400 font-normal">Orang</span></h3>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Segera Selesai (≤7 Hari)</p>
          <h3 className="text-3xl font-black text-amber-500 mt-2">{segeraSelesaiCount} <span className="text-xs text-slate-400 font-normal">Orang</span></h3>
        </div>
      </div>

      {/* PANEL PENCARIAN & FILTER KLASIFIKASI */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="flex items-center bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 focus-within:border-blue-500 transition-colors">
            <svg className="w-4 h-4 text-slate-400 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input 
              type="text" 
              placeholder="Cari nama, divisi, kampus..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-xs w-full font-medium text-slate-700" 
            />
          </div>

          {/* Filter ULP / Lokasi */}
          <select 
            value={filterLokasi} 
            onChange={(e) => setFilterLokasi(e.target.value)}
            className="bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="semua">📍 Semua Lokasi / ULP ({uniqueLocations.length})</option>
            {uniqueLocations.map((loc, idx) => (
              <option key={idx} value={loc}>{loc}</option>
            ))}
          </select>

          {/* Filter Bidang / Divisi */}
          <select 
            value={filterDivisi} 
            onChange={(e) => setFilterDivisi(e.target.value)}
            className="bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="semua">🏢 Semua Bidang / Divisi ({uniqueDivisi.length})</option>
            {uniqueDivisi.map((div, idx) => (
              <option key={idx} value={div}>{div}</option>
            ))}
          </select>

          {/* Filter Universitas */}
          <select 
            value={filterUniversitas} 
            onChange={(e) => setFilterUniversitas(e.target.value)}
            className="bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="semua">🎓 Semua Universitas / Sekolah ({uniqueUniversitas.length})</option>
            {uniqueUniversitas.map((univ, idx) => (
              <option key={idx} value={univ}>{univ}</option>
            ))}
          </select>
        </div>

        {isFilterActive && (
          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Menampilkan <span className="font-bold text-blue-600">{filteredBimbingan.length}</span> dari {listBimbingan.length} peserta magang
            </p>
            <button 
              onClick={handleResetFilter}
              className="text-xs font-bold text-rose-600 hover:underline"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* LIST DATA MAHASISWA BIMBINGAN */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-center text-slate-500 py-8">Memuat data mahasiswa...</p>
        ) : filteredBimbingan.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center">
            <p className="text-slate-500 text-sm">Tidak ada data mahasiswa yang sesuai dengan filter saat ini.</p>
          </div>
        ) : (
          filteredBimbingan.map((mhs) => {
            const sisaInfo = getSisaHariInfo(mhs.tgl_selesai);
            return (
              <div key={mhs.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 transition-all hover:border-blue-200 hover:shadow-md">
                
                {/* KIRI: Profil & Badge Lokasi */}
                <div className="flex items-start gap-4 w-full lg:w-5/12">
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center font-black text-blue-600 shrink-0 text-xl overflow-hidden border border-slate-200">
                    {mhs.foto_profil ? (
                      <img 
                        src={mhs.foto_profil.startsWith('http') ? mhs.foto_profil : `https://absensi-magang-beta.vercel.app/uploads/${mhs.foto_profil}`} 
                        alt={mhs.nama} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      mhs.nama.charAt(0).toUpperCase()
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-slate-800 text-sm">{mhs.nama}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${mhs.status === 'aktif' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {mhs.status || 'aktif'}
                      </span>
                    </div>

                    {/* Badge Lokasi ULP */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                        📍 {mhs.nama_lokasi || 'UP3 / Unit Utama'}
                      </span>
                      {mhs.username && (
                        <span className="text-[10px] font-medium text-slate-400">@{mhs.username}</span>
                      )}
                    </div>

                    {/* Divisi & Kampus */}
                    <p className="text-xs text-slate-600 font-medium mt-1.5">
                      🏢 {mhs.divisi || 'Belum ada divisi'} 
                      {mhs.universitas && <span className="text-slate-400"> • 🎓 {mhs.universitas}</span>}
                    </p>
                  </div>
                </div>

                {/* TENGAH: Periode Magang */}
                <div className="w-full lg:w-3/12 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Periode Magang</p>
                    {sisaInfo && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sisaInfo.color}`}>
                        {sisaInfo.label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-700 mt-1">
                    📅 {formatTgl(mhs.tgl_mulai)} <span className="text-slate-400 font-normal">s/d</span> {formatTgl(mhs.tgl_selesai)}
                  </p>
                </div>

                {/* KANAN: Tombol Aksi */}
                <div className="w-full lg:w-4/12 flex flex-wrap items-center justify-start lg:justify-end gap-2">
                  <button 
                    onClick={() => handleOpenEditPeriode(mhs)}
                    className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/70 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    Edit Tanggal
                  </button>
                  <button 
                    onClick={() => navigate(`/pembimbing/mahasiswa/${mhs.id}`)}
                    className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors"
                  >
                    Timesheet
                  </button>
                  <button 
                    onClick={() => navigate(`/pembimbing/mahasiswa/${mhs.id}`)}
                    className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold rounded-xl transition-colors"
                  >
                    Logbook
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* MODAL EDIT PERIODE MAGANG */}
      {isEditModalOpen && selectedMhs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-black text-slate-800 text-lg">Ubah Periode Magang</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedMhs.nama}</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-rose-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <form onSubmit={handleSavePeriode} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tanggal Mulai Magang</label>
                <input 
                  type="date" 
                  required
                  value={editTglMulai}
                  onChange={(e) => setEditTglMulai(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-blue-600 outline-none bg-slate-50 text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tanggal Berakhir Magang</label>
                <input 
                  type="date" 
                  required
                  min={editTglMulai || undefined}
                  value={editTglSelesai}
                  onChange={(e) => setEditTglSelesai(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-blue-600 outline-none bg-slate-50 text-slate-700"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSavingPeriode}
                  className="flex-1 py-3 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 shadow-md transition-colors disabled:opacity-50"
                >
                  {isSavingPeriode ? 'Menyimpan...' : 'Simpan Tanggal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}