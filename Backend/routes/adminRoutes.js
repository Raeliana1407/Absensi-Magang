const express = require('express');
const router = express.Router();
// Import fungsi yang baru kita buat
const { getAllUsers, updateUser, getSettings, updateSettings } = require('../controllers/adminController');

// Endpoint Users
router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);

// Endpoint Settings (Geofence & Jam Kerja)
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

module.exports = router;