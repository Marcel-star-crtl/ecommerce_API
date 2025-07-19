const asyncHandler = require('express-async-handler');
const Video = require('../models/videoModel');

// Create a new video
const createVideo = asyncHandler(async (req, res) => {
    try {
        const newVideo = await Video.create(req.body);
        res.json(newVideo);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all videos
const getAllVideos = asyncHandler(async (req, res) => {
    try {
        const videos = await Video.find();
        res.json(videos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


module.exports = {
    createVideo,
    getAllVideos,
};