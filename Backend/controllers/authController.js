const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Email tidak ditemukan.' });
        
        const user = rows[0];
        let isPasswordValid = false;
        
        if (user.password === password) {
            isPasswordValid = true; 
        } else {
            isPasswordValid = await bcrypt.compare(password, user.password);
        }

        if (!isPasswordValid) return res.status(401).json({ success: false, message: 'Password salah.' });

        // 🔥 SATPAM AKTIVASI: Cek apakah akun masih pending / belum disetujui Admin 🔥
        if (user.status === 'pending') {
            return res.status(403).json({ 
                success: false, 
                message: 'Akun Anda belum diaktivasi oleh Admin. Silakan tunggu persetujuan.' 
            });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, divisi: user.divisi },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            success: true, message: 'Login berhasil!', token,
            user: { id: user.id, nama: user.nama, email: user.email, divisi: user.divisi, role: user.role }
        });
    } catch (error) {
        console.error('Error saat login:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
    }
};

const ubahKataSandi = async (req, res) => {
    try {
        const { user_id, passwordLama, passwordBaru } = req.body;

        // 1. Ambil data user dari database
        const [users] = await pool.execute(`SELECT password FROM users WHERE id = ?`, [user_id]);
        if (users.length === 0) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });

        const user = users[0];

        // 2. Cek apakah password lama cocok (Support Plaintext & Bcrypt Hash)
        let match = false;
        
        if (user.password.startsWith('$2')) {
            // Jika password di database sudah berbentuk hash bcrypt
            match = await bcrypt.compare(passwordLama, user.password);
        } else {
            // Jika password di database masih teks biasa (plain text)
            match = (passwordLama === user.password);
        }

        if (!match) {
            return res.status(400).json({ success: false, message: 'Kata sandi lama salah!' });
        }

        // 3. Hash password baru dan simpan ke database
        const hashedBaru = await bcrypt.hash(passwordBaru, 10);
        await pool.execute(`UPDATE users SET password = ? WHERE id = ?`, [hashedBaru, user_id]);

        res.json({ success: true, message: 'Kata sandi berhasil diubah.' });

    } catch (error) {
        console.error('Error ubah password:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
    }
};

// ==========================================
// Fungsi Registrasi User Baru
// ==========================================
const register = async (req, res) => {
    try {
        const { nama, email, password } = req.body;

        // 1. Cek apakah email sudah dipakai
        const checkQuery = `SELECT id FROM users WHERE email = ?`;
        const [existingUser] = await pool.execute(checkQuery, [email]);
        
        if (existingUser.length > 0) {
            return res.status(400).json({ success: false, message: 'Email sudah terdaftar. Gunakan email lain!' });
        }

        // 2. Enkripsi (Hash) Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Simpan ke database dengan default role 'magang' dan status 'pending'
        const insertQuery = `INSERT INTO users (nama, email, password, role, status) VALUES (?, ?, ?, 'magang', 'pending')`;
        await pool.execute(insertQuery, [nama, email, hashedPassword]);

        res.status(201).json({ 
            success: true, 
            message: 'Registrasi berhasil! Akun Anda sedang menunggu persetujuan Admin.' 
        });

    } catch (error) {
        console.error('Error Register:', error);
        res.status(500).json({ success: false, message: 'Server error saat registrasi.' });
    }
};

module.exports = { login, ubahKataSandi, register };