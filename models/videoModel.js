const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    thumbnail: {
        type: String, // URL to the video thumbnail
        required: true,
    },
    videoUrl: {
        type: String, // URL to the actual video file or embed link
        required: true,
    },
    productName: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    avatar: {
        type: String, // URL to the creator's avatar image
    },
    // Add more fields as needed (e.g., creator's name, views, likes, date uploaded)
}, {
    timestamps: true, // Adds createdAt and updatedAt fields
});

module.exports = mongoose.model('Video', videoSchema);