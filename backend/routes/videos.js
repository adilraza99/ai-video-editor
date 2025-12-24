import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { protect } from '../middleware/auth.js';
import Video from '../models/Video.js';
import Project from '../models/Project.js';
import { config } from '../config/config.js';
import videoProcessingService from '../services/videoProcessingService.js';
import fs from 'fs';

const router = express.Router();

// Configure multer for video uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(config.uploadDir, 'videos');

        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    // Accept video files only
    const allowedTypes = /mp4|mov|avi|wmv|flv|mkv|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype.startsWith('video/');

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Only video files are allowed'));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: config.maxFileSize
    }
});

// @route   POST /api/videos/upload
// @desc    Upload a video
// @access  Private
router.post('/upload', protect, upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a video file'
            });
        }

        // Generate thumbnail from video
        let thumbnailUrl = null;
        try {
            const thumbnailFilename = `${uuidv4()}.jpg`;
            const thumbnailDir = path.join(config.uploadDir, 'thumbnails');

            // Create thumbnails directory if it doesn't exist
            if (!fs.existsSync(thumbnailDir)) {
                fs.mkdirSync(thumbnailDir, { recursive: true });
            }

            const thumbnailPath = path.join(thumbnailDir, thumbnailFilename);
            await videoProcessingService.generateThumbnail(req.file.path, thumbnailPath);
            thumbnailUrl = `/uploads/thumbnails/${thumbnailFilename}`;
            console.log('Thumbnail generated:', thumbnailUrl);
        } catch (error) {
            console.error('Failed to generate thumbnail:', error);
            // Continue without thumbnail if generation fails
        }

        // Create video record
        const video = await Video.create({
            user: req.user._id,
            project: req.body.projectId || null,
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
            url: `/uploads/videos/${req.file.filename}`,
            thumbnail: thumbnailUrl
        });

        // Update project with video info and thumbnail if projectId is provided
        if (req.body.projectId) {
            const updateData = {
                $push: { 'timeline.tracks.video': { url: video.url, filename: video.filename } },
                status: 'draft'
            };

            // Set project thumbnail if this is the first video or if thumbnail was generated
            if (thumbnailUrl) {
                updateData.thumbnail = thumbnailUrl;
            }

            await Project.findByIdAndUpdate(req.body.projectId, updateData);
        }

        res.status(201).json({
            success: true,
            data: video
        });
    } catch (error) {
        console.error('Video upload error:', error);

        // Delete file if database operation failed
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            message: 'Failed to upload video'
        });
    }
});

// @route   GET /api/videos
// @desc    Get all videos for user
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const videos = await Video.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .populate('project', 'name');

        res.json({
            success: true,
            count: videos.length,
            data: videos
        });
    } catch (error) {
        console.error('Get videos error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch videos'
        });
    }
});

// @route   GET /api/videos/:id
// @desc    Get single video
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const video = await Video.findById(req.params.id).populate('project', 'name');

        if (!video) {
            return res.status(404).json({
                success: false,
                message: 'Video not found'
            });
        }

        // Check ownership
        if (video.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this video'
            });
        }

        res.json({
            success: true,
            data: video
        });
    } catch (error) {
        console.error('Get video error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch video'
        });
    }
});

// @route   DELETE /api/videos/:id
// @desc    Delete a video
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);

        if (!video) {
            return res.status(404).json({
                success: false,
                message: 'Video not found'
            });
        }

        // Check ownership
        if (video.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this video'
            });
        }

        // Delete file from filesystem
        if (fs.existsSync(video.path)) {
            fs.unlinkSync(video.path);
        }

        await video.deleteOne();

        res.json({
            success: true,
            message: 'Video deleted successfully'
        });
    } catch (error) {
        console.error('Delete video error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete video'
        });
    }
});

export default router;
