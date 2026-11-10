import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

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

// --- Halaman Pembimbing & Admin (Lebur) ---
import PembimbingLayout from './components/layout/PembimbingLayout';
import DashboardPembimbing from './pages/pembimbing/DashboardPembimbing';
import BimbinganList from './pages/pembimbing/BimbinganList';
import Laporan from './pages/pembimbing/Laporan';
import DetailMahasiswa from './pages/pembimbing/DetailMahasiswa';
import PersetujuanIzin from './pages/pembimbing/PersetujuanIzin';
import SettingsPembimbing from './pages/pembimbing/SettingsPembimbing';

// --- Halaman Khusus Admin ---
import AdminUsers from './pages/admin/AdminUsers';
import AdminSettings from './pages/admin/AdminSettings';

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
            ROUTE SUPERVISOR & SUPERADMIN (LEBUR)
        ============================================= */}
        {/* Admin bisa mengakses semua ini karena pakai layout yang sama */}
        <Route path="/pembimbing" element={<PembimbingLayout />}>
          {/* Menu yang di-share (Admin & Pembimbing) */}
          <Route path="dashboard" element={<DashboardPembimbing />} />
          <Route path="laporan" element={<Laporan />} />
          <Route path="bimbingan" element={<BimbinganList />} />
          <Route path="mahasiswa/:id" element={<DetailMahasiswa />} />
          <Route path="persetujuan" element={<PersetujuanIzin />} />
          <Route path="settings" element={<SettingsPembimbing />} />
          
          {/* Menu Khusus Admin (Bisa diakses dengan URL /pembimbing/admin-users) */}
          <Route path="admin-users" element={<AdminUsers />} />
          <Route path="admin-settings" element={<AdminSettings />} />
        </Route>

        {/* Redirect admin root ke dashboard gabungan */}
        <Route path="/admin" element={<Navigate to="/pembimbing/dashboard" replace />} />
        
      </Routes>
    </Router>
  );
}

export default App;