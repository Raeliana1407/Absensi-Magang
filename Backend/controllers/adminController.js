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
// FUNGSI UNTUK PENGATURAN (GEOFENCE & JAM)
// =======================================

// 1. Ambil Pengaturan Saat Ini
const getSettings = async (req, res) => {
    try {
        // Kita hanya mengambil 1 baris pertama karena pengaturan itu tunggal
        const [rows] = await pool.execute('SELECT * FROM settings LIMIT 1');
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Pengaturan belum ada' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error("Error getSettings:", error);
        res.status(500).json({ success: false, message: 'Server error mengambil pengaturan' });
    }
};

// 2. Update Pengaturan
const updateSettings = async (req, res) => {
    try {
        const { latitude, longitude, radius, jam_masuk, jam_pulang } = req.body;
        
        // Kita update baris dengan id = 1
        const query = `
            UPDATE settings 
            SET latitude = ?, longitude = ?, radius = ?, jam_masuk = ?, jam_pulang = ?
            WHERE id = 1
        `;
        
        await pool.execute(query, [latitude, longitude, radius, jam_masuk, jam_pulang]);
        res.json({ success: true, message: 'Konfigurasi Sistem berhasil disimpan!' });
    } catch (error) {
        console.error("Error updateSettings:", error);
        res.status(500).json({ success: false, message: 'Server error menyimpan pengaturan' });
    }
};

// JANGAN LUPA export semua fungsinya!
module.exports = { getAllUsers, updateUser, getSettings, updateSettings };