import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

export const config = {
    // Server
    port: process.env.PORT || 5001,
    nodeEnv: process.env.NODE_ENV || 'development',

    // Database
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/clueso-ai-editor',

    // JWT
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    jwtExpire: process.env.JWT_EXPIRE || '7d',

    // File Upload
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: process.env.MAX_FILE_SIZE || 500 * 1024 * 1024, // 500MB

    // FFmpeg
    ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg',
    ffprobePath: process.env.FFPROBE_PATH || 'ffprobe',

    // AI Services (optional - can be null for free alternatives)
    openaiApiKey: process.env.OPENAI_API_KEY || null,
    elevenLabsApiKey: process.env.ELEVENLABS_API_KEY || null,
    geminiApiKey: process.env.GEMINI_API_KEY || null,
    assemblyAIApiKey: process.env.ASSEMBLYAI_API_KEY || null,

    // Translation
    googleTranslateApiKey: process.env.GOOGLE_TRANSLATE_API_KEY || null,

    // Redis (for job queue)
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

    // Frontend URL
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

    // Storage
    storageType: process.env.STORAGE_TYPE || 'local', // 'local' or 's3'
    awsAccessKey: process.env.AWS_ACCESS_KEY_ID || null,
    awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY || null,
    awsBucket: process.env.AWS_BUCKET || null,
    awsRegion: process.env.AWS_REGION || 'us-east-1',
};

// Ensure required directories exist
export const ensureDirectories = () => {
    const dirs = [
        config.uploadDir,
        path.join(config.uploadDir, 'videos'),
        path.join(config.uploadDir, 'thumbnails'),
        path.join(config.uploadDir, 'audio'),
        path.join(config.uploadDir, 'exports')
    ];

    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`📁 Created directory: ${dir}`);
        }
    });
};
