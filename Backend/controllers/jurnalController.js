const pool = require('../config/db');

// Tambah Jurnal Baru
const tambahJurnal = async (req, res) => {
    try {
        const { user_id, kegiatan, deskripsi } = req.body;

        if (!user_id || !kegiatan) {
            return res.status(400).json({ success: false, message: 'Kegiatan tidak boleh kosong!' });
        }

        // Ambil tanggal hari ini format YYYY-MM-DD
        const tanggalHariIni = new Date().toISOString().split('T')[0];
        
        // Deskripsi default jika kosong
        const descVal = deskripsi || '-';
        const statusDefault = 'menunggu'; // Sesuai enum di database lu

        const query = `
            INSERT INTO jurnal_logbook (user_id, tanggal, kegiatan, deskripsi, status_review) 
            VALUES (?, ?, ?, ?, ?)
        `;
        await pool.execute(query, [user_id, tanggalHariIni, kegiatan, descVal, statusDefault]);

        res.json({ success: true, message: 'Jurnal berhasil disimpan!' });
    } catch (error) {
        console.error("Error tambahJurnal:", error.message);
        res.status(500).json({ success: false, message: 'Gagal menyimpan jurnal: ' + error.message });
    }
};

// Ambil riwayat jurnal anak magang
const getJurnalUser = async (req, res) => {
    try {
        const { user_id } = req.params;
        const query = `
            SELECT id, tanggal, kegiatan, deskripsi, status_review 
            FROM jurnal_logbook 
            WHERE user_id = ? 
            ORDER BY id DESC
        `;
        const [rows] = await pool.execute(query, [user_id]);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error getJurnalUser:", error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { tambahJurnal, getJurnalUser };