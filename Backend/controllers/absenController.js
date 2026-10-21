const pool = require('../config/db');

// --- MASTER HELPER: Pencipta Waktu WITA Anti-Badai ---
function getWitaTime() {
    const now = new Date();
    // Paksa ambil waktu mutlak UTC, lalu tambah 8 jam (WITA)
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const witaDate = new Date(utc + (3600000 * 8));

    const year = witaDate.getFullYear();
    const month = String(witaDate.getMonth() + 1).padStart(2, '0');
    const day = String(witaDate.getDate()).padStart(2, '0');
    const hour = String(witaDate.getHours()).padStart(2, '0');
    const minute = String(witaDate.getMinutes()).padStart(2, '0');
    const second = String(witaDate.getSeconds()).padStart(2, '0');

    return {
        // Dijamin 1.000.000% formatnya "YYYY-MM-DD"
        tanggal: `${year}-${month}-${day}`, 
        waktu: `${year}-${month}-${day} ${hour}:${minute}:${second}`,
        totalMenit: (witaDate.getHours() * 60) + witaDate.getMinutes()
    };
}

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
        const wita = getWitaTime();
        
        // JURUS ANTI-BADAI 1: Jangan pakai SQL WHERE Date. 
        // Tarik 5 data terakhir, lalu cek pakai fungsi Javascript (startsWith).
        const [existing] = await pool.execute(`
            SELECT id, jenis_absen, CAST(waktu_absen AS CHAR) as waktu_raw 
            FROM absensi 
            WHERE user_id = ? AND jenis_absen = ? 
            ORDER BY waktu_absen DESC LIMIT 5
        `, [user_id, jenis_absen]);
        
        const alreadyDoneToday = existing.some(row => row.waktu_raw && row.waktu_raw.startsWith(wita.tanggal));
        
        if (alreadyDoneToday) {
            return res.status(400).json({ success: false, message: `Aksi ${jenis_absen} sudah dilakukan hari ini.` });
        }

        const [settingsRows] = await pool.execute('SELECT * FROM settings LIMIT 1');
        if (settingsRows.length === 0) return res.status(500).json({ success: false, message: 'Admin belum mengatur konfigurasi sistem!' });
        
        const settings = settingsRows[0];
        const distance = calculateDistance(parseFloat(settings.latitude), parseFloat(settings.longitude), latitude, longitude);

        let statusAbsen = 'hadir'; 
        let isSuccess = true;
        let responseMessage = 'Berhasil dicatat.';

        if (distance > parseInt(settings.radius)) {
            statusAbsen = 'luar_radius';
            isSuccess = false;
            responseMessage = `Gagal: Luar radius. Jarak: ${Math.round(distance)}m`;
        } else if (jenis_absen === 'masuk') {
            const [jamM, menitM] = settings.jam_masuk.split(':');
            const batasMasukMinutes = (parseInt(jamM) * 60) + parseInt(menitM);
            
            if (wita.totalMenit > batasMasukMinutes) {
                statusAbsen = 'terlambat';
                responseMessage = `Clock In berhasil (Terlambat). Jarak: ${Math.round(distance)}m`;
            } else {
                statusAbsen = 'hadir';
                responseMessage = `Clock In berhasil (Tepat Waktu). Jarak: ${Math.round(distance)}m`;
            }
        } else if (jenis_absen === 'pulang') {
            const [jamP, menitP] = settings.jam_pulang.split(':');
            const batasPulangMinutes = (parseInt(jamP) * 60) + parseInt(menitP);
            
            if (wita.totalMenit < batasPulangMinutes) {
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

        await pool.execute(
            `INSERT INTO absensi (user_id, jenis_absen, waktu_absen, latitude, longitude, status) VALUES (?, ?, ?, ?, ?, ?)`, 
            [user_id, jenis_absen, wita.waktu, latitude, longitude, statusAbsen]
        );

        if (!isSuccess) return res.status(400).json({ success: false, message: responseMessage });
        res.json({ success: true, message: responseMessage });
    } catch (error) {
        console.error('Error Absen:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan SQL saat memproses absen.' });
    }
};

// 2. Mengambil Riwayat Absen
const getRiwayat = async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT id, jenis_absen, 
            DATE_FORMAT(waktu_absen, '%Y-%m-%dT%H:%i:%s') as waktu_absen, 
            status 
            FROM absensi 
            WHERE user_id = ? 
            ORDER BY waktu_absen DESC
        `, [req.params.user_id]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal mengambil riwayat.' });
    }
};

// 3. Mengecek Status Absen Hari Ini
const cekStatusHariIni = async (req, res) => {
    try {
        const wita = getWitaTime();
        const [settingsRows] = await pool.execute('SELECT jam_masuk, jam_pulang FROM settings LIMIT 1');
        const jadwal = settingsRows.length > 0 ? settingsRows[0] : { jam_masuk: '08:00:00', jam_pulang: '16:00:00' };

        // JURUS ANTI-BADAI 2: Ambil 15 log terakhir saja, JANGAN pakai filter tanggal di SQL.
        const [rows] = await pool.execute(`
            SELECT id, jenis_absen, 
            CAST(waktu_absen AS CHAR) as waktu_raw,
            DATE_FORMAT(waktu_absen, '%Y-%m-%dT%H:%i:%s') as waktu_absen, 
            status 
            FROM absensi 
            WHERE user_id = ? 
            ORDER BY waktu_absen DESC 
            LIMIT 15
        `, [req.params.id]);

        // Biarkan Javascript yang memfilter teks tanggalnya secara murni. (Pasti akurat!)
        const todayLogsDesc = rows.filter(row => row.waktu_raw && row.waktu_raw.startsWith(wita.tanggal));
        const todayLogsAsc = todayLogsDesc.reverse(); // Balik jadi urutan lama -> baru untuk tampilan UI

        if (todayLogsAsc.length === 0) {
            return res.json({ success: true, shiftPhase: 'idle', data: [], jadwal: jadwal });
        }

        const lastLog = todayLogsAsc[todayLogsAsc.length - 1];
        let currentPhase = 'idle';
        if (lastLog.jenis_absen === 'masuk' || lastLog.jenis_absen === 'istirahat_masuk') {
            currentPhase = 'working';
        } else if (lastLog.jenis_absen === 'istirahat_keluar') {
            currentPhase = 'break';
        } else if (lastLog.jenis_absen === 'pulang') {
            currentPhase = 'completed';
        }

        res.json({ success: true, shiftPhase: currentPhase, data: todayLogsAsc, jadwal: jadwal });
    } catch (error) {
        console.error('Error cek status:', error);
        res.status(500).json({ success: false, message: 'Gagal mengecek status hari ini.' });
    }
};

module.exports = { clockIn, getRiwayat, cekStatusHariIni };