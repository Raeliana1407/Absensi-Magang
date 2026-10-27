const express = require('express');
const router = express.Router();
// Import fungsi yang baru kita buat, pastikan deleteUser ikut di-import
const { getAllUsers, updateUser, deleteUser, getSettings, updateSettings } = require('../controllers/adminController');

// Endpoint Users
router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser); // <-- Endpoint Hapus User

// Endpoint Settings (Geofence & Jam Kerja)
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

module.exports = router;