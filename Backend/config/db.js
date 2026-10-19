const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 18282, // Pastikan port Aiven (18282) masuk di sini
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    connectTimeout: 60000, // Beri waktu tunggu hingga 60 detik khusus untuk Vercel!
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = pool;