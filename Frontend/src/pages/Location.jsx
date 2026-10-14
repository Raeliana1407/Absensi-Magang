import React, { useState, useEffect } from 'react';
import BottomNav from '../components/layout/BottomNav';

export default function Location() {
  const [coords, setCoords] = useState({ latitude: 0, longitude: 0, accuracy: 0 });
  const [isLocating, setIsLocating] = useState(true);
  const [distance, setDistance] = useState(null);

  // Data Kantor Pusat (Sesuai dengan backend absenController)
  const OFFICE = {
    latitude: -4.010396,
    longitude: 119.623447,
    radius: 150 // dalam meter
  };

  const userDataString = localStorage.getItem('user');
  const user = userDataString ? JSON.parse(userDataString) : { nama: 'User' };
  const namaDepan = user.nama.split(' ')[0];

  // Rumus Haversine untuk menghitung jarak 2 titik koordinat (dalam meter)
  const hitungJarak = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Radius bumi dalam meter
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  const fetchLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLon = position.coords.longitude;
          const userAcc = Math.round(position.coords.accuracy);
          
          setCoords({
            latitude: userLat.toFixed(5),
            longitude: userLon.toFixed(5),
            accuracy: userAcc
          });

          // Hitung jarak ke kantor
          const jarakKeKantor = hitungJarak(userLat, userLon, OFFICE.latitude, OFFICE.longitude);
          setDistance(jarakKeKantor);
          
          setIsLocating(false);
        },
        (error) => {
          console.error("GPS Error:", error);
          alert("Gagal mengambil lokasi GPS. Pastikan izin lokasi aktif.");
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      alert("Browser Anda tidak mendukung Geolocation.");
      setIsLocating(false);
    }
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  // Variabel penentu status Geofence
  const inZone = distance !== null && distance <= OFFICE.radius;
  
  // URL untuk OpenStreetMap Iframe dinamis
  // Membuat "Bounding Box" agar map zoom in ke titik user
  const bbox = `${parseFloat(coords.longitude) - 0.005},${parseFloat(coords.latitude) - 0.005},${parseFloat(coords.longitude) + 0.005},${parseFloat(coords.latitude) + 0.005}`;
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${coords.latitude},${coords.longitude}`;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#F8FAFC] pb-28 relative shadow-2xl font-sans text-slate-800">
      
      {/* --- Top Header --- */}
      <header className="flex items-center justify-between p-5 bg-white shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 text-white p-1.5 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <div>
            <h1 className="text-xs font-bold text-blue-600 tracking-wider">CLOCKSYNC</h1>
            <h2 className="text-sm font-semibold">Location Hub</h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Live
          </div>
          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm border-2 border-white shadow-sm">
            {namaDepan.charAt(0)}
          </div>
        </div>
      </header>

      <main className="px-5 mt-5">
        
        {/* --- Location Header Dinamis --- */}
        <div className="flex justify-between items-end mb-4">
          <div>
             <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide mb-2 ${isLocating ? 'bg-slate-100 text-slate-500' : inZone ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isLocating ? 'bg-slate-400' : inZone ? 'bg-emerald-500' : 'bg-rose-500'}`}></span> 
                {isLocating ? 'LOCATING...' : inZone ? 'INSIDE AUTHORIZED ZONE' : 'OUTSIDE AUTHORIZED ZONE'}
             </div>
             <h2 className="text-xl font-black text-[#0B1E46] tracking-tight">HQ Tech Park · Parepare</h2>
             <p className="text-xs text-slate-500 mt-0.5">Sistem Informasi Absensi Magang</p>
          </div>
          <div className="text-right">
             <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 justify-end mb-1">
                <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                Strict Geofence
             </div>
             <p className="text-sm font-black text-blue-600">±{isLocating ? '...' : coords.accuracy}m ACCURACY</p>
          </div>
        </div>

        {/* --- Map Radar (Sekarang Menampilkan Peta Asli) --- */}
        <div className="w-full h-56 rounded-3xl relative overflow-hidden mb-4 shadow-sm border border-slate-200 flex items-center justify-center bg-slate-100">
           {isLocating || coords.latitude === 0 ? (
              <div className="animate-pulse flex flex-col items-center">
                 <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                 <span className="text-xs font-bold text-slate-400">Menyinkronkan Satelit...</span>
              </div>
           ) : (
              <iframe 
                width="100%" 
                height="100%" 
                frameBorder="0" 
                scrolling="no" 
                src={mapSrc}
                title="Peta Lokasi Magang"
                className="opacity-90 grayscale-[20%] contrast-125" // Filter agar map terlihat menyatu dgn UI
              ></iframe>
           )}
           
           {/* Badge Overlay */}
           {!isLocating && coords.latitude !== 0 && (
             <>
               <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-slate-800 text-[10px] font-bold px-2.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-md border border-slate-100">
                  <span className={`w-2 h-2 ${inZone ? 'bg-emerald-500' : 'bg-rose-500'} rounded-full animate-pulse`}></span>
                  Jarak: {distance} meter
               </div>
               <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm border border-slate-100">
                  <div className="w-3 h-3 border-[3px] border-blue-600 rounded-full"></div>
                  <span className="text-[10px] font-bold text-slate-700">Radius Valid: 150m</span>
               </div>
             </>
           )}
        </div>

        {/* --- Coordinates Info (Dinamis GPS Asli) --- */}
        <div className="grid grid-cols-2 gap-2 mb-8">
           <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Latitude</p>
              <p className="text-sm font-black text-slate-700">{isLocating ? '...' : coords.latitude}°</p>
           </div>
           <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Longitude</p>
              <p className="text-sm font-black text-slate-700">{isLocating ? '...' : coords.longitude}°</p>
           </div>
        </div>

        {/* --- Assigned Work Hubs (Dinamis Jarak) --- */}
        <div className="mb-6">
           <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-[#0B1E46]">Assigned Workspace</h3>
              <span className="text-[10px] font-bold text-blue-600">Geofence Aktif</span>
           </div>
           
           <div className="bg-white border-2 border-blue-100 p-4 rounded-3xl shadow-sm relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1.5 h-full ${inZone ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
              <div className="flex justify-between items-start mb-3 pl-1">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#1E3A8A] text-white rounded-xl flex items-center justify-center">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                    </div>
                    <div>
                       <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          Kantor PLN UP3(persero) parepare
                       </h4>
                       <p className="text-[10px] text-slate-500 mt-0.5">Lokasi Utama Absensi Magang</p>
                    </div>
                 </div>
              </div>
              <div className="flex justify-between items-center text-[10px] border-t border-slate-50 pt-3 pl-1">
                 <span className="text-slate-500 font-medium">Batas Maksimal: {OFFICE.radius} Meter</span>
                 <span className={`font-black px-2 py-1 rounded-lg ${inZone ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    Jarak Anda: {isLocating ? 'Menghitung...' : `${distance} Meter`}
                 </span>
              </div>
           </div>
        </div>

        {/* --- Buttons --- */}
        <div className="space-y-3 mb-6">
           <button 
             onClick={fetchLocation} 
             disabled={isLocating}
             className="w-full bg-[#1E3A8A] text-white font-bold py-3.5 rounded-2xl text-sm flex justify-center items-center gap-2 shadow-lg shadow-blue-900/20 active:scale-95 transition-all"
           >
              <svg className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              {isLocating ? 'Mencari Lokasi...' : 'Refresh GPS & Radar'}
           </button>
           <button className="w-full bg-white text-blue-600 font-bold py-3.5 rounded-2xl text-sm flex justify-center items-center gap-2 border-2 border-blue-100 active:bg-blue-50 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              Request Remote Location
           </button>
        </div>

      </main>
      <BottomNav />
    </div>
  );
}