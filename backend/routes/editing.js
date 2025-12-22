import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { protect } from '../middleware/auth.js';
import Project from '../models/Project.js';
import Video from '../models/Video.js';
import videoProcessingService from '../services/videoProcessingService.js';
import voiceoverService from '../services/voiceoverService.js';
import captionService from '../services/captionService.js';
import translationService from '../services/translationService.js';
import audioService from '../services/audioService.js';
import scriptGenerationService from '../services/scriptGenerationService.js';
import { config } from '../config/config.js';

const router = express.Router();

// Configure multer for audio uploads
const upload = multer({
    dest: path.join(config.uploadDir, 'temp'),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// @route   POST /api/editing/voiceover
// @desc    Generate voiceover for project
// @access  Private
router.post('/voiceover', protect, async (req, res) => {
    try {
        const { projectId, text, tone } = req.body;  // Changed from voice/language to tone

        const project = await Project.findById(projectId);
        if (!project || project.user.toString() !== req.user._id.toString()) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Generate voiceover audio with tone (male, female, child)
        const audioOutputPath = path.join(config.uploadDir, 'audio', `voiceover-${uuidv4()}.mp3`);

        // Ensure audio directory exists
        if (!fs.existsSync(path.dirname(audioOutputPath))) {
            fs.mkdirSync(path.dirname(audioOutputPath), { recursive: true });
        }

        console.log('Generating voiceover audio with tone:', tone);
        console.log('Script text (first 100 chars):', text.substring(0, 100) + '...');
        console.log('Full script length:', text.length, 'characters');
        const voiceoverPath = await voiceoverService.generateVoiceover(text, {
            tone: tone || 'male',  // Default to male voice
            outputPath: audioOutputPath
        });

        let processedVideoPath = null;

        // If project has a video, merge the voiceover audio with it
        if (project.timeline?.tracks?.video?.length > 0) {
            try {
                const videoInfo = project.timeline.tracks.video[0];

                // Find the actual video file path
                // The URL is stored as /uploads/videos/filename.mp4
                const videoFilename = path.basename(videoInfo.url);
                const videoPath = path.join(config.uploadDir, 'videos', videoFilename);

                if (fs.existsSync(videoPath)) {
                    console.log('Video found, merging voiceover with video...');
                    console.log('Video path:', videoPath);
                    console.log('Audio path:', voiceoverPath);

                    // Create processed videos directory
                    const processedDir = path.join(config.uploadDir, 'videos', 'processed');
                    if (!fs.existsSync(processedDir)) {
                        fs.mkdirSync(processedDir, { recursive: true });
                    }

                    // Generate unique filename for processed video
                    const processedFilename = `voiceover-${projectId}-${Date.now()}.mp4`;
                    processedVideoPath = path.join(processedDir, processedFilename);

                    console.log('Output path:', processedVideoPath);

                    // Use FFmpeg to replace audio in video
                    await videoProcessingService.replaceAudio(
                        videoPath,
                        voiceoverPath,
                        processedVideoPath
                    );

                    console.log('Video processing complete:', processedVideoPath);

                    // Update project timeline with processed video
                    project.timeline.tracks.video.push({
                        url: `/uploads/videos/processed/${processedFilename}`,
                        filename: processedFilename,
                        type: 'processed-voiceover'
                    });

                    // Mark the path as modified so Mongoose knows to save the changes
                    project.markModified('timeline.tracks.video');
                } else {
                    console.warn('Video file not found at path:', videoPath);
                }
            } catch (videoError) {
                console.error('Video processing failed:', videoError);
                console.error('Stack:', videoError.stack);
                // Continue with audio-only voiceover - don't fail the entire request
            }
        }

        // Update project voiceover settings
        project.voiceover = {
            enabled: true,
            tone: tone || 'male',
            script: text,
            audioUrl: voiceoverPath ? `/uploads/audio/${path.basename(voiceoverPath)}` : null
        };
        await project.save();

        res.json({
            success: true,
            data: {
                audioPath: voiceoverPath ? `/uploads/audio/${path.basename(voiceoverPath)}` : null,
                videoPath: processedVideoPath ? `/uploads/videos/processed/${path.basename(processedVideoPath)}` : null,
                project
            }
        });
    } catch (error) {
        console.error('Voiceover generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate voiceover',
            error: error.message
        });
    }
});


// @route   POST /api/editing/captions
// @desc    Generate captions for video
// @access  Private
router.post('/captions', protect, async (req, res) => {
    try {
        const { projectId, videoId, language } = req.body;

        const project = await Project.findById(projectId);
        const video = await Video.findById(videoId);

        if (!project || project.user.toString() !== req.user._id.toString()) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        if (!video || video.user.toString() !== req.user._id.toString()) {
            return res.status(404).json({
                success: false,
                message: 'Video not found'
            });
        }

        // Extract audio from video
        const audioPath = path.join(config.uploadDir, 'temp', `audio-${uuidv4()}.mp3`);
        await videoProcessingService.extractAudio(video.path, audioPath);

        // Generate captions
        const captions = await captionService.generateCaptions(video.path, audioPath, { language });

        // Clean up temp audio
        if (fs.existsSync(audioPath)) {
            fs.unlinkSync(audioPath);
        }

        // Update project
        project.captions = {
            enabled: true,
            language,
            data: captions
        };
        await project.save();

        res.json({
            success: true,
            data: {
                captions,
                project
            }
        });
    } catch (error) {
        console.error('Caption generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate captions'
        });
    }
});

// @route   POST /api/editing/translate
// @desc    Translate captions
// @access  Private
router.post('/translate', protect, async (req, res) => {
    try {
        const { projectId, targetLanguage } = req.body;

        const project = await Project.findById(projectId);
        if (!project || project.user.toString() !== req.user._id.toString()) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        if (!project.captions || !project.captions.data || project.captions.data.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No captions to translate'
            });
        }

        // Translate captions
        const translatedCaptions = await translationService.translateCaptions(
            project.captions.data,
            targetLanguage
        );

        // Update project
        project.captions.data = translatedCaptions;
        project.captions.language = targetLanguage;
        await project.save();

        res.json({
            success: true,
            data: {
                captions: translatedCaptions,
                project
            }
        });
    } catch (error) {
        console.error('Translation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to translate captions'
        });
    }
});

// @route   POST /api/editing/voice-effect
// @desc    Apply voice effect
// @access  Private
router.post('/voice-effect', protect, upload.single('audio'), async (req, res) => {
    try {
        const { effect, pitch, speed } = req.body;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No audio file provided'
            });
        }

        const outputPath = path.join(config.uploadDir, 'audio', `effect-${uuidv4()}.mp3`);

        // Ensure directory exists
        if (!fs.existsSync(path.dirname(outputPath))) {
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        }

        let processedPath = req.file.path;

        // Apply pitch change
        if (pitch && parseFloat(pitch) !== 1.0) {
            const pitchPath = path.join(config.uploadDir, 'temp', `pitch-${uuidv4()}.mp3`);
            await audioService.changePitch(processedPath, pitchPath, parseFloat(pitch));
            if (processedPath !== req.file.path) fs.unlinkSync(processedPath);
            processedPath = pitchPath;
        }

        // Apply speed change
        if (speed && parseFloat(speed) !== 1.0) {
            const speedPath = path.join(config.uploadDir, 'temp', `speed-${uuidv4()}.mp3`);
            await audioService.changeSpeed(processedPath, speedPath, parseFloat(speed));
            if (processedPath !== req.file.path) fs.unlinkSync(processedPath);
            processedPath = speedPath;
        }

        // Apply voice effect
        if (effect && effect !== 'none') {
            await audioService.applyVoiceEffect(processedPath, outputPath, effect);
        } else {
            fs.copyFileSync(processedPath, outputPath);
        }

        // Clean up temp files
        if (processedPath !== req.file.path && fs.existsSync(processedPath)) {
            fs.unlinkSync(processedPath);
        }
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.json({
            success: true,
            data: {
                audioPath: `/uploads/audio/${path.basename(outputPath)}`
            }
        });
    } catch (error) {
        console.error('Voice effect error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to apply voice effect'
        });
    }
});

// @route   POST /api/editing/music
// @desc    Add background music to project
// @access  Private
router.post('/music', protect, upload.single('music'), async (req, res) => {
    try {
        const { projectId, volume } = req.body;

        const project = await Project.findById(projectId);
        if (!project || project.user.toString() !== req.user._id.toString()) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No music file provided'
            });
        }

        // Save music file
        const musicPath = path.join(config.uploadDir, 'music', `${uuidv4()}${path.extname(req.file.originalname)}`);

        if (!fs.existsSync(path.dirname(musicPath))) {
            fs.mkdirSync(path.dirname(musicPath), { recursive: true });
        }

        fs.copyFileSync(req.file.path, musicPath);
        fs.unlinkSync(req.file.path);

        // Update project
        project.music = {
            enabled: true,
            track: `/uploads/music/${path.basename(musicPath)}`,
            volume: parseFloat(volume) || 0.3
        };
        await project.save();

        res.json({
            success: true,
            data: { project }
        });
    } catch (error) {
        console.error('Music upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add music'
        });
    }
});

// @route   POST /api/editing/export
// @desc    Export final video
// @access  Private
router.post('/export', protect, async (req, res) => {
    try {
        const { projectId } = req.body;

        const project = await Project.findById(projectId);
        if (!project || project.user.toString() !== req.user._id.toString()) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // This would trigger a background job for video processing
        // For now, just return success
        project.status = 'processing';
        await project.save();

        res.json({
            success: true,
            message: 'Video export started',
            data: { project }
        });
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start export'
        });
    }
});

// @route   GET /api/editing/voices
// @desc    Get available voices
// @access  Private
router.get('/voices', protect, async (req, res) => {
    try {
        const voices = await voiceoverService.getAvailableVoices();
        res.json({
            success: true,
            data: voices
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch voices'
        });
    }
});

// @route   GET /api/editing/languages
// @desc    Get supported languages
// @access  Private
router.get('/languages', protect, async (req, res) => {
    try {
        const languages = translationService.getSupportedLanguages();
        res.json({
            success: true,
            data: languages
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch languages'
        });
    }
});

// @route   GET /api/editing/effects
// @desc    Get available voice effects
// @access  Private
router.get('/effects', protect, async (req, res) => {
    try {
        const effects = audioService.getAvailableEffects();
        res.json({
            success: true,
            data: effects
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch effects'
        });
    }
});

// @route   POST /api/editing/generate-script
// @desc    Generate AI voiceover script
// @access  Private
router.post('/generate-script', protect, async (req, res) => {
    try {
        const { prompt, tone, length, language, projectId } = req.body;

        if (!prompt) {
            return res.status(400).json({
                success: false,
                message: 'Prompt is required'
            });
        }

        // Get video duration if projectId is provided
        let videoDuration = null;
        if (projectId) {
            try {
                const project = await Project.findById(projectId);
                if (project && project.timeline?.tracks?.video?.length > 0) {
                    const videoInfo = project.timeline.tracks.video[0];
                    const videoFilename = path.basename(videoInfo.url);
                    const videoPath = path.join(config.uploadDir, 'videos', videoFilename);

                    if (fs.existsSync(videoPath)) {
                        videoDuration = await videoProcessingService.getVideoDuration(videoPath);
                        console.log(`Video duration: ${videoDuration} seconds`);
                    }
                }
            } catch (durationError) {
                console.warn('Could not get video duration:', durationError.message);
                // Continue with default length if duration extraction fails
            }
        }

        const result = await scriptGenerationService.generateScript(prompt, {
            tone: tone || 'professional',
            length: length || 'medium',
            language: language || 'en',
            videoDuration: videoDuration
        });

        res.json({
            success: true,
            data: {
                ...result,
                videoDuration: videoDuration  // Include video duration in response
            }
        });
    } catch (error) {
        console.error('Script generation error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate script'
        });
    }
});

// @route   GET /api/editing/script-options
// @desc    Get script generation options (tones, lengths)
// @access  Private
router.get('/script-options', protect, async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                tones: scriptGenerationService.getAvailableTones(),
                lengths: scriptGenerationService.getAvailableLengths()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch script options'
        });
    }
});

export default router;
