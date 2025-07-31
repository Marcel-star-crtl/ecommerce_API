const express = require('express');
const { createVideo, getAllVideos } = require('../controller/videoCtrl'); 
// const { authMiddleware, isAdmin } = require('../middlewares/authMiddleware'); 

const router = express.Router();

// router.post('/', authMiddleware, isAdmin, createVideo);
router.post('/', createVideo); 
router.get('/', getAllVideos);

module.exports = router;