import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // PERBAIKAN: Import autoTable secara eksplisit
import * as XLSX from 'xlsx'; // IMPORT BARU: Untuk fitur Spreadsheet

export default function Laporan() {
  const [rekap, setRekap] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const d = new Date();
  const [bulan, setBulan] = useState(d.getMonth() + 1);
  const [tahun, setTahun] = useState(d.getFullYear());

  const user = JSON.parse(localStorage.getItem('user')) || {};

  useEffect(() => {
    const fetchLaporan = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`https://absensi-magang-beta.vercel.app/api/laporan/rekap/${user.id}?bulan=${bulan}&tahun=${tahun}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        
        if (result.success) {
          setRekap(result.data);
        }
      } catch (error) {
        console.error("Gagal mengambil laporan:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user.id) fetchLaporan();
  }, [bulan, tahun, user.id]);

  // ==========================================
  // FITUR 1: EXPORT KE PDF (BUG FIXED)
  // ==========================================
  const handleExportPDF = () => {
    if (!rekap || rekap.length === 0) {
      alert("Tidak ada data untuk diekspor!");
      return;
    }

    try {
      const doc = new jsPDF();
      const namaBulan = new Date(tahun, bulan - 1).toLocaleString('id-ID', { month: 'long' });

      doc.setFontSize(16);
      doc.text('Laporan Rekapitulasi Presensi Magang', 14, 20);
      doc.setFontSize(11);
      doc.text(`Supervisor: ${user.nama || 'Pembimbing'}`, 14, 28);
      doc.text(`Periode: ${namaBulan} ${tahun}`, 14, 34);

      const tableColumn = ["No", "NIM", "Nama Mahasiswa", "Hadir", "Tepat", "Telat", "Izin", "Total Jam", "Nilai"];
      const tableRows = [];

      rekap.forEach((item, index) => {
        const rowData = [
          index + 1,
          item.nim || '-',
          item.name || '-',
          `${item.persentase || 0}%`,
          item.tepat || 0,
          item.telat || 0,
          item.izin || 0,
          `${item.jam || 0} Jam`,
          item.nilai || '-'
        ];
        tableRows.push(rowData);
      });

      // PERBAIKAN: Gunakan fungsi autoTable langsung, bukan doc.autoTable
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [30, 64, 175], textColor: 255 } 
      });

      doc.save(`Laporan_Presensi_${namaBulan}_${tahun}.pdf`);
    } catch (err) {
      console.error("Gagal men-generate PDF:", err);
      alert("Terjadi kesalahan saat mencetak PDF. Cek console browser.");
    }
  };

  // ==========================================
  // FITUR 2: EXPORT KE SPREADSHEET (EXCEL)
  // ==========================================
  const handleExportExcel = () => {
    if (!rekap || rekap.length === 0) {
      alert("Tidak ada data untuk diekspor!");
      return;
    }

    try {
      const namaBulan = new Date(tahun, bulan - 1).toLocaleString('id-ID', { month: 'long' });
      
      // 1. Format ulang data JSON agar sesuai dengan kolom Excel
      const dataExcel = rekap.map((item, index) => ({
        "No": index + 1,
        "NIM": item.nim || '-',
        "Nama Lengkap": item.name || '-',
        "Kehadiran (%)": item.persentase || 0,
        "Hadir (Hari)": item.hadir || '0/22',
        "Tepat Waktu": item.tepat || 0,
        "Terlambat": item.telat || 0,
        "Izin / Sakit": item.izin || 0,
        "Total Jam Kerja": item.jam || 0,
        "Nilai Evaluasi": item.nilai || '-',
        "Status Validasi": item.status || '-'
      }));

      // 2. Buat Worksheet baru dari data JSON
      const worksheet = XLSX.utils.json_to_sheet(dataExcel);
      
      // 3. Buat Workbook baru dan masukkan Worksheet ke dalamnya
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Presensi");

      // 4. Unduh file sebagai .xlsx
      XLSX.writeFile(workbook, `Rekap_Presensi_${namaBulan}_${tahun}.xlsx`);
    } catch (err) {
      console.error("Gagal men-generate Excel:", err);
      alert("Terjadi kesalahan saat mencetak Excel.");
    }
  };

  const totalMahasiswa = rekap.length;
  const avgKehadiran = totalMahasiswa 
    ? (rekap.reduce((acc, curr) => acc + curr.persentase, 0) / totalMahasiswa).toFixed(1) 
    : 0;
  const totalJam = rekap.reduce((acc, curr) => acc + curr.jam, 0);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      
      {/* 1. HEADER LAPORAN DENGAN 2 TOMBOL EXPORT */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <span className="text-[10px] font-bold text-blue-600 tracking-widest uppercase bg-blue-50 px-3 py-1 rounded-full">Evaluasi & Audit Akademik</span>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 mt-2">Laporan & Analisis Presensi</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5 max-w-2xl">Analisis tingkat kedisiplinan, akumulasi jam kerja, dan rekapitulasi nilai mahasiswa bimbingan.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full xl:w-auto">
          <select 
            value={bulan} 
            onChange={(e) => setBulan(e.target.value)} 
            className="bg-slate-50 border border-slate-200 text-slate-700 px-4 py-3 rounded-xl text-xs font-bold outline-none cursor-pointer flex-1 sm:flex-none min-w-[140px]"
          >
            {Array.from({length: 12}, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('id-ID', { month: 'long' })}</option>
            ))}
          </select>
          
          <div className="flex gap-2 w-full sm:w-auto">
            {/* Tombol PDF */}
            <button 
              onClick={handleExportPDF}
              className="flex-1 sm:flex-none bg-rose-50 text-rose-600 border border-rose-200 px-5 py-3 rounded-xl text-xs font-bold shadow-sm hover:bg-rose-100 transition-colors flex justify-center items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 16l-5-5h3V4h4v7h3l-5 5zm9-5v11H3V11h3v9h12v-9h3z"/></svg>
              PDF
            </button>

            {/* Tombol Excel */}
            <button 
              onClick={handleExportExcel}
              className="flex-1 sm:flex-none bg-emerald-600 text-white px-5 py-3 rounded-xl text-xs font-bold shadow-md hover:bg-emerald-700 transition-colors flex justify-center items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              Spreadsheet
            </button>
          </div>
        </div>
      </div>

      {/* 2. STATISTIK UTAMA LAPORAN */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tingkat Kehadiran</p>
          <h3 className="text-3xl md:text-4xl font-black text-slate-800 mt-2">{avgKehadiran}%</h3>
          <p className="text-[11px] text-emerald-600 font-bold mt-1">Rata-rata dari {totalMahasiswa} Bimbingan</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jam Efektif Terpenuhi</p>
          <h3 className="text-3xl md:text-4xl font-black text-blue-600 mt-2">{totalJam}</h3>
          <p className="text-[11px] text-slate-400 mt-1">Total akumulasi jam bimbingan</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 opacity-50">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kepatuhan Geofence</p>
          <h3 className="text-3xl md:text-4xl font-black text-emerald-600 mt-2">N/A</h3>
          <p className="text-[11px] text-emerald-600 font-bold mt-1">Dalam pengembangan</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 opacity-50">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lembur Terverifikasi</p>
          <h3 className="text-3xl md:text-4xl font-black text-slate-800 mt-2">N/A</h3>
          <p className="text-[11px] text-slate-500 mt-1">Dalam pengembangan</p>
        </div>
      </div>

      {/* 3. TABEL REKAPITULASI */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div>
              <h3 className="font-bold text-slate-800 text-base">Rekapitulasi Mahasiswa Bulanan</h3>
              <p className="text-xs text-slate-400 mt-0.5">Menampilkan rekap presensi untuk bulan {bulan} / {tahun}</p>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-100">
              <tr>
                <th className="p-4">Mahasiswa</th>
                <th className="p-4">Hari Hadir</th>
                <th className="p-4">Tepat Waktu</th>
                <th className="p-4">Terlambat</th>
                <th className="p-4">Izin / Sakit</th>
                <th className="p-4">Jam Bimbingan</th>
                <th className="p-4">Nilai Disiplin</th>
                <th className="p-4">Status Rekap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-500 font-medium">Memuat data rekapitulasi...</td>
                </tr>
              ) : rekap.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-500 font-medium">Tidak ada data untuk bulan ini.</td>
                </tr>
              ) : (
                rekap.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs">{item.img}</div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs">{item.name}</p>
                          <p className="text-[10px] text-slate-400">NIM: {item.nim}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-700 text-xs">{item.hadir}</p>
                      <p className="text-[10px] text-emerald-600 font-semibold">{item.persentase}%</p>
                    </td>
                    <td className="p-4 text-xs font-bold text-slate-600">{item.tepat}</td>
                    <td className="p-4 text-xs font-bold text-amber-600">{item.telat}</td>
                    <td className="p-4 text-xs font-bold text-slate-600">{item.izin}</td>
                    <td className="p-4 text-xs font-bold text-blue-600">{item.jam} Jam</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-black text-slate-700">{item.nilai}</span>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${item.status === 'Siap Cetak' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}