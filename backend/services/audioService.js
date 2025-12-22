import ffmpeg from 'fluent-ffmpeg';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execPromise = promisify(exec);

class AudioService {
    /**
     * Change voice pitch
     */
    async changePitch(inputPath, outputPath, pitchFactor = 1.0) {
        return new Promise((resolve, reject) => {
            // pitchFactor: 0.5 = lower, 2.0 = higher
            ffmpeg(inputPath)
                .audioFilters(`asetrate=44100*${pitchFactor},aresample=44100`)
                .save(outputPath)
                .on('end', () => resolve(outputPath))
                .on('error', reject);
        });
    }

    /**
     * Change voice speed/tempo
     */
    async changeSpeed(inputPath, outputPath, speedFactor = 1.0) {
        return new Promise((resolve, reject) => {
            // speedFactor: 0.5 = slower, 2.0 = faster
            ffmpeg(inputPath)
                .audioFilters(`atempo=${speedFactor}`)
                .save(outputPath)
                .on('end', () => resolve(outputPath))
                .on('error', reject);
        });
    }

    /**
     * Apply voice effects (robot, echo, etc.)
     */
    async applyVoiceEffect(inputPath, outputPath, effect = 'none') {
        return new Promise((resolve, reject) => {
            let audioFilter = '';

            switch (effect) {
                case 'robot':
                    audioFilter = 'afftfilt=real=\'hypot(re,im)*sin(0)\':imag=\'hypot(re,im)*cos(0)\':win_size=512:overlap=0.75';
                    break;
                case 'echo':
                    audioFilter = 'aecho=0.8:0.9:1000:0.3';
                    break;
                case 'reverb':
                    audioFilter = 'aecho=0.8:0.88:60:0.4';
                    break;
                case 'chipmunk':
                    audioFilter = 'asetrate=44100*1.5,aresample=44100';
                    break;
                case 'deep':
                    audioFilter = 'asetrate=44100*0.75,aresample=44100';
                    break;
                default:
                    // No effect, just copy
                    audioFilter = 'anull';
            }

            ffmpeg(inputPath)
                .audioFilters(audioFilter)
                .save(outputPath)
                .on('end', () => resolve(outputPath))
                .on('error', reject);
        });
    }

    /**
     * Mix two audio files
     */
    async mixAudio(audio1Path, audio2Path, outputPath, options = {}) {
        const { volume1 = 1.0, volume2 = 0.3 } = options;

        return new Promise((resolve, reject) => {
            ffmpeg()
                .input(audio1Path)
                .input(audio2Path)
                .complexFilter([
                    `[0:a]volume=${volume1}[a1]`,
                    `[1:a]volume=${volume2}[a2]`,
                    '[a1][a2]amix=inputs=2:duration=first[aout]'
                ])
                .outputOptions(['-map [aout]'])
                .save(outputPath)
                .on('end', () => resolve(outputPath))
                .on('error', reject);
        });
    }

    /**
     * Normalize audio volume
     */
    async normalizeVolume(inputPath, outputPath) {
        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .audioFilters('loudnorm')
                .save(outputPath)
                .on('end', () => resolve(outputPath))
                .on('error', reject);
        });
    }

    /**
     * Remove background noise
     */
    async removeNoise(inputPath, outputPath) {
        return new Promise((resolve, reject) => {
            // Using highpass and lowpass filters to reduce noise
            ffmpeg(inputPath)
                .audioFilters([
                    'highpass=f=200',
                    'lowpass=f=3000',
                    'afftdn=nf=-25'
                ])
                .save(outputPath)
                .on('end', () => resolve(outputPath))
                .on('error', reject);
        });
    }

    /**
     * Trim audio
     */
    async trimAudio(inputPath, outputPath, startTime, duration) {
        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .setStartTime(startTime)
                .setDuration(duration)
                .save(outputPath)
                .on('end', () => resolve(outputPath))
                .on('error', reject);
        });
    }

    /**
     * Fade in/out audio
     */
    async applyFade(inputPath, outputPath, options = {}) {
        const { fadeIn = 0, fadeOut = 0, duration = 0 } = options;

        return new Promise((resolve, reject) => {
            let filters = [];

            if (fadeIn > 0) {
                filters.push(`afade=t=in:st=0:d=${fadeIn}`);
            }

            if (fadeOut > 0 && duration > 0) {
                filters.push(`afade=t=out:st=${duration - fadeOut}:d=${fadeOut}`);
            }

            ffmpeg(inputPath)
                .audioFilters(filters.length > 0 ? filters.join(',') : 'anull')
                .save(outputPath)
                .on('end', () => resolve(outputPath))
                .on('error', reject);
        });
    }

    /**
     * Convert audio format
     */
    async convertFormat(inputPath, outputPath, format = 'mp3') {
        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .toFormat(format)
                .save(outputPath)
                .on('end', () => resolve(outputPath))
                .on('error', reject);
        });
    }

    /**
     * Get available voice effects
     */
    getAvailableEffects() {
        return [
            { id: 'none', name: 'None', description: 'No effect applied' },
            { id: 'robot', name: 'Robot', description: 'Robotic voice effect' },
            { id: 'echo', name: 'Echo', description: 'Echo effect' },
            { id: 'reverb', name: 'Reverb', description: 'Reverb/room effect' },
            { id: 'chipmunk', name: 'Chipmunk', description: 'High-pitched voice' },
            { id: 'deep', name: 'Deep Voice', description: 'Lower-pitched voice' }
        ];
    }
}

export default new AudioService();
