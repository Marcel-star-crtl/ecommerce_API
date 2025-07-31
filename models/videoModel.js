const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    thumbnail: {
        type: String, 
        required: true,
    },
    videoUrl: {
        type: String, 
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
        type: String, 
    },
}, {
    timestamps: true, 
});

module.exports = mongoose.model('Video', videoSchema);