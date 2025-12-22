import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        default: null
    },
    filename: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    mimeType: {
        type: String,
        required: true
    },
    size: {
        type: Number, // in bytes
        required: true
    },
    duration: {
        type: Number, // in seconds
        default: 0
    },
    path: {
        type: String,
        required: true
    },
    url: {
        type: String,
        default: null
    },
    thumbnail: {
        type: String,
        default: null
    },
    metadata: {
        width: { type: Number, default: 0 },
        height: { type: Number, default: 0 },
        frameRate: { type: Number, default: 0 },
        codec: { type: String, default: null },
        bitrate: { type: Number, default: 0 }
    },
    transcription: {
        type: String,
        default: null
    },
    processing: {
        status: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed'],
            default: 'pending'
        },
        error: {
            type: String,
            default: null
        }
    }
}, {
    timestamps: true
});

const Video = mongoose.model('Video', videoSchema);

export default Video;
