const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const login = async (req, res) => {
    try {
        // Karena input bisa username ATAU email, kita tangkap 'email' dari frontend 
        // yang sekarang berfungsi ganda sebagai identifier.
        const identifier = req.body.email; 
        const { password } = req.body;

        // Cari user berdasarkan username ATAU email
        const [rows] = await pool.execute('SELECT * FROM users WHERE username = ? OR email = ?', [identifier, identifier]);
        
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Username atau Email tidak ditemukan.' });
        
        const user = rows[0];
        let isPasswordValid = false;
        
        if (user.password === password) {
            isPasswordValid = true; 
        } else {
            isPasswordValid = await bcrypt.compare(password, user.password);
        }

        if (!isPasswordValid) return res.status(401).json({ success: false, message: 'Password salah.' });

        // 🔥 SATPAM AKTIVASI 🔥
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
            user: { 
                id: user.id, 
                nama: user.nama, 
                username: user.username,
                email: user.email, 
                divisi: user.divisi, 
                role: user.role,
                lokasi_id: user.lokasi_id,
                foto_profil: user.foto_profil || null 
            }
        });
    } catch (error) {
        console.error('Error saat login:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
    }
};

const ubahKataSandi = async (req, res) => {
    try {
        const { user_id, passwordLama, passwordBaru } = req.body;

        const [users] = await pool.execute(`SELECT password FROM users WHERE id = ?`, [user_id]);
        if (users.length === 0) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });

        const user = users[0];
        let match = false;
        
        if (user.password.startsWith('$2')) {
            match = await bcrypt.compare(passwordLama, user.password);
        } else {
            match = (passwordLama === user.password);
        }

        if (!match) {
            return res.status(400).json({ success: false, message: 'Kata sandi lama salah!' });
        }

        const hashedBaru = await bcrypt.hash(passwordBaru, 10);
        await pool.execute(`UPDATE users SET password = ? WHERE id = ?`, [hashedBaru, user_id]);

        res.json({ success: true, message: 'Kata sandi berhasil diubah.' });

    } catch (error) {
        console.error('Error ubah password:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
    }
};

// 🔥 UPDATE REGISTER 🔥
const register = async (req, res) => {
    try {
        // Ambil data (termasuk username dan lokasi_id)
        const { nama, username, email, password, lokasi_id } = req.body;

        // Cek apakah username sudah ada
        const [existingUser] = await pool.execute('SELECT id FROM users WHERE username = ?', [username]);
        if (existingUser.length > 0) {
            return res.status(400).json({ success: false, message: 'Username sudah digunakan. Gunakan username lain!' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Finalisasi data (email bisa null, lokasi default 1)
        const finalEmail = email || null;
        const finalLokasiId = lokasi_id || 1;

        const insertQuery = `INSERT INTO users (nama, username, email, password, role, status, lokasi_id) VALUES (?, ?, ?, ?, 'magang', 'pending', ?)`;
        await pool.execute(insertQuery, [nama, username, finalEmail, hashedPassword, finalLokasiId]);

        res.status(201).json({ 
            success: true, 
            message: 'Registrasi berhasil! Akun Anda sedang menunggu persetujuan Admin.' 
        });

    } catch (error) {
        console.error('Error Register:', error);
        res.status(500).json({ success: false, message: 'Server error saat registrasi.' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { user_id, nama } = req.body;
        let url_foto_baru = null;

        if (req.file) {
            const uploadToCloudinary = (fileBuffer) => {
                return new Promise((resolve, reject) => {
                    let stream = cloudinary.uploader.upload_stream(
                        { 
                            folder: "absensi_magang/profile",
                            transformation: [
                                { width: 500, height: 500, crop: "fill", gravity: "face" },
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
            url_foto_baru = resultUpload.secure_url;
        }

        const [existingUsers] = await pool.execute('SELECT * FROM users WHERE id = ?', [user_id]);
        if (existingUsers.length === 0) {
            return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
        }
        const oldUser = existingUsers[0];

        const finalNama = nama || oldUser.nama;
        const finalFoto = url_foto_baru || oldUser.foto_profil;

        const updateQuery = `UPDATE users SET nama = ?, foto_profil = ? WHERE id = ?`;
        await pool.execute(updateQuery, [finalNama, finalFoto, user_id]);

        res.json({
            success: true,
            message: 'Profil berhasil diperbarui!',
            user: {
                id: oldUser.id,
                nama: finalNama,
                username: oldUser.username,
                email: oldUser.email,
                divisi: oldUser.divisi,
                role: oldUser.role,
                foto_profil: finalFoto
            }
        });

    } catch (error) {
        console.error('Error updateProfile:', error);
        res.status(500).json({ success: false, message: 'Gagal memperbarui profil.' });
    }
};

module.exports = { login, ubahKataSandi, register, updateProfile };