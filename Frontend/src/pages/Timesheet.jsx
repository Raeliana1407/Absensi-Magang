import React, { useState, useEffect } from 'react';
import BottomNav from '../components/layout/BottomNav';

export default function Timesheet() {
  const [riwayat, setRiwayat] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchRiwayat = async () => {
      const userDataString = localStorage.getItem('user');
      if (!userDataString) {
        setLoading(false);
        return;
      }
      
      const user = JSON.parse(userDataString);

      try {
        // PERHATIAN: Pastikan rute ini sesuai dengan backend Anda. 
        // Jika rute backend Anda '/api/absen/riwayat/:user_id', ubah URL di bawah.
        const response = await fetch(`http://localhost:3000/api/riwayat/${user.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const result = await response.json();

        if (response.ok && result.success) {
          setRiwayat(result.data);
        }
      } catch (error) {
        console.error("Gagal mengambil riwayat:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRiwayat();
  }, [token]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Kalkulasi Statistik Otomatis dari Riwayat
  const hitungStatistik = () => {
    return riwayat.reduce((acc, log) => {
      // Kita hitung jumlah hari berdasarkan aksi "masuk" agar tidak dobel dengan jam pulang/istirahat
      if (log.jenis_absen === 'masuk') {
        if (log.status === 'hadir' || log.status === 'terlambat') acc.present++;
        if (log.status === 'terlambat') acc.late++;
      }
      return acc;
    }, { present: 0, late: 0 });
  };

  const stats = hitungStatistik();

  // Fungsi pembantu untuk menentukan gaya berdasarkan status
  const getStatusStyles = (status) => {
    switch (status) {
      case 'hadir':
        return {
          card: 'border-l-emerald-500 bg-white',
          iconBg: 'bg-emerald-100 text-emerald-600',
          badge: 'bg-emerald-500 text-white shadow-emerald-500/30',
          text: 'ON TIME'
        };
      case 'terlambat':
        return {
          card: 'border-l-amber-500 bg-white',
          iconBg: 'bg-amber-100 text-amber-600',
          badge: 'bg-amber-500 text-white shadow-amber-500/30',
          text: 'LATE'
        };
      case 'luar_radius':
        return {
          card: 'border-l-rose-500 bg-rose-50/30',
          iconBg: 'bg-rose-100 text-rose-600',
          badge: 'bg-rose-500 text-white shadow-rose-500/30',
          text: 'OUT OF ZONE'
        };
      default:
        return {
          card: 'border-l-slate-300 bg-white',
          iconBg: 'bg-slate-100 text-slate-600',
          badge: 'bg-slate-500 text-white',
          text: 'UNKNOWN'
        };
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#F8FAFC] pb-28 relative shadow-2xl font-sans text-slate-800">
      
      {/* Header Profile & Summary */}
      <header className="bg-[#1E40AF] pt-10 pb-8 px-5 rounded-b-[32px] shadow-lg shadow-blue-900/10 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-white mb-1">Timesheet</h1>
        <p className="text-sm text-blue-200">Your attendance logs for this month</p>
        
        {/* Quick Stats Dinamis */}
        <div className="flex gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex-1 border border-white/10">
             <p className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Present</p>
             <p className="text-2xl font-extrabold text-white mt-1">
               {stats.present} <span className="text-xs font-normal text-blue-200">days</span>
             </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex-1 border border-white/10">
             <p className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Late</p>
             <p className="text-2xl font-extrabold text-white mt-1">
               {stats.late} <span className="text-xs font-normal text-blue-200">days</span>
             </p>
          </div>
        </div>
      </header>

      <main className="px-5 mt-6">
        
        {loading ? (
          <div className="flex flex-col justify-center items-center py-16 gap-3">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E40AF]"></div>
             <div className="animate-pulse text-xs font-bold text-slate-400 tracking-widest uppercase">Syncing Logs...</div>
          </div>
        ) : riwayat.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-3">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <p className="text-sm text-slate-500 font-bold">No attendance records yet.</p>
            <p className="text-xs text-slate-400 mt-1">Your clock-in history will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-2">Recent Logs</h3>
            
            {riwayat.map((absen) => {
              const styles = getStatusStyles(absen.status);
              
              return (
                <div key={absen.id} className={`rounded-2xl p-4 shadow-sm border border-slate-100 border-l-[6px] flex items-center justify-between hover:shadow-md transition-all ${styles.card}`}>
                  
                  <div className="flex items-center gap-4">
                    {/* Icon Dinamis */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-inner ${styles.iconBg}`}>
                      {absen.jenis_absen === 'masuk' && (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg>
                      )}
                      {absen.jenis_absen === 'pulang' && (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                      )}
                      {absen.jenis_absen === 'istirahat_keluar' && (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      )}
                      {absen.jenis_absen === 'istirahat_masuk' && (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      )}
                    </div>
                    
                    {/* Info Teks Dinamis */}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-slate-800 text-sm capitalize">
                          {absen.jenis_absen === 'masuk' ? 'Clock In' :
                           absen.jenis_absen === 'pulang' ? 'Clock Out' :
                           absen.jenis_absen === 'istirahat_keluar' ? 'Take Break' :
                           absen.jenis_absen === 'istirahat_masuk' ? 'End Break' : 'Log'}
                        </h4>
                      </div>
                      <p className="text-[11px] font-medium text-slate-500 mt-0.5 tracking-wide">{formatDate(absen.waktu_absen)}</p>
                    </div>
                  </div>

                  {/* Time & Status */}
                  <div className="text-right flex flex-col items-end">
                    <span className="text-lg font-black text-[#0B1E46] tracking-tight">{formatTime(absen.waktu_absen)}</span>
                    <span className={`mt-1 px-2.5 py-1 rounded-md text-[9px] font-extrabold tracking-wider shadow-sm ${styles.badge}`}>
                      {styles.text}
                    </span>
                  </div>
                  
                </div>
              );
            })}
          </div>
        )}

      </main>

      <BottomNav />
    </div>
  );
}