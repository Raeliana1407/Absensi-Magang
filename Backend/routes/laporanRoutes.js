const express = require('express');
const router = express.Router();
const { getRekapBulanan } = require('../controllers/laporanController');

// Tambahkan :pembimbing_id sebagai parameter URL
router.get('/rekap/:pembimbing_id', getRekapBulanan);

module.exports = router;