import React, { useState, useEffect } from 'react';
import BottomNav from '../components/layout/BottomNav';

export default function Home() {
  const [isClockingIn, setIsClockingIn] = useState(false);
  const [accuracy, setAccuracy] = useState(4);
  const [statusMessage, setStatusMessage] = useState('GPS synchronized • Ready to check in');
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Auto-Reset: Mengecek apakah hari ini sama dengan hari terakhir absen
  const [shiftPhase, setShiftPhase] = useState(() => {
    const savedDate = localStorage.getItem('shift_date');
    const todayDate = new Date().toDateString(); 
    
    // Jika tanggal di memori berbeda dengan hari ini, reset ke mode awal
    if (savedDate !== todayDate) {
      localStorage.removeItem('shift_phase');
      return 'idle'; 
    }
    return localStorage.getItem('shift_phase') || 'idle';
  });

  const [todayLogs, setTodayLogs] = useState([]); 
  const [kehadiranBulanIni, setKehadiranBulanIni] = useState(0); 

  const userDataString = localStorage.getItem('user');
  const user = userDataString ? JSON.parse(userDataString) : { id: 1, nama: 'User' };
  const namaDepan = user.nama.split(' ')[0];

  const todayFormatted = currentTime.toLocaleDateString('en-US', { 
    weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' 
  });

  // 1. Timer Jam Berjalan
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Fungsi Mengambil Data Hari Ini & Riwayat
  const fetchDataDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // A. Ambil Status Hari Ini (Untuk Tombol Shift & Timeline Hari Ini)
      const resStatus = await fetch(`https://absensi-magang-beta.vercel.app/api/absen/status/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (resStatus.ok) {
        const resultStatus = await resStatus.json();
        if (resultStatus.success) {
          setShiftPhase(resultStatus.shiftPhase);
          localStorage.setItem('shift_phase', resultStatus.shiftPhase);
          localStorage.setItem('shift_date', new Date().toDateString()); // Simpan tanggal hari ini
          setTodayLogs(resultStatus.data || []);
        }
      }

      // B. Ambil Riwayat Total (Untuk Angka "Days Present" di Kartu Biru)
      const resRiwayat = await fetch(`https://absensi-magang-beta.vercel.app/api/riwayat/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (resRiwayat.ok) {
        const resultRiwayat = await resRiwayat.json();
        if (resultRiwayat.success && resultRiwayat.data) {
          // Logika: Kita hanya menghitung absen yang berjenis 'masuk'
          // Agar 1 hari yang punya banyak aktivitas tetap dihitung 1 Hari Hadir
          const logsMasuk = resultRiwayat.data.filter(log => log.jenis_absen === 'masuk');
          setKehadiranBulanIni(logsMasuk.length);
        }
      }

    } catch (err) {
      console.error('Gagal mengambil data dashboard:', err);
    }
  };

  // Panggil fetch data saat halaman dimuat pertama kali
  useEffect(() => {
    if (user && user.id) {
      fetchDataDashboard();
    }
  }, [user.id]);
  
  // 3. Fungsi Eksekusi Absen
  const handleAbsen = async (jenis_absen, nextPhase) => {
    setIsClockingIn(true);
    setStatusMessage(`Memverifikasi lokasi GPS...`);
    setIsSuccess(false);

    if (!navigator.geolocation) {
      setStatusMessage('Error: GPS tidak didukung.');
      setIsClockingIn(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = position.coords;
        setAccuracy(Math.round(coords.accuracy));
        setStatusMessage(`Akurasi ${Math.round(coords.accuracy)}m. Mengirim...`);

        try {
          const token = localStorage.getItem('token');
          const response = await fetch('https://absensi-magang-beta.vercel.app/api/absen', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              user_id: user.id,
              jenis_absen: jenis_absen, 
              latitude: coords.latitude,
              longitude: coords.longitude
            })
          });

          const result = await response.json();
          if (response.ok && result.success) {
            setStatusMessage(result.message);
            setIsSuccess(true);
            
            // Perbarui Data Timeline Seketika Tanpa Reload
            await fetchDataDashboard(); 
            
          } else {
            setStatusMessage(result.message || 'Gagal melakukan absen.');
            setIsSuccess(false);
          }
        } catch (err) {
          setStatusMessage('Gagal terhubung ke server backend.');
          setIsSuccess(false);
        } finally {
          setIsClockingIn(false);
        }
      },
      (error) => {
        setStatusMessage('Gagal: Izin lokasi ditolak.');
        setIsClockingIn(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Helper untuk Desain Timeline (Warna & Icon sesuai jenis absen)
  const getTimelineStyle = (jenis) => {
    if(jenis === 'masuk') return { bg: 'bg-emerald-100', dot: 'bg-emerald-500', title: 'Clocked In', desc: 'On-Site Location', textStatus: 'On Time', textColor: 'text-emerald-600 bg-emerald-50' };
    if(jenis === 'istirahat_keluar') return { bg: 'bg-amber-100', dot: 'bg-amber-500', title: 'Break Out', desc: 'Meal/Rest Time', textStatus: 'Started', textColor: 'text-amber-600 bg-amber-50' };
    if(jenis === 'istirahat_masuk') return { bg: 'bg-indigo-100', dot: 'bg-indigo-500', title: 'Break In', desc: 'Back to Work', textStatus: 'Ended', textColor: 'text-indigo-600 bg-indigo-50' };
    if(jenis === 'pulang') return { bg: 'bg-rose-100', dot: 'bg-rose-500', title: 'Clocked Out', desc: 'Shift Completed', textStatus: 'Done', textColor: 'text-rose-600 bg-rose-50' };
    return { bg: 'bg-slate-100', dot: 'bg-slate-500', title: 'Log', desc: 'System', textStatus: 'Logged', textColor: 'text-slate-600 bg-slate-50' };
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#F8FAFC] pb-24 relative shadow-2xl font-sans text-slate-800">
      
      {/* Header */}
      <header className="flex items-center justify-between p-5 bg-white">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 text-white p-1.5 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <div>
            <h1 className="text-xs font-bold text-blue-600 tracking-wider">CLOCKSYNC</h1>
            <h2 className="text-sm font-semibold">Attendance Home</h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Live
          </div>
          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm overflow-hidden border-2 border-white shadow-sm">
            {namaDepan.charAt(0)}
          </div>
        </div>
      </header>

      <main className="px-5 mt-2">
        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Good morning, {namaDepan} 👋</h1>
          <p className="text-sm text-slate-500 mt-1">{todayFormatted}</p>
          <div className="inline-flex items-center gap-2 mt-3 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-semibold">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Standard Shift <span className="text-blue-300">•</span> 09:00 AM - 05:00 PM
          </div>
        </div>

        {/* Map Card */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6">
          <div className="w-full h-24 bg-blue-50 rounded-xl mb-3 relative overflow-hidden flex items-center justify-center border border-blue-100">
            <div className="absolute top-2 right-2 bg-white/80 backdrop-blur text-[10px] px-2 py-1 rounded-md text-slate-600 font-bold flex items-center gap-1 shadow-sm">
              ⌖ ±{accuracy}m accuracy
            </div>
            <div className="relative text-emerald-600">
              <svg className="w-8 h-8 drop-shadow-md" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">HQ Tech Park</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Office Geofence Zone</p>
            </div>
            <div className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> In Zone
            </div>
          </div>
        </div>

        {/* Clock & Action */}
        <div className="text-center mb-6">
          <div className="text-5xl font-extrabold text-[#0B1E46] tracking-tight">
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
            <span className="text-xl text-blue-600 ml-1">WITA</span>
          </div>
          <p className="text-xs font-semibold mt-2 text-slate-500 flex justify-center items-center gap-1">
             <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span> {statusMessage}
          </p>
          
          {shiftPhase === 'idle' && (
            <button onClick={() => handleAbsen('masuk', 'working')} disabled={isClockingIn} className="w-full mt-4 bg-[#1E3A8A] text-white font-bold py-3.5 rounded-full text-lg shadow-lg shadow-blue-900/20 active:scale-95 transition-all flex justify-center items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"></path></svg>
              {isClockingIn ? 'Processing...' : 'Clock In'}
            </button>
          )}

          {shiftPhase === 'working' && (
            <div className="flex gap-3 mt-4">
              <button onClick={() => handleAbsen('istirahat_keluar', 'break')} disabled={isClockingIn} className="w-1/2 bg-amber-500 text-white font-bold py-3.5 rounded-full text-sm shadow-md shadow-amber-500/20 active:scale-95 transition-all">
                ☕ Take Break
              </button>
              <button onClick={() => handleAbsen('pulang', 'completed')} disabled={isClockingIn} className="w-1/2 bg-rose-600 text-white font-bold py-3.5 rounded-full text-sm shadow-md shadow-rose-600/20 active:scale-95 transition-all">
                👋 Clock Out
              </button>
            </div>
          )}

          {shiftPhase === 'break' && (
            <button onClick={() => handleAbsen('istirahat_masuk', 'working')} disabled={isClockingIn} className="w-full mt-4 bg-emerald-500 text-white font-bold py-3.5 rounded-full text-lg shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex justify-center items-center gap-2">
              {isClockingIn ? 'Processing...' : 'End Break & Work'}
            </button>
          )}

          {shiftPhase === 'completed' && (
            <div className="w-full mt-4 bg-slate-100 text-slate-500 font-bold py-3.5 rounded-full text-sm border-2 border-slate-200 border-dashed flex justify-center items-center">
              ✓ Shift Completed for Today
            </div>
          )}
        </div>

        {/* Total Logged Time Card - Sekarang Dinamis untuk Days Present */}
        <div className="bg-[#1E40AF] text-white p-5 rounded-3xl shadow-lg shadow-blue-900/20 mb-6">
           <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-blue-200 tracking-wider">THIS MONTH</span>
              <div className="bg-[#6EE7B7] text-[#064E3B] text-[10px] font-bold px-2 py-1 rounded-full">
                 Active
              </div>
           </div>
           
           {/* Menampilkan total hari hadir bulan ini (diambil dari API Riwayat) */}
           <div className="flex items-baseline gap-2 mb-4 mt-2">
              <h2 className="text-4xl font-extrabold tracking-tight">{kehadiranBulanIni} Days</h2>
              <span className="text-xs text-blue-200 font-medium">Logged Present</span>
           </div>

           <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-[#1E3A8A] p-3 rounded-xl">
                 <p className="text-[10px] text-blue-200 mb-0.5">Today's Logs</p>
                 <p className="text-sm font-bold">{todayLogs.length} Actions</p>
              </div>
              <div className="bg-[#1E3A8A] p-3 rounded-xl">
                 <p className="text-[10px] text-blue-200 mb-0.5">Shift Status</p>
                 <p className="text-sm font-bold capitalize">{shiftPhase}</p>
              </div>
           </div>
        </div>

        {/* Today's Activity Timeline (SEKARANG 100% DINAMIS) */}
        <div>
           <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 Today's Activity 
                 {todayLogs.length > 0 && (
                   <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                     {todayLogs.length} logs
                   </span>
                 )}
              </h3>
              <a href="/timesheet" className="text-xs font-bold text-blue-600">View Full &gt;</a>
           </div>

           <div className="relative pl-4 border-l-2 border-slate-100 space-y-6">
              
              {todayLogs.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium pb-4">No activity recorded yet for today.</p>
              ) : (
                todayLogs.map((log) => {
                  const style = getTimelineStyle(log.jenis_absen);
                  return (
                    <div key={log.id} className="relative">
                       <div className={`absolute -left-[21px] top-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${style.bg}`}>
                          <div className={`w-2 h-2 rounded-full ${style.dot}`}></div>
                       </div>
                       <div className="flex justify-between items-start">
                          <div>
                             <h4 className="text-sm font-bold text-slate-800">{style.title}</h4>
                             <p className="text-[10px] text-slate-500 mt-0.5">{style.desc}</p>
                          </div>
                          <div className="text-right">
                             <span className="text-xs font-bold text-slate-800">{formatTime(log.waktu_absen)}</span>
                             <p className={`text-[10px] font-bold px-1.5 rounded mt-0.5 ${style.textColor}`}>
                               {style.textStatus}
                             </p>
                          </div>
                       </div>
                    </div>
                  );
                })
              )}

              {/* Tampilkan Estimasi Pulang jika shift belum selesai */}
              {shiftPhase !== 'completed' && (
                <div className="relative opacity-50 pt-2">
                   <div className="absolute -left-[21px] top-3 w-4 h-4 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center"></div>
                   <div className="flex justify-between items-start">
                      <div>
                         <h4 className="text-sm font-bold text-slate-800">Est. Clock Out</h4>
                         <p className="text-[10px] text-slate-500 mt-0.5">Scheduled end of shift</p>
                      </div>
                      <div className="text-right">
                         <span className="text-xs font-bold text-slate-400">05:00 PM</span>
                         <p className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 rounded mt-0.5">Pending</p>
                      </div>
                   </div>
                </div>
              )}

           </div>
        </div>

      </main>
      <BottomNav />
    </div>
  );
}