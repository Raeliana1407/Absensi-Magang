const pool = require('../config/db');

const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier'); // Bawaan multer/node, atau install jika perlu

// Konfigurasi Cloudinary (Masukkan data dari Dashboard Cloudinary Anda)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Mengajukan Izin (Tanpa File)
const ajukanIzin = async (req, res) => {
    try {
        const { user_id, tanggal_mulai, tanggal_selesai, keterangan } = req.body;
        
        const finalUserId = user_id ?? null;
        const finalTglMulai = tanggal_mulai ?? null;
        const finalTglSelesai = tanggal_selesai ?? null;
        const finalKeterangan = keterangan ?? null;

        const query = `INSERT INTO pengajuan_izin (user_id, jenis_izin, tanggal_mulai, tanggal_selesai, keterangan) VALUES (?, 'izin', ?, ?, ?)`;
        await pool.execute(query, [finalUserId, finalTglMulai, finalTglSelesai, finalKeterangan]);
        
        res.json({ success: true, message: 'Pengajuan izin berhasil dikirim.' });
    } catch (error) {
        console.error('Error ajukanIzin:', error);
        res.status(500).json({ success: false, message: 'Server error saat mengajukan izin.' });
    }
};

// Mengajukan Sakit (Upload ke Cloudinary)
const ajukanSakit = async (req, res) => {
    try {
        const { user_id, tanggal_mulai, tanggal_selesai, keterangan } = req.body;
        let file_lampiran = null;

        if (req.file) {
            // Fungsi helper untuk upload buffer ke Cloudinary via Stream
            const uploadToCloudinary = (fileBuffer) => {
                return new Promise((resolve, reject) => {
                    let stream = cloudinary.uploader.upload_stream(
                        { folder: "absensi_magang" },
                        (error, result) => {
                            if (result) {
                                resolve(result);
                            } else {
                                reject(error);
                            }
                        }
                    );
                    streamifier.createReadStream(fileBuffer).pipe(stream);
                });
            };

            const resultUpload = await uploadToCloudinary(req.file.buffer);
            file_lampiran = resultUpload.secure_url; // Link HTTPS yang aman dan tidak bakal kena blokir SSL!
        }

        const finalUserId = user_id ?? null;
        const finalTglMulai = tanggal_mulai ?? null;
        const finalTglSelesai = tanggal_selesai ?? null;
        const finalKeterangan = keterangan ?? null;
        const finalFile = file_lampiran ?? null;

        const query = `INSERT INTO pengajuan_izin (user_id, jenis_izin, tanggal_mulai, tanggal_selesai, keterangan, file_lampiran) VALUES (?, 'sakit', ?, ?, ?, ?)`;
        await pool.execute(query, [finalUserId, finalTglMulai, finalTglSelesai, finalKeterangan, finalFile]);
        
        res.json({ success: true, message: 'Keterangan sakit berhasil dikirim.' });
    } catch (error) {
        console.error('Error Cloudinary:', error);
        res.status(500).json({ success: false, message: 'Gagal mengupload file ke Cloudinary.' });
    }
};

// Menampilkan daftar pengajuan yang masih 'pending'
const getPengajuanPending = async (req, res) => {
    try {
        const query = `
            SELECT p.*, u.nama AS nama_user 
            FROM pengajuan_izin p 
            JOIN users u ON p.user_id = u.id 
            WHERE p.status = 'pending'
            ORDER BY p.created_at DESC
        `;
        const [rows] = await pool.execute(query);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error mengambil data pengajuan.' });
    }
};

// Mengupdate status pengajuan menjadi 'disetujui' atau 'ditolak'
const updateStatusPengajuan = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; 
        const query = `UPDATE pengajuan_izin SET status = ? WHERE id = ?`;
        await pool.execute(query, [status, id]);
        res.json({ success: true, message: `Pengajuan berhasil di${status}.` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal mengupdate status.' });
    }
};

const getRiwayatPengajuanUser = async (req, res) => {
    try {
        const query = `SELECT * FROM pengajuan_izin WHERE user_id = ? ORDER BY created_at DESC`;
        const [rows] = await pool.execute(query, [req.params.user_id]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error mengambil riwayat.' });
    }
};

const getRiwayatPembimbing = async (req, res) => {
    try {
        const query = `
            SELECT p.*, u.nama AS nama_user 
            FROM pengajuan_izin p
            JOIN users u ON p.user_id = u.id
            WHERE u.pembimbing_id = ? AND p.status != 'pending'
            ORDER BY p.id DESC LIMIT 50
        `;
        const [rows] = await pool.execute(query, [req.params.pembimbing_id]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error memuat riwayat.' });
    }
};

module.exports = { ajukanIzin, ajukanSakit, getPengajuanPending, updateStatusPengajuan, getRiwayatPengajuanUser, getRiwayatPembimbing };