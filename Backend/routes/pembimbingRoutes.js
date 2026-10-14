const express = require('express');
const router = express.Router();

// Update Import-nya
const { getAnakBimbingan, getDetailMahasiswa, getDashboardHariIni } = require('../controllers/pembimbingController');

// Route list bimbingan (yang lama)
router.get('/bimbingan/:id', getAnakBimbingan);

// Route detail mahasiswa (BARU)
router.get('/mahasiswa/:id/detail', getDetailMahasiswa);

// Route Dashboard Hari Ini (BARU TAMBAHKAN INI)
router.get('/dashboard-hari-ini/:pembimbing_id', getDashboardHariIni);

module.exports = router;