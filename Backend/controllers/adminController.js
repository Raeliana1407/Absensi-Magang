const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// Mengambil semua daftar user, nama pembimbing, dan lokasi ULP
const getAllUsers = async (req, res) => {
    try {
        const query = `
            SELECT u.id, u.nama, u.email, u.username, u.role, u.divisi, u.universitas,
                   DATE_FORMAT(u.tgl_mulai, '%Y-%m-%d') AS tgl_mulai,
                   DATE_FORMAT(u.tgl_selesai, '%Y-%m-%d') AS tgl_selesai,
                   u.lokasi_id, s.nama_lokasi, u.status, 
                   u.pembimbing_id, p.nama AS nama_pembimbing
            FROM users u
            LEFT JOIN users p ON u.pembimbing_id = p.id
            LEFT JOIN settings s ON u.lokasi_id = s.id
            ORDER BY u.created_at DESC
        `;
        const [rows] = await pool.execute(query);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error getAllUsers:", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, pembimbing_id, role, divisi, universitas, lokasi_id, tgl_mulai, tgl_selesai } = req.body;
        
        const p_id = pembimbing_id ? pembimbing_id : null;
        const l_id = lokasi_id ? lokasi_id : null;
        const finalUniv = universitas ? universitas.trim() : null;
        const finalMulai = tgl_mulai ? tgl_mulai : null;
        const finalSelesai = tgl_selesai ? tgl_selesai : null;
        
        const query = `
            UPDATE users 
            SET status = ?, pembimbing_id = ?, role = ?, divisi = ?, 
                universitas = ?, lokasi_id = COALESCE(?, lokasi_id), 
                tgl_mulai = ?, tgl_selesai = ? 
            WHERE id = ?
        `;
        await pool.execute(query, [status, p_id, role, divisi, finalUniv, l_id, finalMulai, finalSelesai, id]);
        res.json({ success: true, message: 'Data pengguna berhasil diperbarui!' });
    } catch (error) {
        console.error("Error updateUser:", error);
        res.status(500).json({ success: false, message: 'Gagal mengupdate pengguna' });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
        res.json({ success: true, message: 'User berhasil dihapus secara permanen' });
    } catch (error) {
        console.error("Error deleteUser:", error);
        res.status(500).json({ success: false, message: 'Server error saat menghapus pengguna' });
    }
};

// RESET PASSWORD
const resetPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const defaultPassword = 'magang123'; 
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(defaultPassword, salt);
        
        const query = 'UPDATE users SET password = ? WHERE id = ?';
        const [result] = await pool.execute(query, [hashedPassword, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
        }
        
        res.json({ success: true, message: `Password berhasil direset menjadi: ${defaultPassword}` });
    } catch (error) {
        console.error("Error resetPassword:", error);
        res.status(500).json({ success: false, message: 'Server error saat mereset password' });
    }
};

// =======================================
// FUNGSI UNTUK PENGATURAN (GEOFENCE & JAM)
// =======================================
const getSettings = async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM settings ORDER BY id ASC');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error mengambil pengaturan' });
    }
};

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
        res.status(500).json({ success: false, message: 'Server error menyimpan pengaturan' });
    }
};

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
        res.status(500).json({ success: false, message: 'Server error membuat lokasi baru' });
    }
};

const deleteSettings = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [count] = await pool.execute('SELECT COUNT(*) as total FROM settings');
        if (count[0].total <= 1) {
            return res.status(400).json({ success: false, message: 'Minimal harus ada 1 titik lokasi!' });
        }

        await pool.execute('DELETE FROM settings WHERE id = ?', [id]);
        res.json({ success: true, message: 'Titik lokasi berhasil dihapus!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error menghapus lokasi' });
    }
};

module.exports = { getAllUsers, updateUser, deleteUser, resetPassword, getSettings, updateSettings, createSettings, deleteSettings };