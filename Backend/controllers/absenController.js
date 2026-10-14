const pool = require('../config/db');

// Fungsi Menghitung Jarak (Formula Haversine) - Tetap dipertahankan
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Radius bumi dalam meter
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
              Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; 
}

// 1. Mencatat Absen (Masuk / Pulang / Istirahat)
const clockIn = async (req, res) => {
    try {
        const { user_id, latitude, longitude, jenis_absen } = req.body;
        
        // --- 1. Cek apakah user sudah absen hari ini ---
        const checkQuery = `SELECT id FROM absensi WHERE user_id = ? AND jenis_absen = ? AND DATE(waktu_absen) = CURDATE()`;
        const [existing] = await pool.execute(checkQuery, [user_id, jenis_absen]);
        
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: `Aksi ${jenis_absen} sudah dilakukan hari ini.` });
        }

        // --- 2. AMBIL PENGATURAN DINAMIS DARI DATABASE ---
        // Di sinilah keajaibannya terjadi! Kita tidak lagi pakai hardcode.
        const [settingsRows] = await pool.execute('SELECT * FROM settings LIMIT 1');
        
        if (settingsRows.length === 0) {
             return res.status(500).json({ success: false, message: 'Admin belum mengatur konfigurasi sistem (Geofence & Jam)!' });
        }
        
        const settings = settingsRows[0];
        const KANTOR_LAT = parseFloat(settings.latitude);
        const KANTOR_LNG = parseFloat(settings.longitude);
        const RADIUS_MAKSIMAL = parseInt(settings.radius);

        // --- 3. Hitung jarak dan siapkan waktu ---
        const distance = calculateDistance(KANTOR_LAT, KANTOR_LNG, latitude, longitude);
        // --- PERBAIKAN: PAKSA AMBIL WAKTU ZONA WITA (Asia/Makassar) ---
        const now = new Date();
        
        // Menggunakan Intl.DateTimeFormat untuk memastikan akurat di zona waktu WITA
        const options = { 
            timeZone: 'Asia/Makassar',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        };
        
        const formatter = new Intl.DateTimeFormat('en-CA', options); // 'en-CA' menghasilkan format YYYY-MM-DD
        const parts = formatter.formatToParts(now);
        
        let year, month, day, hour, minute, second;
        parts.forEach(p => {
            if (p.type === 'year') year = p.value;
            if (p.type === 'month') month = p.value;
            if (p.type === 'day') day = p.value;
            if (p.type === 'hour') hour = p.value;
            if (p.type === 'minute') minute = p.value;
            if (p.type === 'second') second = p.value;
        });

        const waktu_absen = `${year}-${month}-${day} ${hour}:${minute}:${second}`;

        let statusAbsen = 'hadir'; 
        let isSuccess = true;
        let responseMessage = 'Berhasil dicatat.';

        // --- 4. Logika Validasi Jarak & Waktu (Dinamis) ---
        if (distance > RADIUS_MAKSIMAL) {
            statusAbsen = 'luar_radius';
            isSuccess = false;
            responseMessage = `Gagal: Berada di luar zona radius. Jarak Anda: ${Math.round(distance)}m (Max: ${RADIUS_MAKSIMAL}m)`;
        } else if (jenis_absen === 'masuk') {
            // Ambil jam masuk dari database (contoh: "09:00:00")
            const jamMasukDB = settings.jam_masuk; 
            const [jamM, menitM] = jamMasukDB.split(':');
            
            const shiftStart = new Date();
            shiftStart.setHours(parseInt(jamM), parseInt(menitM), 0, 0); 
            
            if (now > shiftStart) {
                statusAbsen = 'terlambat';
                responseMessage = `Clock In berhasil (Terlambat). Jarak: ${Math.round(distance)}m`;
            } else {
                statusAbsen = 'hadir';
                responseMessage = `Clock In berhasil (Tepat Waktu). Jarak: ${Math.round(distance)}m`;
            }
        } else {
            statusAbsen = 'hadir';
            responseMessage = `Aksi ${jenis_absen} berhasil dicatat. Jarak: ${Math.round(distance)}m`;
        }

        // --- 5. Simpan ke Database ---
        const query = `INSERT INTO absensi (user_id, jenis_absen, waktu_absen, latitude, longitude, status) VALUES (?, ?, ?, ?, ?, ?)`;
        await pool.execute(query, [user_id, jenis_absen, waktu_absen, latitude, longitude, statusAbsen]);

        if (!isSuccess) {
            return res.status(400).json({ success: false, message: responseMessage });
        }
        
        res.json({ success: true, message: responseMessage });
    } catch (error) {
        console.error('Error Absen:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan SQL saat memproses absen.' });
    }
};

// 2. Mengambil Riwayat Absen
const getRiwayat = async (req, res) => {
    try {
        const userId = req.params.user_id;
        const query = `SELECT id, jenis_absen, waktu_absen, status FROM absensi WHERE user_id = ? ORDER BY waktu_absen DESC`;
        const [rows] = await pool.execute(query, [userId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error getRiwayat:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data riwayat.' });
    }
};

// 3. Mengecek Status Absen Hari Ini
const cekStatusHariIni = async (req, res) => {
    try {
        const { id } = req.params; 

        const query = `
            SELECT * FROM absensi 
            WHERE user_id = ? AND DATE(waktu_absen) = CURDATE() 
            ORDER BY waktu_absen ASC
        `;
        const [rows] = await pool.execute(query, [id]);

        if (rows.length === 0) {
            return res.json({ 
                success: true, 
                shiftPhase: 'idle', 
                data: [] 
            });
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

        res.json({ 
            success: true, 
            shiftPhase: currentPhase, 
            data: rows 
        });

    } catch (error) {
        console.error('Error cek status:', error);
        res.status(500).json({ success: false, message: 'Gagal mengecek status hari ini.' });
    }
};

module.exports = { clockIn, getRiwayat, cekStatusHariIni };