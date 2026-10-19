const express = require('express');
const cors = require('cors');
require('dotenv').config();

const apiRoutes = require('./routes/apiRoutes');
const adminRoutes = require('./routes/adminRoutes');
const pembimbingRoutes = require('./routes/pembimbingRoutes');
const jurnalRoutes = require('./routes/jurnalRoutes');
const pengajuanRoutes = require('./routes/pengajuanRoutes');
const laporanRoutes = require('./routes/laporanRoutes');

const app = express();

// Middlewares Global
app.use(cors());
app.use(express.json());

// Pendaftaran Rute
app.use('/api', apiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pembimbing', pembimbingRoutes);
app.use('/api/jurnal', jurnalRoutes);
app.use('/api/pengajuan', pengajuanRoutes);
app.use('/uploads', express.static('public/uploads'));
app.use('/api/laporan', laporanRoutes);

// Route Utama (Biar tidak "Cannot GET /" di Vercel)
app.get('/', (req, res) => {
    res.send('API Backend ClockSync Berjalan Sempurna di Vercel! 🚀');
});

// Jalankan Server (Hanya untuk lokal, di Vercel diabaikan)
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server Backend berjalan super rapi di port ${PORT}`));
}

// WAJIB UNTUK VERCEL SERVERLESS
module.exports = app;