const pool = require('../config/db');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const ajukanIzin = async (req, res) => {
    try {
        const { user_id, tanggal_mulai, tanggal_selesai, keterangan } = req.body;
        
        const [cekPending] = await pool.execute(
            `SELECT id FROM pengajuan_izin WHERE user_id = ? AND status = 'pending'`,
            [user_id]
        );
        if (cekPending.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Harap tunggu, Anda masih memiliki pengajuan izin/sakit yang sedang diproses.' 
            });
        }

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

const ajukanSakit = async (req, res) => {
    try {
        const { user_id, tanggal_mulai, tanggal_selesai, keterangan } = req.body;
        
        const [cekPending] = await pool.execute(
            `SELECT id FROM pengajuan_izin WHERE user_id = ? AND status = 'pending'`,
            [user_id]
        );
        if (cekPending.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Harap tunggu, Anda masih memiliki pengajuan izin/sakit yang sedang diproses.' 
            });
        }

        let file_lampiran = null;
        if (req.file) {
            const uploadToCloudinary = (fileBuffer) => {
                return new Promise((resolve, reject) => {
                    let stream = cloudinary.uploader.upload_stream(
                        { 
                            folder: "absensi_magang/surat_sakit",
                            transformation: [
                                { width: 1000, crop: "limit" }, 
                                { quality: "auto" },            
                                { fetch_format: "auto" }        
                            ]
                        },
                        (error, result) => {
                            if (result) resolve(result);
                            else reject(error);
                        }
                    );
                    streamifier.createReadStream(fileBuffer).pipe(stream);
                });
            };

            const resultUpload = await uploadToCloudinary(req.file.buffer);
            file_lampiran = resultUpload.secure_url; 
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
        const role = req.user?.role || req.query.role;
        let query = '';
        let params = [];

        if (role === 'admin') {
            query = `
                SELECT p.*, u.nama AS nama_user 
                FROM pengajuan_izin p
                JOIN users u ON p.user_id = u.id
                WHERE p.status != 'pending'
                ORDER BY p.id DESC LIMIT 100
            `;
        } else {
            query = `
                SELECT p.*, u.nama AS nama_user 
                FROM pengajuan_izin p
                JOIN users u ON p.user_id = u.id
                WHERE u.pembimbing_id = ? AND p.status != 'pending'
                ORDER BY p.id DESC LIMIT 50
            `;
            params = [req.params.pembimbing_id];
        }

        const [rows] = await pool.execute(query, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error memuat riwayat.' });
    }
};

const akhiriIzinLebihAwal = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `UPDATE pengajuan_izin SET tanggal_selesai = DATE_SUB(CURDATE(), INTERVAL 1 DAY) WHERE id = ? AND status = 'disetujui'`;
        await pool.execute(query, [id]);
        res.json({ success: true, message: 'Izin diakhiri! Anak magang sudah bisa absen hari ini.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal mengupdate tanggal izin.' });
    }
};

module.exports = { ajukanIzin, ajukanSakit, getPengajuanPending, updateStatusPengajuan, getRiwayatPengajuanUser, getRiwayatPembimbing, akhiriIzinLebihAwal };