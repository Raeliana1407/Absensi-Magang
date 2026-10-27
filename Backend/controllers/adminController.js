const pool = require('../config/db');

// Mengambil semua daftar user & nama pembimbingnya
const getAllUsers = async (req, res) => {
    try {
        // Kita pakai LEFT JOIN agar nama pembimbing ikut terbawa
        const query = `
            SELECT u.id, u.nama, u.email, u.role, u.divisi, u.status, 
                   u.pembimbing_id, p.nama AS nama_pembimbing
            FROM users u
            LEFT JOIN users p ON u.pembimbing_id = p.id
            ORDER BY u.created_at DESC
        `;
        const [rows] = await pool.execute(query);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error getAllUsers:", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Mengubah status akun & assign pembimbing (Approve)
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, pembimbing_id, role, divisi } = req.body;

        // Jika pembimbing tidak diisi, jadikan NULL di database
        const p_id = pembimbing_id ? pembimbing_id : null;

        const query = `
            UPDATE users 
            SET status = ?, pembimbing_id = ?, role = ?, divisi = ?
            WHERE id = ?
        `;
        
        await pool.execute(query, [status, p_id, role, divisi, id]);
        res.json({ success: true, message: 'Data pengguna berhasil diperbarui!' });
    } catch (error) {
        console.error("Error updateUser:", error);
        res.status(500).json({ success: false, message: 'Gagal mengupdate pengguna' });
    }
};

// =======================================
// FITUR BARU: HAPUS USER
// =======================================
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = 'DELETE FROM users WHERE id = ?';
        const [result] = await pool.execute(query, [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
        }
        
        res.json({ success: true, message: 'User berhasil dihapus secara permanen' });
    } catch (error) {
        console.error("Error deleteUser:", error);
        res.status(500).json({ success: false, message: 'Server error saat menghapus pengguna' });
    }
};

// =======================================
// FUNGSI UNTUK PENGATURAN (GEOFENCE & JAM)
// =======================================

// 1. Ambil Semua Pengaturan Lokasi
const getSettings = async (req, res) => {
    try {
        // HAPUS "LIMIT 1" agar semua lokasi terpanggil
        const [rows] = await pool.execute('SELECT * FROM settings ORDER BY id ASC');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error getSettings:", error);
        res.status(500).json({ success: false, message: 'Server error mengambil pengaturan' });
    }
};

// 2. Update Pengaturan (Berdasarkan ID)
const updateSettings = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_lokasi, latitude, longitude, radius, jam_masuk, jam_pulang } = req.body;
        
        const query = `
            UPDATE settings 
            SET nama_lokasi = ?, latitude = ?, longitude = ?, radius = ?, jam_masuk = ?, jam_pulang = ?
            WHERE id = ?
        `;
        
        await pool.execute(query, [nama_lokasi, latitude, longitude, radius, jam_masuk, jam_pulang, id]);
        res.json({ success: true, message: 'Konfigurasi Titik Lokasi berhasil diupdate!' });
    } catch (error) {
        console.error("Error updateSettings:", error);
        res.status(500).json({ success: false, message: 'Server error menyimpan pengaturan' });
    }
};

// 3. Tambah Pengaturan Lokasi Baru (POST)
const createSettings = async (req, res) => {
    try {
        const { nama_lokasi, latitude, longitude, radius, jam_masuk, jam_pulang } = req.body;
        
        const query = `
            INSERT INTO settings (nama_lokasi, latitude, longitude, radius, jam_masuk, jam_pulang) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await pool.execute(query, [nama_lokasi, latitude, longitude, radius, jam_masuk, jam_pulang]);
        res.json({ success: true, message: 'Titik Lokasi Baru berhasil ditambahkan!', newId: result.insertId });
    } catch (error) {
        console.error("Error createSettings:", error);
        res.status(500).json({ success: false, message: 'Server error membuat lokasi baru' });
    }
};

// 4. Hapus Pengaturan Lokasi (DELETE)
const deleteSettings = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Opsional: Cek apakah sisa 1 lokasi. Kalau ya, tolak hapus.
        const [count] = await pool.execute('SELECT COUNT(*) as total FROM settings');
        if (count[0].total <= 1) {
            return res.status(400).json({ success: false, message: 'Minimal harus ada 1 titik lokasi!' });
        }

        await pool.execute('DELETE FROM settings WHERE id = ?', [id]);
        res.json({ success: true, message: 'Titik lokasi berhasil dihapus!' });
    } catch (error) {
        console.error("Error deleteSettings:", error);
        res.status(500).json({ success: false, message: 'Server error menghapus lokasi' });
    }
};
module.exports = { getAllUsers, updateUser, deleteUser, getSettings, updateSettings, createSettings, deleteSettings };