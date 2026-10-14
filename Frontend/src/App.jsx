import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// --- Halaman Anak Magang ---
import Home from './pages/Home';
import Timesheet from './pages/Timesheet';
import Profile from './pages/Profile';
import Location from './pages/Location';
import Login from './pages/Login';
import Sakit from './pages/Sakit';
import Izin from './pages/Izin';
import Jurnal from './pages/Jurnal';
import Setting from './pages/Setting';
import RiwayatPengajuan from './pages/RiwayatPengajuan';
import Register from './pages/Register';

// --- Halaman Pembimbing ---
import PembimbingLayout from './components/layout/PembimbingLayout';
import DashboardPembimbing from './pages/pembimbing/DashboardPembimbing';
import BimbinganList from './pages/pembimbing/BimbinganList';
import Laporan from './pages/pembimbing/Laporan';
import DetailMahasiswa from './pages/pembimbing/DetailMahasiswa';

// --- Halaman Admin ---
import AdminLayout from './components/layout/AdminLayout';
// Halaman sementara untuk memancing render
import AdminUsers from './pages/admin/AdminUsers';
import AdminSettings from './pages/admin/AdminSettings';
import PersetujuanIzin from './pages/pembimbing/PersetujuanIzin';
import SettingsPembimbing from './pages/pembimbing/SettingsPembimbing';

function App() {
  return (
    <Router>
      <Routes>
        {/* =========================================
            ROUTE ANAK MAGANG (Tanpa Layout Khusus)
        ============================================= */}
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/timesheet" element={<Timesheet />} />
        <Route path="/location" element={<Location/>} />
        <Route path="/profile" element={<Profile/>} />
        <Route path="/sakit" element={<Sakit />} />
        <Route path="/izin" element={<Izin />} />
        <Route path="/jurnal" element={<Jurnal />} />
        <Route path="/setting" element={<Setting />} />
        <Route path="/riwayat-pengajuan" element={<RiwayatPengajuan />} />
        <Route path="/register" element={<Register />} />
        
        {/* =========================================
            ROUTE PEMBIMBING (Dibungkus Layout)
        ============================================= */}
        <Route path="/pembimbing" element={<PembimbingLayout />}>
          {/* Kalau URL-nya /pembimbing/dashboard, masuk ke sini */}
          <Route path="dashboard" element={<DashboardPembimbing />} />
          <Route path="laporan" element={<Laporan />} />
          {/* Kalau URL-nya /pembimbing/bimbingan, masuk ke sini */}
          <Route path="bimbingan" element={<BimbinganList />} />
          <Route path="mahasiswa/:id" element={<DetailMahasiswa />} />
          <Route path="persetujuan" element={<PersetujuanIzin />} />
          <Route path="settings" element={<SettingsPembimbing />} />
        </Route>
        {/* =========================================
            ROUTE SUPERADMIN
        ============================================= */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="users" element={<AdminUsers />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>  
      </Routes>
    </Router>
  );
}

export default App;