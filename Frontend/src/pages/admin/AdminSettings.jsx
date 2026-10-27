import React, { useState, useEffect } from 'react';

export default function AdminSettings() {
  const [locations, setLocations] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [isNew, setIsNew] = useState(false);

  const [namaLokasi, setNamaLokasi] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [radius, setRadius] = useState('');
  const [jamMasuk, setJamMasuk] = useState('');
  const [jamPulang, setJamPulang] = useState('');
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');

  // 1. Ambil semua data lokasi saat halaman dimuat
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://absensi-magang-beta.vercel.app/api/admin/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (result.success && result.data.length > 0) {
        setLocations(result.data);
        
        // Set default ke lokasi pertama jika tidak sedang membuat baru
        if (!isNew && !selectedId) {
          populateForm(result.data[0]);
          setSelectedId(result.data[0].id.toString());
        } else if (!isNew && selectedId) {
          const current = result.data.find(l => l.id.toString() === selectedId);
          if (current) populateForm(current);
        }
      }
    } catch (error) {
      console.error("Gagal mengambil settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [token]);

  // Fungsi untuk mengisi form
  const populateForm = (data) => {
    setNamaLokasi(data.nama_lokasi || 'Kantor Pusat');
    setLat(data.latitude);
    setLng(data.longitude);
    setRadius(data.radius);
    setJamMasuk(data.jam_masuk.substring(0, 5));
    setJamPulang(data.jam_pulang.substring(0, 5));
  };

  // Kosongkan form untuk lokasi baru
  const resetFormNew = () => {
    setNamaLokasi('');
    setLat('');
    setLng('');
    setRadius('150');
    setJamMasuk('08:00');
    setJamPulang('16:30');
  };

  // Handle perubahan dropdown
  const handleSelectChange = (e) => {
    const val = e.target.value;
    setSelectedId(val);
    
    if (val === 'new') {
      setIsNew(true);
      resetFormNew();
    } else {
      setIsNew(false);
      const loc = locations.find(l => l.id.toString() === val);
      if (loc) populateForm(loc);
    }
  };

  // 2. Fungsi simpan pengaturan (Bisa POST baru atau PUT update)
  const handleSimpan = async (e) => {
    e.preventDefault(); 
    
    const url = isNew 
      ? 'https://absensi-magang-beta.vercel.app/api/admin/settings' 
      : `https://absensi-magang-beta.vercel.app/api/admin/settings/${selectedId}`;
    
    const method = isNew ? 'POST' : 'PUT';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nama_lokasi: namaLokasi,
          latitude: lat,
          longitude: lng,
          radius: radius,
          jam_masuk: jamMasuk,
          jam_pulang: jamPulang
        })
      });
      
      const result = await response.json();
      if (result.success) {
        alert(result.message);
        setIsNew(false);
        if (isNew) {
           setSelectedId(result.newId.toString()); // Auto pilih yang baru dibuat
        }
        fetchSettings(); // Refresh data
      } else {
        alert("Gagal: " + result.message);
      }
    } catch (error) {
      console.error("Gagal menyimpan:", error);
      alert('Terjadi kesalahan server saat menyimpan.');
    }
  };

  // 3. Fungsi Hapus Lokasi
  const handleHapus = async () => {
    if (locations.length <= 1) {
      alert("Minimal harus ada 1 titik lokasi, tidak bisa dihapus semua!");
      return;
    }
    const konfirmasi = window.confirm(`Yakin ingin menghapus titik lokasi "${namaLokasi}"?`);
    if (!konfirmasi) return;

    try {
      const response = await fetch(`https://absensi-magang-beta.vercel.app/api/admin/settings/${selectedId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const result = await response.json();
      if (result.success) {
        alert(result.message);
        setSelectedId('');
        setIsNew(false);
        fetchSettings();
      } else {
        alert("Gagal menghapus: " + result.message);
      }
    } catch (error) {
      console.error("Gagal menghapus:", error);
    }
  };

  if (loading && locations.length === 0) {
    return <div className="text-center py-20 text-slate-500 font-bold">Memuat konfigurasi sistem...</div>;
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      
      {/* HEADER & DROPDOWN LOKASI */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold text-slate-800 tracking-widest uppercase bg-slate-100 px-3 py-1 rounded-full">Konfigurasi Sistem</span>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-2">Sistem & Geofence</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">Atur titik koordinat validasi absen dan parameter jam operasional.</p>
        </div>

        <div className="w-full md:w-auto flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Pilih Titik Lokasi</label>
          <select 
            value={selectedId} 
            onChange={handleSelectChange}
            className="w-full md:w-64 bg-slate-50 border border-slate-200 text-slate-700 px-4 py-3 rounded-xl text-sm font-bold outline-none cursor-pointer focus:border-blue-600 transition-colors"
          >
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.nama_lokasi || `Lokasi ID: ${loc.id}`}</option>
            ))}
            <option value="new" className="font-bold text-blue-600">➕ Tambah Titik Baru...</option>
          </select>
        </div>
      </div>

      <form onSubmit={handleSimpan} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CARD 1: PENGATURAN GEOFENCE */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative">
          
          {isNew && <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-bl-xl rounded-tr-3xl uppercase tracking-widest">Mode Buat Baru</div>}

          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            </div>
            <div>
              <h3 className="font-black text-slate-800">Area Geofence</h3>
              <p className="text-[11px] text-slate-500">Pusat titik presensi & radius</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Tempat / Lokasi</label>
              <input type="text" required placeholder="Contoh: Kantor Cabang Parepare" value={namaLokasi} onChange={(e) => setNamaLokasi(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 outline-none bg-slate-50 font-bold text-slate-800" />
            </div>
            <div className="grid grid-cols-2 gap-3">
               <div>
                 <label className="block text-xs font-bold text-slate-700 mb-1">Latitude</label>
                 <input type="text" required value={lat} onChange={(e) => setLat(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 outline-none bg-slate-50" />
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-700 mb-1">Longitude</label>
                 <input type="text" required value={lng} onChange={(e) => setLng(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 outline-none bg-slate-50" />
               </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Radius Toleransi (Meter)</label>
              <input type="number" required value={radius} onChange={(e) => setRadius(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 outline-none bg-slate-50" />
            </div>
          </div>
        </div>

        {/* CARD 2: PENGATURAN JAM KERJA */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div>
              <h3 className="font-black text-slate-800">Waktu Operasional Shift</h3>
              <p className="text-[11px] text-slate-500">Standar jam masuk & pulang</p>
            </div>
          </div>

          <div className="space-y-4 flex-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Batas Jam Masuk (Clock In)</label>
              <input type="time" required value={jamMasuk} onChange={(e) => setJamMasuk(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-emerald-600 outline-none bg-slate-50" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Batas Jam Pulang (Clock Out)</label>
              <input type="time" required value={jamPulang} onChange={(e) => setJamPulang(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-emerald-600 outline-none bg-slate-50" />
            </div>
          </div>
          
          <div className="mt-6 space-y-3">
             <button type="submit" className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-black rounded-xl transition-colors shadow-md flex items-center justify-center gap-2">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
               {isNew ? 'SIMPAN LOKASI BARU' : 'SIMPAN PERUBAHAN'}
             </button>

             {!isNew && (
                <button type="button" onClick={handleHapus} className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 text-xs font-bold rounded-xl transition-colors">
                  Hapus Titik Lokasi Ini
                </button>
             )}
          </div>
        </div>

      </form>
      <div className="h-10 md:hidden"></div>
    </div>
  );
}