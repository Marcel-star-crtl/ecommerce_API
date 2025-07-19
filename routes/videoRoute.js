const express = require('express');
const { createVideo, getAllVideos } = require('../controller/videoCtrl'); // Adjust path
// const { authMiddleware, isAdmin } = require('../middlewares/authMiddleware'); // If you want to secure these routes

const router = express.Router();

// router.post('/', authMiddleware, isAdmin, createVideo); // Example secured route
router.post('/', createVideo); // For testing, you might not secure it initially
router.get('/', getAllVideos);

module.exports = router;