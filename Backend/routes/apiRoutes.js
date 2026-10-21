const express = require('express');
const router = express.Router();
const multer = require('multer');

// Setup MemoryStorage untuk Upload Foto Profil
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Import Middlewares & Controllers
const verifyToken = require('../middlewares/authMiddleware');
const { login, ubahKataSandi, register, updateProfile } = require('../controllers/authController');
const { clockIn, getRiwayat, cekStatusHariIni } = require('../controllers/absenController');

// Rute Terbuka (Tanpa Token)
router.post('/login', login);
router.post('/register', register);

// Rute Dilindungi (Wajib Token)
router.post('/ubah-kata-sandi', verifyToken, ubahKataSandi);
router.put('/update-profile', verifyToken, upload.single('foto_profil'), updateProfile); // 🔥 RUTE BARU PROFILE

router.post('/absen', verifyToken, clockIn);
router.get('/riwayat/:user_id', verifyToken, getRiwayat);
router.get('/status/:user_id', verifyToken, cekStatusHariIni);

module.exports = router;