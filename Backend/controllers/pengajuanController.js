const pool = require('../config/db');

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

// Mengajukan Sakit (Upload ke ImgBB)
const ajukanSakit = async (req, res) => {
    try {
        const { user_id, tanggal_mulai, tanggal_selesai, keterangan } = req.body;
        let file_lampiran = null;

        // Jika ada foto yang di-upload
        if (req.file) {
            // Ubah file jadi teks Base64 untuk dikirim lewat HTTP
            const base64Image = req.file.buffer.toString('base64');
            const formData = new URLSearchParams();
            formData.append('image', base64Image);

            // 🔥 TARUH API KEY IMGBB ANDA DI SINI 🔥
            // Pakai jalur YOLO, langsung hardcode aja biar gak pusing mikirin .env
            const IMGBB_KEY = 'e7705c2dd3aa97767b185ac43ed11681'; 

            // Tembak fotonya ke server ImgBB
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Sukses! Kita ambil link URL pendeknya
                file_lampiran = data.data.url; 
            } else {
                console.error('ImgBB Error:', data);
                return res.status(400).json({ success: false, message: 'Gagal upload gambar ke ImgBB.' });
            }
        }

        // JURUS ANTI-UNDEFINED MYSQL
        const finalUserId = user_id ?? null;
        const finalTglMulai = tanggal_mulai ?? null;
        const finalTglSelesai = tanggal_selesai ?? null;
        const finalKeterangan = keterangan ?? null;
        const finalFile = file_lampiran ?? null;

        // Simpan ke MySQL
        const query = `INSERT INTO pengajuan_izin (user_id, jenis_izin, tanggal_mulai, tanggal_selesai, keterangan, file_lampiran) VALUES (?, 'sakit', ?, ?, ?, ?)`;
        await pool.execute(query, [finalUserId, finalTglMulai, finalTglSelesai, finalKeterangan, finalFile]);
        
        res.json({ success: true, message: 'Keterangan sakit berhasil dikirim.' });
    } catch (error) {
        console.error('Error ajukanSakit ImgBB:', error);
        res.status(500).json({ success: false, message: 'Server error saat memproses pengajuan sakit.' });
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