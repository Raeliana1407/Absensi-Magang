const pool = require('../config/db');

// ==========================================
// 1. Fungsi Mengambil Daftar Anak Bimbingan
// ==========================================
const getAnakBimbingan = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT id, nama, email, divisi, status, created_at 
            FROM users 
            WHERE pembimbing_id = ? AND role = 'magang'
            ORDER BY nama ASC
        `;
        const [rows] = await pool.execute(query, [id]);
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

        // 1. Tarik info profil
        const [userInfo] = await pool.execute('SELECT nama, divisi, email FROM users WHERE id = ?', [id]);
        if (userInfo.length === 0) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });

        // 2. Tarik riwayat Absensi
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

        // 3. Tarik riwayat Logbook
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
// 4. Fungsi Mengambil Status Absen Hari Ini (Untuk Dashboard)
// ==========================================
const getDashboardHariIni = async (req, res) => {
    try {
        const { pembimbing_id } = req.params;

        // 🔥 PERBAIKAN 1: Tambahkan 'foto_profil' di query users 🔥
        const queryUsers = `SELECT id, nama, divisi, foto_profil FROM users WHERE pembimbing_id = ? AND role = 'magang' ORDER BY nama ASC`;
        const [users] = await pool.execute(queryUsers, [pembimbing_id]);

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

        // 🔥 PERBAIKAN 2: Ambil 'nama_lokasi' dari tabel settings 🔥
        const querySettings = `SELECT nama_lokasi FROM settings LIMIT 1`;
        const [settings] = await pool.execute(querySettings);
        
        // Kalau data nama_lokasi kosong di DB, kasih nilai fallback sementara
        const namaLokasiUtama = settings.length > 0 && settings[0].nama_lokasi 
            ? settings[0].nama_lokasi 
            : 'Kantor Pusat / HQ';

        const bimbinganList = users.map(u => {
            const absenHariIni = absen.find(a => a.user_id === u.id);
            const izinHariIni = izin.find(i => i.user_id === u.id);

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
                
                // 🔥 PERBAIKAN 3: Gunakan nama lokasi dinamis dari DB 🔥
                loc = namaLokasiUtama; 
                geo = 'In Geofence';
                activity = 'Sedang Aktif Bekerja'; 
            }

            return {
                id: u.id,
                name: u.nama,
                nim: `EMP-${String(u.id).padStart(5, '0')}`,
                role: u.divisi || 'Intern',
                time: time,
                timeStatus: timeStatus,
                loc: loc,
                geo: geo,
                activity: activity,
                status: status, 
                img: u.nama.substring(0, 2).toUpperCase(),
                // 🔥 PERBAIKAN 4: Kirim foto profil ke Frontend 🔥
                foto_profil: u.foto_profil 
            };
        });

        res.json({ success: true, data: bimbinganList });
    } catch (error) {
        console.error('Error getDashboardHariIni:', error);
        res.status(500).json({ success: false, message: 'Server error memuat dashboard.' });
    }
};

// ==========================================
// 5. EXPORT SEMUA FUNGSI
// ==========================================
module.exports = { getAnakBimbingan, getDetailMahasiswa, getDashboardHariIni };