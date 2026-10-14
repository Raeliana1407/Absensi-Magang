const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { ajukanIzin, ajukanSakit, getPengajuanPending, updateStatusPengajuan, getRiwayatPengajuanUser, getRiwayatPembimbing } = require('../controllers/pengajuanController');
// const { authenticateToken } = require('../middleware/auth'); // Uncomment jika ada middleware auth

// Konfigurasi Multer untuk menyimpan file surat dokter
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Menyimpan file di folder 'public/uploads/'. 
        // PENTING: Anda harus membuat folder ini secara manual di root backend Anda!
        cb(null, 'public/uploads/'); 
    },
    filename: function (req, file, cb) {
        // Mengubah nama file agar unik (menghindari nama file yang sama tertimpa)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'surat-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Route untuk Izin (Tanpa upload file)
// Gunakan middleware authenticateToken jika Anda memproteksi route-nya
router.post('/izin', ajukanIzin);

// Route untuk Sakit (Dengan upload file satu lampiran berlabel 'file_lampiran')
router.post('/sakit', upload.single('file_lampiran'), ajukanSakit);
router.get('/pending', getPengajuanPending);
router.put('/status/:id', updateStatusPengajuan);
router.get('/riwayat/:user_id', getRiwayatPengajuanUser);
router.get('/riwayat-pembimbing/:pembimbing_id', getRiwayatPembimbing);
module.exports = router;