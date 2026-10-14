const express = require('express');
const router = express.Router();

// Import Middlewares & Controllers
const verifyToken = require('../middlewares/authMiddleware');
const { login, ubahKataSandi, register } = require('../controllers/authController');
const { clockIn, getRiwayat, cekStatusHariIni } = require('../controllers/absenController'); // cekStatusHariIni ditambahkan ke sini

// Rute Terbuka (Tanpa Token)
router.post('/login', login);
router.post('/register', register);
router.post('/ubah-kata-sandi', verifyToken, ubahKataSandi);

// Rute Dilindungi (Wajib Token)
router.post('/absen', verifyToken, clockIn);
router.get('/riwayat/:user_id', verifyToken, getRiwayat);
router.get('/status/:user_id', verifyToken, cekStatusHariIni); // Rute status dipindah ke sini dan diproteksi token

module.exports = router;