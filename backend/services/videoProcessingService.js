import ffmpeg from 'fluent-ffmpeg';
import { config } from '../config/config.js';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Set FFmpeg paths
if (config.ffmpegPath) {
    ffmpeg.setFfmpegPath(config.ffmpegPath);
}
if (config.ffprobePath) {
    ffmpeg.setFfprobePath(config.ffprobePath);
}

class VideoProcessingService {
    /**
     * Extract metadata from video
     */
    async getVideoMetadata(videoPath) {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(videoPath, (err, metadata) => {
                if (err) reject(err);
                else resolve(metadata);
            });
        });
    }

    /**
     * Get video duration in seconds
     */
    async getVideoDuration(videoPath) {
        try {
            const metadata = await this.getVideoMetadata(videoPath);
            return metadata.format.duration;
        } catch (error) {
            console.error('Error getting video duration:', error);
            throw new Error('Failed to get video duration');
        }
    }

    /**
     * Get audio duration in seconds
     */
    async getAudioDuration(audioPath) {
        try {
            const metadata = await this.getVideoMetadata(audioPath);
            return metadata.format.duration;
        } catch (error) {
            console.error('Error getting audio duration:', error);
            throw new Error('Failed to get audio duration');
        }
    }

    /**
     * Generate thumbnail from video
     */
    async generateThumbnail(videoPath, outputPath) {
        return new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .screenshots({
                    count: 1,
                    folder: path.dirname(outputPath),
                    filename: path.basename(outputPath),
                    size: '640x360'
                })
                .on('end', () => resolve(outputPath))
                .on('error', reject);
        });
    }

    /**
     * Extract audio from video
     */
    async extractAudio(videoPath, outputPath) {
        return new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .noVideo()
                .audioCodec('libmp3lame')
                .toFormat('mp3')
                .save(outputPath)
                .on('end', () => resolve(outputPath))
                .on('error', reject);
        });
    }

    /**
     * Merge audio with video
     */
    async mergeAudioVideo(videoPath, audioPath, outputPath, audioVolume = 1.0) {
        return new Promise((resolve, reject) => {
            ffmpeg()
                .input(videoPath)
                .input(audioPath)
                .complexFilter([
                    `[1:a]volume=${audioVolume}[a1]`,
                    '[0:a][a1]amix=inputs=2:duration=first[aout]'
                ])
                .outputOptions(['-map 0:v', '-map [aout]'])
                .videoCodec('copy')
                .audioCodec('aac')
                .save(outputPath)
                .on('end', () => resolve(outputPath))
                .on('error', reject);
        });
    }

    /**
     * Replace audio in video (for voiceover)
     * Automatically extends audio to match video duration if needed
     */
    async replaceAudio(videoPath, audioPath, outputPath) {
        return new Promise(async (resolve, reject) => {
            try {
                // Get both durations
                const videoDuration = await this.getVideoDuration(videoPath);
                const audioMetadata = await this.getVideoMetadata(audioPath);
                const audioDuration = audioMetadata.format.duration;

                console.log(`Video: ${videoDuration}s, Audio: ${audioDuration}s`);

                // If audio is shorter, loop it to match video duration
                let finalAudioPath = audioPath;
                if (audioDuration < videoDuration) {
                    console.log('Extending audio to match video...');
                    const extendedPath = audioPath.replace('.mp3', '-extended.mp3');
                    await this.extendAudio(audioPath, extendedPath, videoDuration);
                    finalAudioPath = extendedPath;
                }

                ffmpeg()
                    .input(videoPath)
                    .input(finalAudioPath)
                    .outputOptions([
                        '-c:v copy',      // Copy video stream (no re-encoding)
                        '-c:a aac',       // Encode audio to AAC
                        '-map 0:v:0',     // Use video from input 0
                        '-map 1:a:0'      // Use audio from input 1
                        // Removed -shortest to preserve full video duration
                    ])
                    .on('end', () => {
                        console.log('✅ Video processing complete - video duration preserved');
                        // Cleanup extended audio
                        if (finalAudioPath !== audioPath && fs.existsSync(finalAudioPath)) {
                            fs.unlinkSync(finalAudioPath);
                        }
                        resolve(outputPath);
                    })
                    .on('error', reject)
                    .save(outputPath);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Extend audio by adding silence padding to match target duration
     */
    async extendAudio(inputPath, outputPath, targetDuration) {
        return new Promise((resolve, reject) => {
            // Use apad filter to add silence padding to match target duration
            ffmpeg(inputPath)
                .audioFilters(`apad=whole_dur=${targetDuration}`)
                .audioCodec('libmp3lame')
                .audioBitrate('192k')
                .on('start', (cmd) => console.log('Audio extension command:', cmd))
                .on('end', () => {
                    console.log(`✅ Audio extended to ${targetDuration}s with silence padding`);
                    resolve(outputPath);
                })
                .on('error', (err) => {
                    console.error('❌ Audio extension error:', err);
                    // If extension fails, try simpler method
                    console.log('⚠️ Falling back to simple padding method...');
                    ffmpeg(inputPath)
                        .outputOptions([
                            `-t ${Math.ceil(targetDuration)}`,
                            '-acodec libmp3lame',
                            '-ab 192k'
                        ])
                        .on('end', () => {
                            console.log('✅ Audio extended using fallback method');
                            resolve(outputPath);
                        })
                        .on('error', () => {
                            // If both methods fail, use original audio
                            console.warn('⚠️ Both extension methods failed, using original audio');
                            resolve(inputPath);
                        })
                        .save(outputPath);
                })
                .save(outputPath);
        });
    }

    /**
     * Add captions/subtitles to video
     */
    async addCaptions(videoPath, subtitlePath, outputPath) {
        return new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .outputOptions([
                    `-vf subtitles=${subtitlePath}:force_style='FontName=Arial,FontSize=24,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,BorderStyle=3'`
                ])
                .videoCodec('libx264')
                .audioCodec('copy')
                .save(outputPath)
                .on('end', () => resolve(outputPath))
                .on('error', reject);
        });
    }

    /**
     * Apply background to video (green screen replacement or blur)
     */
    async applyBackground(videoPath, backgroundPath, outputPath, type = 'blur') {
        return new Promise((resolve, reject) => {
            let command = ffmpeg(videoPath);

            if (type === 'blur') {
                // Apply blur to background
                command
                    .outputOptions(['-vf', 'boxblur=10:1'])
                    .videoCodec('libx264')
                    .audioCodec('copy');
            } else if (type === 'image' && backgroundPath) {
                // Overlay video on background image
                command
                    .input(backgroundPath)
                    .complexFilter([
                        '[0:v]scale=1920:1080[fg]',
                        '[1:v]scale=1920:1080[bg]',
                        '[bg][fg]overlay'
                    ])
                    .videoCodec('libx264')
                    .audioCodec('copy');
            }

            command
                .save(outputPath)
                .on('end', () => resolve(outputPath))
                .on('error', reject);
        });
    }

    /**
     * Change video resolution and aspect ratio
     */
    async resizeVideo(videoPath, outputPath, width, height) {
        return new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .size(`${width}x${height}`)
                .aspect(`${width}:${height}`)
                .videoCodec('libx264')
                .audioCodec('copy')
                .save(outputPath)
                .on('end', () => resolve(outputPath))
                .on('error', reject);
        });
    }

    /**
     * Export final video with quality settings
     */
    async exportVideo(inputPath, outputPath, options = {}) {
        const {
            format = 'mp4',
            quality = 'high',
            resolution = { width: 1920, height: 1080 },
            frameRate = 30
        } = options;

        return new Promise((resolve, reject) => {
            let qualityOptions = [];

            switch (quality) {
                case 'ultra':
                    qualityOptions = ['-crf 18', '-preset slow'];
                    break;
                case 'high':
                    qualityOptions = ['-crf 23', '-preset medium'];
                    break;
                case 'medium':
                    qualityOptions = ['-crf 28', '-preset fast'];
                    break;
                case 'low':
                    qualityOptions = ['-crf 32', '-preset veryfast'];
                    break;
            }

            ffmpeg(inputPath)
                .size(`${resolution.width}x${resolution.height}`)
                .fps(frameRate)
                .videoCodec('libx264')
                .audioCodec('aac')
                .outputOptions(qualityOptions)
                .toFormat(format)
                .save(outputPath)
                .on('progress', (progress) => {
                    console.log(`Processing: ${progress.percent}% done`);
                })
                .on('end', () => resolve(outputPath))
                .on('error', reject);
        });
    }

    /**
     * Concatenate multiple video clips
     */
    async concatenateVideos(videoPaths, outputPath) {
        return new Promise((resolve, reject) => {
            const command = ffmpeg();

            videoPaths.forEach(videoPath => {
                command.input(videoPath);
            });

            const filterComplex = videoPaths.map((_, i) => `[${i}:v][${i}:a]`).join('') +
                `concat=n=${videoPaths.length}:v=1:a=1[outv][outa]`;

            command
                .complexFilter(filterComplex)
                .outputOptions(['-map [outv]', '-map [outa]'])
                .videoCodec('libx264')
                .audioCodec('aac')
                .save(outputPath)
                .on('end', () => resolve(outputPath))
                .on('error', reject);
        });
    }
}

export default new VideoProcessingService();
