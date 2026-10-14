const express = require('express');
const router = express.Router();
const { tambahJurnal, getJurnalUser } = require('../controllers/jurnalController');

// Endpoint: POST http://localhost:3000/api/jurnal
router.post('/', tambahJurnal);

// Endpoint: GET http://localhost:3000/api/jurnal/:user_id
router.get('/:user_id', getJurnalUser);

module.exports = router;