const express = require('express');
const router = express.Router();

const { 
    getAnakBimbingan, 
    getDetailMahasiswa, 
    getDashboardHariIni,
    updatePeriodeMagang 
} = require('../controllers/pembimbingController');

// Route list bimbingan
router.get('/bimbingan/:id', getAnakBimbingan);

// Route detail mahasiswa
router.get('/mahasiswa/:id/detail', getDetailMahasiswa);

// Route Dashboard Hari Ini
router.get('/dashboard-hari-ini/:pembimbing_id', getDashboardHariIni);

// Route khusus Pembimbing ubah tanggal mulai / selesai magang anak bimbingan
router.put('/mahasiswa/:id/periode', updatePeriodeMagang);

module.exports = router;