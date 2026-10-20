const pool = require('../config/db');

// Fungsi Menghitung Jarak
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; 
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
              Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; 
}

// 1. Mencatat Absen
const clockIn = async (req, res) => {
    try {
        const { user_id, latitude, longitude, jenis_absen } = req.body;
        
        // Ambil tanggal WITA hari ini untuk validasi
        const todayWITA = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Makassar' }).format(new Date());
        
        const checkQuery = `SELECT id FROM absensi WHERE user_id = ? AND jenis_absen = ? AND DATE(waktu_absen) = ?`;
        const [existing] = await pool.execute(checkQuery, [user_id, jenis_absen, todayWITA]);
        
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: `Aksi ${jenis_absen} sudah dilakukan hari ini.` });
        }

        const [settingsRows] = await pool.execute('SELECT * FROM settings LIMIT 1');
        if (settingsRows.length === 0) {
             return res.status(500).json({ success: false, message: 'Admin belum mengatur konfigurasi sistem!' });
        }
        
        const settings = settingsRows[0];
        const KANTOR_LAT = parseFloat(settings.latitude);
        const KANTOR_LNG = parseFloat(settings.longitude);
        const RADIUS_MAKSIMAL = parseInt(settings.radius);

        const distance = calculateDistance(KANTOR_LAT, KANTOR_LNG, latitude, longitude);
        
        // Bentuk Waktu WITA yang absolut
        const now = new Date();
        const options = { 
            timeZone: 'Asia/Makassar', year: 'numeric', month: '2-digit', 
            day: '2-digit', hour: '2-digit', minute: '2-digit', 
            second: '2-digit', hour12: false // Memaksa format 24 jam agar 1 PM jadi 13:00
        };
        const formatter = new Intl.DateTimeFormat('en-CA', options); 
        const parts = formatter.formatToParts(now);
        
        let year, month, day, hour, minute, second;
        parts.forEach(p => {
            if (p.type === 'year') year = p.value;
            if (p.type === 'month') month = p.value;
            if (p.type === 'day') day = p.value;
            if (p.type === 'hour') hour = p.value === '24' ? '00' : p.value;
            if (p.type === 'minute') minute = p.value;
            if (p.type === 'second') second = p.value;
        });

        const waktu_absen = `${year}-${month}-${day} ${hour}:${minute}:${second}`;
        
        // Logika Validasi Waktu Berdasarkan Menit (Anti Zona Waktu Vercel)
        const currentTotalMinutes = (parseInt(hour) * 60) + parseInt(minute);

        let statusAbsen = 'hadir'; 
        let isSuccess = true;
        let responseMessage = 'Berhasil dicatat.';

        if (distance > RADIUS_MAKSIMAL) {
            statusAbsen = 'luar_radius';
            isSuccess = false;
            responseMessage = `Gagal: Luar radius. Jarak: ${Math.round(distance)}m`;
        } else if (jenis_absen === 'masuk') {
            const jamMasukDB = settings.jam_masuk; 
            const [jamM, menitM] = jamMasukDB.split(':');
            const batasMasukMinutes = (parseInt(jamM) * 60) + parseInt(menitM);
            
            if (currentTotalMinutes > batasMasukMinutes) {
                statusAbsen = 'terlambat';
                responseMessage = `Clock In berhasil (Terlambat). Jarak: ${Math.round(distance)}m`;
            } else {
                statusAbsen = 'hadir';
                responseMessage = `Clock In berhasil (Tepat Waktu). Jarak: ${Math.round(distance)}m`;
            }
        } else if (jenis_absen === 'pulang') {
            const jamPulangDB = settings.jam_pulang; 
            const [jamP, menitP] = jamPulangDB.split(':');
            const batasPulangMinutes = (parseInt(jamP) * 60) + parseInt(menitP);
            
            if (currentTotalMinutes < batasPulangMinutes) {
                statusAbsen = 'hadir'; 
                responseMessage = `Clock Out berhasil (Pulang Lebih Awal). Jarak: ${Math.round(distance)}m`;
            } else {
                statusAbsen = 'hadir';
                responseMessage = `Clock Out berhasil (Selesai Shift). Jarak: ${Math.round(distance)}m`;
            }
        } else {
            statusAbsen = 'hadir';
            responseMessage = `Aksi ${jenis_absen} berhasil dicatat. Jarak: ${Math.round(distance)}m`;
        }

        const query = `INSERT INTO absensi (user_id, jenis_absen, waktu_absen, latitude, longitude, status) VALUES (?, ?, ?, ?, ?, ?)`;
        await pool.execute(query, [user_id, jenis_absen, waktu_absen, latitude, longitude, statusAbsen]);

        if (!isSuccess) return res.status(400).json({ success: false, message: responseMessage });
        res.json({ success: true, message: responseMessage });
    } catch (error) {
        console.error('Error Absen:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan SQL saat memproses absen.' });
    }
};

// 2. Mengambil Riwayat Absen (Format Kaku agar jam tidak diubah Vercel)
const getRiwayat = async (req, res) => {
    try {
        const userId = req.params.user_id;
        const query = `
            SELECT id, jenis_absen, 
            DATE_FORMAT(waktu_absen, '%Y-%m-%dT%H:%i:%s') as waktu_absen, 
            status 
            FROM absensi 
            WHERE user_id = ? 
            ORDER BY waktu_absen DESC
        `;
        const [rows] = await pool.execute(query, [userId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error getRiwayat:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data riwayat.' });
    }
};

// 3. Mengecek Status Absen Hari Ini (Sekarang mengirimkan Settings Jam Kerja)
const cekStatusHariIni = async (req, res) => {
    try {
        const { id } = req.params; 
        const todayWITA = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Makassar' }).format(new Date());

        // --- TAMBAHAN MISI 2: Ambil Setting Jam dari DB ---
        const [settingsRows] = await pool.execute('SELECT jam_masuk, jam_pulang FROM settings LIMIT 1');
        const jadwal = settingsRows.length > 0 ? settingsRows[0] : { jam_masuk: '08:00:00', jam_pulang: '16:00:00' };

        const query = `
            SELECT id, jenis_absen, 
            DATE_FORMAT(waktu_absen, '%Y-%m-%dT%H:%i:%s') as waktu_absen, 
            status 
            FROM absensi 
            WHERE user_id = ? AND DATE(waktu_absen) = ? 
            ORDER BY waktu_absen ASC
        `;
        const [rows] = await pool.execute(query, [id, todayWITA]);

        if (rows.length === 0) {
            // Selipkan jadwal di response
            return res.json({ success: true, shiftPhase: 'idle', data: [], jadwal: jadwal });
        }

        const lastLog = rows[rows.length - 1];
        let currentPhase = 'idle';
        
        if (lastLog.jenis_absen === 'masuk' || lastLog.jenis_absen === 'istirahat_masuk') {
            currentPhase = 'working';
        } else if (lastLog.jenis_absen === 'istirahat_keluar') {
            currentPhase = 'break';
        } else if (lastLog.jenis_absen === 'pulang') {
            currentPhase = 'completed';
        }

        // Selipkan jadwal di response
        res.json({ success: true, shiftPhase: currentPhase, data: rows, jadwal: jadwal });
    } catch (error) {
        console.error('Error cek status:', error);
        res.status(500).json({ success: false, message: 'Gagal mengecek status hari ini.' });
    }
};

module.exports = { clockIn, getRiwayat, cekStatusHariIni };