import React, { useState, useEffect } from 'react';
import BottomNav from '../components/layout/BottomNav';
import Header from '../components/layout/Header';

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
  const [shiftStart, setShiftStart] = useState('08:00 AM');
  const [shiftEnd, setShiftEnd] = useState('04:30 PM'); 

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
      
      // JURUS 1: Cache-Buster
      const timestamp = new Date().getTime();
      
      // A. Ambil Status Hari Ini
      const resStatus = await fetch(`https://absensi-magang-beta.vercel.app/api/absen/status/${user.id}?t=${timestamp}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache' 
        }
      });
      
      if (resStatus.ok) {
        const resultStatus = await resStatus.json();
        if (resultStatus.success) {
          
          const localPhase = localStorage.getItem('shift_phase');
          const localDate = localStorage.getItem('shift_date');
          const isToday = localDate === new Date().toDateString();

          let finalPhase = resultStatus.shiftPhase;
          if (isToday && localPhase && localPhase !== 'idle' && resultStatus.shiftPhase === 'idle') {
              finalPhase = localPhase; 
          }

          setShiftPhase(finalPhase);
          localStorage.setItem('shift_phase', finalPhase);
          localStorage.setItem('shift_date', new Date().toDateString()); 
          
          setTodayLogs(resultStatus.data || []);
          
          // Tangkap jadwal
          if (resultStatus.jadwal) {
             const formatJadwal = (jamDB) => {
                const [j, m] = jamDB.split(':');
                const dummyDate = new Date();
                dummyDate.setHours(parseInt(j), parseInt(m));
                return dummyDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
             };
             setShiftStart(formatJadwal(resultStatus.jadwal.jam_masuk));
             setShiftEnd(formatJadwal(resultStatus.jadwal.jam_pulang));
          }
        }
      }

      // B. Ambil Riwayat Total
      const resRiwayat = await fetch(`https://absensi-magang-beta.vercel.app/api/riwayat/${user.id}?t=${timestamp}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache' 
        }
      });
      
      if (resRiwayat.ok) {
        const resultRiwayat = await resRiwayat.json();
        if (resultRiwayat.success && resultRiwayat.data) {
          const logsMasuk = resultRiwayat.data.filter(log => log.jenis_absen === 'masuk');
          setKehadiranBulanIni(logsMasuk.length);
        }
      }
    } catch (err) {
      console.error('Gagal mengambil data dashboard:', err);
    }
  };

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
            
            setShiftPhase(nextPhase);
            localStorage.setItem('shift_phase', nextPhase);
            
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

  const getTimelineStyle = (jenis) => {
    if(jenis === 'masuk') return { bg: 'bg-emerald-100', dot: 'bg-emerald-500', title: 'Clocked In', desc: 'On-Site Location', textStatus: 'On Time', textColor: 'text-emerald-600 bg-emerald-50' };
    if(jenis === 'pulang') return { bg: 'bg-rose-100', dot: 'bg-rose-500', title: 'Clocked Out', desc: 'Shift Completed', textStatus: 'Done', textColor: 'text-rose-600 bg-rose-50' };
    return { bg: 'bg-slate-100', dot: 'bg-slate-500', title: 'Log', desc: 'System', textStatus: 'Logged', textColor: 'text-slate-600 bg-slate-50' };
  };

  const formatTime = (dateString) => {
    const witaTime = new Date(`${dateString}+08:00`);
    return witaTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#F8FAFC] pb-24 relative shadow-2xl font-sans text-slate-800">
      
      {/* Header */}
      <Header pageTitle="Attendance Home" />

      <main className="px-5 mt-6">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Hi, {namaDepan}! 👋</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">{todayFormatted}</p>
          <div className="inline-flex items-center gap-2 mt-4 bg-blue-50/80 border border-blue-100 text-blue-700 px-4 py-2 rounded-full text-xs font-bold shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Standard Shift <span className="text-blue-300">•</span> {shiftStart} - {shiftEnd}
          </div>
        </div>

        {/* Clock & Actions */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center mb-6">
          <div className="text-[3.25rem] leading-none font-black text-[#0B1E46] tracking-tighter">
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
            <span className="text-xl text-blue-600 ml-1.5 font-bold tracking-normal">WITA</span>
          </div>
          <p className="text-xs font-bold mt-3 text-slate-400 flex justify-center items-center gap-1.5">
             <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> {statusMessage}
          </p>
          
          {/* TOMBOL ABSEN YANG SUDAH DITUMPUK (STACKING) */}
          <div className="flex flex-col gap-3 mt-6">
              {/* Tombol Clock In (Biru) */}
              <button 
                onClick={() => handleAbsen('masuk', 'working')} 
                disabled={isClockingIn} 
                className="w-full bg-[#1E40AF] text-white font-bold py-4 rounded-2xl text-base shadow-lg shadow-blue-900/20 hover:bg-blue-800 active:scale-[0.98] transition-all flex justify-center items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg>
                {isClockingIn ? 'Processing...' : 'Clock In'}
              </button>

              {/* Tombol Clock Out (Merah) */}
              <button 
                onClick={() => handleAbsen('pulang', 'completed')} 
                disabled={isClockingIn} 
                className="w-full bg-rose-600 text-white font-bold py-4 rounded-2xl text-base shadow-lg shadow-rose-600/20 hover:bg-rose-700 active:scale-[0.98] transition-all flex justify-center items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                Clock Out
              </button>
          </div>
        </div>

        {/* Total Logged Time Card */}
        <div className="bg-gradient-to-br from-[#1E40AF] to-blue-800 text-white p-6 rounded-3xl shadow-xl shadow-blue-900/20 mb-6 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-10 -translate-y-10"></div>
           <div className="flex justify-between items-start mb-2 relative z-10">
              <span className="text-[10px] font-black text-blue-200 tracking-widest uppercase">This Month</span>
              <div className="bg-emerald-400 text-emerald-950 text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-sm">
                 Active
              </div>
           </div>
           
           <div className="flex items-baseline gap-2 mb-5 mt-3 relative z-10">
              <h2 className="text-5xl font-black tracking-tighter">{kehadiranBulanIni}</h2>
              <span className="text-sm text-blue-200 font-bold uppercase tracking-wider">Days</span>
           </div>

           <div className="grid grid-cols-2 gap-3 mt-4 relative z-10">
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                 <p className="text-[10px] font-bold text-blue-200 mb-1 uppercase tracking-wider">Today's Logs</p>
                 <p className="text-lg font-black">{todayLogs.length} Actions</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                 <p className="text-[10px] font-bold text-blue-200 mb-1 uppercase tracking-wider">Shift Status</p>
                 <p className="text-lg font-black capitalize">{shiftPhase}</p>
              </div>
           </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}