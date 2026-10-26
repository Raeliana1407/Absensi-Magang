const express = require('express');
const router = express.Router();
const multer = require('multer');
const { 
    ajukanIzin, 
    ajukanSakit, 
    getPengajuanPending, 
    updateStatusPengajuan, 
    getRiwayatPengajuanUser, 
    getRiwayatPembimbing,
    akhiriIzinLebihAwal 
} = require('../controllers/pengajuanController');

// 🔥 KONFIGURASI ANTI-ERROR VERCEL (MEMORY STORAGE) 🔥
// File tidak disimpan di folder, melainkan ditahan di RAM sementara 
// sebelum dilempar langsung ke Google Drive oleh Controller.
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Route untuk Izin (Tanpa upload file)
router.post('/izin', ajukanIzin);

// Route untuk Sakit (Dengan upload file satu lampiran berlabel 'file_lampiran')
router.post('/sakit', upload.single('file_lampiran'), ajukanSakit);

router.get('/pending', getPengajuanPending);
router.put('/status/:id', updateStatusPengajuan);
router.get('/riwayat/:user_id', getRiwayatPengajuanUser);
router.get('/riwayat-pembimbing/:pembimbing_id', getRiwayatPembimbing);
router.put('/akhiri/:id', akhiriIzinLebihAwal);

module.exports = router;