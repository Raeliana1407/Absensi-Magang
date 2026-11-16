const pool = require('../config/db');

// ==========================================
// 1. Fungsi Mengambil Daftar Anak Bimbingan (Team)
// ==========================================
const getAnakBimbingan = async (req, res) => {
    try {
        const { id } = req.params;
        const role = req.user?.role || req.query.role; // Tangkap role

        let query = '';
        let params = [];

        if (role === 'admin') {
            // ADMIN: Tarik semua magang beserta lokasi ULP, kampus, dan periode magang
            query = `
                SELECT u.id, u.nama, u.username, u.email, u.divisi, u.universitas,
                       DATE_FORMAT(u.tgl_mulai, '%Y-%m-%d') AS tgl_mulai,
                       DATE_FORMAT(u.tgl_selesai, '%Y-%m-%d') AS tgl_selesai,
                       u.lokasi_id, s.nama_lokasi, u.status, u.foto_profil, u.created_at 
                FROM users u
                LEFT JOIN settings s ON u.lokasi_id = s.id
                WHERE u.role = 'magang'
                ORDER BY u.id ASC
            `;
        } else {
            // PEMBIMBING: Tarik anak asuh saja
            query = `
                SELECT u.id, u.nama, u.username, u.email, u.divisi, u.universitas,
                       DATE_FORMAT(u.tgl_mulai, '%Y-%m-%d') AS tgl_mulai,
                       DATE_FORMAT(u.tgl_selesai, '%Y-%m-%d') AS tgl_selesai,
                       u.lokasi_id, s.nama_lokasi, u.status, u.foto_profil, u.created_at 
                FROM users u
                LEFT JOIN settings s ON u.lokasi_id = s.id
                WHERE u.pembimbing_id = ? AND u.role = 'magang'
                ORDER BY u.id ASC
            `;
            params = [id];
        }

        const [rows] = await pool.execute(query, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error getAnakBimbingan:", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ==========================================
// 2. Fungsi Mengambil Detail Absen & Logbook
// ==========================================
const getDetailMahasiswa = async (req, res) => {
    try {
        const { id } = req.params;

        const [userInfo] = await pool.execute(`
            SELECT u.id, u.nama, u.username, u.divisi, u.email, u.universitas,
                   DATE_FORMAT(u.tgl_mulai, '%Y-%m-%d') AS tgl_mulai,
                   DATE_FORMAT(u.tgl_selesai, '%Y-%m-%d') AS tgl_selesai,
                   s.nama_lokasi, u.foto_profil
            FROM users u
            LEFT JOIN settings s ON u.lokasi_id = s.id
            WHERE u.id = ?
        `, [id]);
        
        if (userInfo.length === 0) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });

        let absen = [];
        try {
            const queryAbsen = `
                SELECT 
                    DATE(waktu_absen) AS tanggal,
                    MAX(CASE WHEN LOWER(jenis_absen) = 'masuk' THEN TIME(waktu_absen) END) AS jam_masuk,
                    MAX(CASE WHEN LOWER(jenis_absen) = 'pulang' THEN TIME(waktu_absen) END) AS jam_pulang,
                    MAX(status) AS status
                FROM absensi 
                WHERE user_id = ? 
                GROUP BY DATE(waktu_absen)
                ORDER BY tanggal DESC
            `;
            const [absenResult] = await pool.execute(queryAbsen, [id]);
            absen = absenResult;
        } catch (err) {
            console.error("Gagal menarik data absensi:", err.message);
        }

        let logbook = [];
        try {
            const queryLogbook = `
                SELECT 
                    DATE(created_at) AS tanggal, 
                    kegiatan, 
                    'Menunggu Review' AS status 
                FROM jurnal_logbook 
                WHERE user_id = ? 
                ORDER BY created_at DESC
            `;
            const [logbookResult] = await pool.execute(queryLogbook, [id]);
            logbook = logbookResult;
        } catch (err) {
            console.error("Gagal menarik data logbook:", err.message);
        }

        res.json({ 
            success: true, 
            data: {
                profil: userInfo[0],
                absen: absen,
                logbook: logbook
            }
        });
    } catch (error) {
        console.error("Fatal Error getDetailMahasiswa:", error.message);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

// ==========================================
// 3. Fungsi Khusus Pembimbing Ubah Tanggal Magang
// ==========================================
const updatePeriodeMagang = async (req, res) => {
    try {
        const { id } = req.params;
        const { tgl_mulai, tgl_selesai } = req.body;

        if (tgl_mulai && tgl_selesai && tgl_selesai < tgl_mulai) {
            return res.status(400).json({ 
                success: false, 
                message: 'Tanggal selesai magang tidak boleh lebih awal dari tanggal mulai!' 
            });
        }

        const finalMulai = tgl_mulai || null;
        const finalSelesai = tgl_selesai || null;

        const query = `UPDATE users SET tgl_mulai = ?, tgl_selesai = ? WHERE id = ? AND role = 'magang'`;
        const [result] = await pool.execute(query, [finalMulai, finalSelesai, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Data peserta magang tidak ditemukan.' });
        }

        res.json({ success: true, message: 'Periode magang berhasil diperbarui!' });
    } catch (error) {
        console.error('Error updatePeriodeMagang:', error);
        res.status(500).json({ success: false, message: 'Gagal memperbarui periode magang.' });
    }
};

// ==========================================
// 4. Fungsi Mengambil Status Absen Hari Ini (Dashboard)
// ==========================================
const getDashboardHariIni = async (req, res) => {
    try {
        const { pembimbing_id } = req.params;
        const role = req.user?.role || req.query.role; // Tangkap role

        let queryUsers = '';
        let queryParams = [];

        // Logika Mata Dewa Admin
        if (role === 'admin') {
            queryUsers = `SELECT id, nama, divisi, foto_profil, lokasi_id FROM users WHERE role = 'magang' ORDER BY id ASC`;
        } else {
            queryUsers = `SELECT id, nama, divisi, foto_profil, lokasi_id FROM users WHERE pembimbing_id = ? AND role = 'magang' ORDER BY id ASC`;
            queryParams = [pembimbing_id];
        }

        const [users] = await pool.execute(queryUsers, queryParams);

        if (users.length === 0) {
            return res.json({ success: true, data: [] });
        }

        const userIds = users.map(u => u.id);
        const placeholders = userIds.map(() => '?').join(',');

        const queryAbsen = `
            SELECT user_id, waktu_absen, status, latitude, longitude 
            FROM absensi 
            WHERE DATE(waktu_absen) = CURDATE() AND LOWER(jenis_absen) = 'masuk' 
            AND user_id IN (${placeholders})
        `;
        const [absen] = await pool.execute(queryAbsen, userIds);

        const queryIzin = `
            SELECT user_id, jenis_izin, keterangan 
            FROM pengajuan_izin 
            WHERE CURDATE() BETWEEN tanggal_mulai AND IFNULL(tanggal_selesai, tanggal_mulai) 
            AND status = 'disetujui' AND user_id IN (${placeholders})
        `;
        const [izin] = await pool.execute(queryIzin, userIds);

        // Ambil semua setting lokasi dari database untuk referensi
        const querySettings = `SELECT id, nama_lokasi FROM settings`;
        const [settings] = await pool.execute(querySettings);

        const bimbinganList = users.map(u => {
            const absenHariIni = absen.find(a => a.user_id === u.id);
            const izinHariIni = izin.find(i => i.user_id === u.id);
            
            // Tentukan nama lokasi berdasarkan lokasi_id user
            const userLokasi = settings.find(s => s.id === u.lokasi_id);
            const namaLokasiUtama = userLokasi ? userLokasi.nama_lokasi : 'Kantor Pusat / HQ';

            let status = 'belum_absen';
            let time = 'Belum Absen';
            let timeStatus = '-';
            let loc = 'Belum ada data lokasi';
            let geo = '-';
            let activity = 'Belum mulai beraktivitas';

            if (izinHariIni) {
                status = 'absent';
                timeStatus = `Status ${izinHariIni.jenis_izin.toUpperCase()}`;
                loc = 'Di Luar Jangkauan';
                geo = 'Izin Resmi (Sistem)';
                activity = izinHariIni.keterangan || 'Tanpa keterangan spesifik';
            } else if (absenHariIni) {
                status = absenHariIni.status === 'terlambat' ? 'late' : 'ontrack';
                
                const dateObj = new Date(absenHariIni.waktu_absen);
                time = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                
                timeStatus = absenHariIni.status === 'terlambat' ? 'Terlambat' : 'Tepat Waktu';
                
                loc = namaLokasiUtama; 
                geo = 'In Geofence';
                activity = 'Sedang Aktif Bekerja'; 
            }

            return {
                id: u.id,
                name: u.nama,
                nim: `EMP-${String(u.id).padStart(5, '0')}`,
                role: u.divisi || 'Intern',
                nama_lokasi: namaLokasiUtama,
                time: time,
                timeStatus: timeStatus,
                loc: loc,
                geo: geo,
                activity: activity,
                status: status, 
                img: u.nama.substring(0, 2).toUpperCase(),
                foto_profil: u.foto_profil 
            };
        });

        res.json({ success: true, data: bimbinganList });
    } catch (error) {
        console.error('Error getDashboardHariIni:', error);
        res.status(500).json({ success: false, message: 'Server error memuat dashboard.' });
    }
};

module.exports = { getAnakBimbingan, getDetailMahasiswa, updatePeriodeMagang, getDashboardHariIni };