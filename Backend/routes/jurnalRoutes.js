const express = require('express');
const router = express.Router();
const { tambahJurnal, getJurnalUser } = require('../controllers/jurnalController');

// Endpoint: POST https://absensi-magang-beta.vercel.app/api/jurnal
router.post('/', tambahJurnal);

// Endpoint: GET https://absensi-magang-beta.vercel.app/api/jurnal/:user_id
router.get('/:user_id', getJurnalUser);

module.exports = router;