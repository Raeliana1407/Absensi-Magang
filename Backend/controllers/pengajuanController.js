const pool = require('../config/db');

// Mengajukan Izin
const ajukanIzin = async (req, res) => {
    try {
        const { user_id, tanggal_mulai, tanggal_selesai, keterangan } = req.body;
        
        const query = `INSERT INTO pengajuan_izin (user_id, jenis_izin, tanggal_mulai, tanggal_selesai, keterangan) VALUES (?, 'izin', ?, ?, ?)`;
        await pool.execute(query, [user_id, tanggal_mulai, tanggal_selesai, keterangan]);
        
        res.json({ success: true, message: 'Pengajuan izin berhasil dikirim.' });
    } catch (error) {
        console.error('Error ajukanIzin:', error);
        res.status(500).json({ success: false, message: 'Server error saat mengajukan izin.' });
    }
};

// Mengajukan Sakit (Upload ke Google Drive)
const ajukanSakit = async (req, res) => {
    try {
        const { user_id, tanggal_mulai, tanggal_selesai, keterangan } = req.body;
        let file_lampiran = null;

        if (req.file) {
            // Ubah buffer dari multer menjadi stream
            const bufferStream = new stream.PassThrough();
            bufferStream.end(req.file.buffer);

            // Upload ke Google Drive
            const driveResponse = await drive.files.create({
                requestBody: {
                    name: `Sakit_${user_id}_${Date.now()}_${req.file.originalname}`,
                    parents: [process.env.GDRIVE_FOLDER_SAKIT],
                },
                media: {
                    mimeType: req.file.mimetype,
                    body: bufferStream,
                },
                fields: 'id, webViewLink',
            });

            // Ambil link file dari Google Drive (Gunakan || null untuk jaga-jaga Drive gagal balikin link)
            file_lampiran = driveResponse.data.webViewLink || null;
            
            // Opsional: Buat file bisa dilihat siapa saja (Public View)
            await drive.permissions.create({
                fileId: driveResponse.data.id,
                requestBody: { role: 'reader', type: 'anyone' }
            });
        }

        // 🔥 JURUS ANTI-UNDEFINED 🔥
        // Jika ada data dari req.body yang undefined, otomatis diubah jadi null
        const finalUserId = user_id ?? null;
        const finalTglMulai = tanggal_mulai ?? null;
        const finalTglSelesai = tanggal_selesai ?? null;
        const finalKeterangan = keterangan ?? null;
        const finalFile = file_lampiran ?? null;

        const query = `INSERT INTO pengajuan_izin (user_id, jenis_izin, tanggal_mulai, tanggal_selesai, keterangan, file_lampiran) VALUES (?, 'sakit', ?, ?, ?, ?)`;
        
        // Masukkan variabel yang sudah dipastikan aman dari undefined
        await pool.execute(query, [finalUserId, finalTglMulai, finalTglSelesai, finalKeterangan, finalFile]);
        
        res.json({ success: true, message: 'Keterangan sakit berhasil dikirim.' });
    } catch (error) {
        console.error('Error ajukanSakit Drive:', error);
        res.status(500).json({ success: false, message: 'Server error saat mengirim data ke Drive.' });
    }
};
// Menampilkan daftar pengajuan yang masih 'pending' (Untuk Pembimbing)
const getPengajuanPending = async (req, res) => {
    try {
        // Kita gunakan JOIN ke tabel users (atau nama tabel user Anda) untuk memunculkan nama anak magang
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
        console.error('Error getPengajuanPending:', error);
        res.status(500).json({ success: false, message: 'Server error mengambil data pengajuan.' });
    }
};

// Mengupdate status pengajuan menjadi 'disetujui' atau 'ditolak'
const updateStatusPengajuan = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // Menerima 'disetujui' atau 'ditolak'
        
        const query = `UPDATE pengajuan_izin SET status = ? WHERE id = ?`;
        await pool.execute(query, [status, id]);
        
        res.json({ success: true, message: `Pengajuan berhasil di${status}.` });
    } catch (error) {
        console.error('Error updateStatusPengajuan:', error);
        res.status(500).json({ success: false, message: 'Gagal mengupdate status.' });
    }
};
const getRiwayatPengajuanUser = async (req, res) => {
    try {
        const { user_id } = req.params;
        const query = `
            SELECT * FROM pengajuan_izin 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        `;
        const [rows] = await pool.execute(query, [user_id]);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error getRiwayatPengajuanUser:', error);
        res.status(500).json({ success: false, message: 'Server error mengambil riwayat pengajuan.' });
    }
};
// ==========================================
// Fungsi Mengambil Riwayat Persetujuan Pembimbing
// ==========================================
const getRiwayatPembimbing = async (req, res) => {
    try {
        const { pembimbing_id } = req.params;
        
        // Tarik data izin yang statusnya bukan 'pending' (disetujui/ditolak)
        // khusus untuk anak bimbingan milik pembimbing ini
        const query = `
            SELECT p.*, u.nama AS nama_user 
            FROM pengajuan_izin p
            JOIN users u ON p.user_id = u.id
            WHERE u.pembimbing_id = ? AND p.status != 'pending'
            ORDER BY p.id DESC 
            LIMIT 50
        `;
        const [rows] = await pool.execute(query, [pembimbing_id]);
        
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error getRiwayatPembimbing:', error);
        res.status(500).json({ success: false, message: 'Server error memuat riwayat.' });
    }
};

// JANGAN LUPA tambahkan di module.exports
module.exports = { ajukanIzin, ajukanSakit, getPengajuanPending, updateStatusPengajuan, getRiwayatPengajuanUser, getRiwayatPembimbing };