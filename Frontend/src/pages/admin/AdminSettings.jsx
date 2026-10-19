import React, { useState, useEffect } from 'react';

export default function AdminSettings() {
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [radius, setRadius] = useState('');
  const [jamMasuk, setJamMasuk] = useState('');
  const [jamPulang, setJamPulang] = useState('');
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');

  // 1. Ambil data saat halaman dimuat
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('https://absensi-magang-beta.vercel.app/api/admin/settings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        
        if (result.success && result.data) {
          setLat(result.data.latitude);
          setLng(result.data.longitude);
          setRadius(result.data.radius);
          // Potong format waktu dari "09:00:00" jadi "09:00" agar cocok di input type="time"
          setJamMasuk(result.data.jam_masuk.substring(0, 5));
          setJamPulang(result.data.jam_pulang.substring(0, 5));
        }
      } catch (error) {
        console.error("Gagal mengambil settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [token]);

  // 2. Fungsi simpan pengaturan
  const handleSimpan = async (e) => {
    e.preventDefault(); // Mencegah reload halaman
    
    try {
      const response = await fetch('https://absensi-magang-beta.vercel.app/api/admin/settings', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
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
      } else {
        alert("Gagal: " + result.message);
      }
    } catch (error) {
      console.error("Gagal menyimpan:", error);
      alert('Terjadi kesalahan server saat menyimpan.');
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-500 font-bold">Memuat konfigurasi sistem...</div>;
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      
      {/* HEADER */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <span className="text-[10px] font-bold text-slate-800 tracking-widest uppercase bg-slate-100 px-3 py-1 rounded-full">Konfigurasi Sistem</span>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-2">Sistem & Geofence</h1>
        <p className="text-xs md:text-sm text-slate-500 mt-0.5">Atur titik koordinat validasi absen dan parameter jam operasional.</p>
      </div>

      <form onSubmit={handleSimpan} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CARD 1: PENGATURAN GEOFENCE */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            </div>
            <div>
              <h3 className="font-black text-slate-800">Area Geofence Kantor</h3>
              <p className="text-[11px] text-slate-500">Pusat titik presensi mahasiswa</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Latitude (Garis Lintang)</label>
              <input type="text" required value={lat} onChange={(e) => setLat(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 outline-none bg-slate-50" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Longitude (Garis Bujur)</label>
              <input type="text" required value={lng} onChange={(e) => setLng(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 outline-none bg-slate-50" />
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
              <p className="text-[11px] text-slate-500">Standar jam masuk & pulang magang</p>
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
          
          <button type="submit" className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-black rounded-xl transition-colors shadow-md mt-6">
            SIMPAN SEMUA PERUBAHAN
          </button>
        </div>

      </form>
      <div className="h-10 md:hidden"></div>
    </div>
  );
}