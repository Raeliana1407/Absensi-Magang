const pool = require('../config/db');

const getRekapBulanan = async (req, res) => {
    try {
        const { pembimbing_id } = req.params; 
        const role = req.user?.role || req.query.role; // 🔥 Tangkap role
        const bulan = req.query.bulan || new Date().getMonth() + 1;
        const tahun = req.query.tahun || new Date().getFullYear();

        let queryUsers = '';
        let paramsUsers = [];

        if (role === 'admin') {
            queryUsers = `SELECT id, nama FROM users WHERE role = 'magang'`;
        } else {
            queryUsers = `SELECT id, nama FROM users WHERE pembimbing_id = ? AND role = 'magang'`;
            paramsUsers = [pembimbing_id];
        }

        const [users] = await pool.execute(queryUsers, paramsUsers);

        if (users.length === 0) return res.json({ success: true, data: [] });

        const userIds = users.map(u => u.id);
        const placeholders = userIds.map(() => '?').join(',');

        const queryAbsen = `
            SELECT user_id, status 
            FROM absensi 
            WHERE jenis_absen = 'masuk' 
            AND MONTH(waktu_absen) = ? AND YEAR(waktu_absen) = ?
            AND user_id IN (${placeholders})
        `;
        const [absensi] = await pool.execute(queryAbsen, [bulan, tahun, ...userIds]);

        const queryIzin = `
            SELECT user_id, tanggal_mulai, tanggal_selesai 
            FROM pengajuan_izin 
            WHERE status = 'disetujui' 
            AND MONTH(tanggal_mulai) = ? AND YEAR(tanggal_mulai) = ?
            AND user_id IN (${placeholders})
        `;
        const [izin] = await pool.execute(queryIzin, [bulan, tahun, ...userIds]);

        const totalHariKerja = 22;
        
        const rekap = users.map(user => {
            const userAbsen = absensi.filter(a => a.user_id === user.id);
            const userIzin = izin.filter(i => i.user_id === user.id);

            const tepat = userAbsen.filter(a => a.status === 'hadir').length;
            const telat = userAbsen.filter(a => a.status === 'terlambat').length;
            const totalHadir = tepat + telat;
            
            let totalIzinHari = 0;
            userIzin.forEach(i => {
                const t1 = new Date(i.tanggal_mulai);
                const t2 = new Date(i.tanggal_selesai || i.tanggal_mulai);
                const diffDays = Math.ceil(Math.abs(t2 - t1) / (1000 * 60 * 60 * 24)) + 1; 
                totalIzinHari += diffDays;
            });

            const persentase = totalHariKerja > 0 ? Math.round((totalHadir / totalHariKerja) * 100) : 0;
            const jamBimbingan = totalHadir * 8; 

            let nilai = 'E';
            if(persentase >= 90) nilai = 'A';
            else if(persentase >= 80) nilai = 'B';
            else if(persentase >= 70) nilai = 'C';
            else if(persentase >= 60) nilai = 'D';

            return {
                id: user.id,
                name: user.nama,
                nim: `EMP-${String(user.id).padStart(5, '0')}`, 
                hadir: `${totalHadir}/${totalHariKerja}`,
                persentase: persentase,
                tepat: tepat,
                telat: telat,
                izin: totalIzinHari,
                jam: jamBimbingan,
                nilai: nilai,
                status: persentase >= 80 ? 'Siap Cetak' : 'Perlu Catatan',
                img: user.nama.substring(0, 2).toUpperCase()
            };
        });

        res.json({ success: true, data: rekap });
    } catch (error) {
        console.error('Error getRekapBulanan:', error);
        res.status(500).json({ success: false, message: 'Gagal memuat laporan.' });
    }
};

module.exports = { getRekapBulanan };