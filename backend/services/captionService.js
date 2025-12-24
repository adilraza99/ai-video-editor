import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { config } from '../config/config.js';

const execPromise = promisify(exec);

class CaptionService {
    /**
     * Generate captions from video using speech-to-text
     */
    async generateCaptions(videoPath, audioPath, options = {}) {
        const { language = 'en' } = options;

        // If OpenAI API key is available, use Whisper API
        if (config.openaiApiKey) {
            return await this.generateWithWhisperAPI(audioPath, language);
        }

        // Otherwise, use free alternative or local Whisper
        return await this.generateWithFreeAlternative(audioPath, language);
    }

    /**
     * Generate captions using OpenAI Whisper API
     */
    async generateWithWhisperAPI(audioPath, language) {
        try {
            const FormData = (await import('form-data')).default;
            const formData = new FormData();

            formData.append('file', fs.createReadStream(audioPath));
            formData.append('model', 'whisper-1');
            formData.append('response_format', 'srt');
            formData.append('language', language);

            const response = await axios({
                method: 'post',
                url: 'https://api.openai.com/v1/audio/transcriptions',
                headers: {
                    'Authorization': `Bearer ${config.openaiApiKey}`,
                    ...formData.getHeaders()
                },
                data: formData
            });

            return this.parseSRT(response.data);
        } catch (error) {
            console.error('Whisper API error:', error.message);
            throw new Error('Failed to generate captions with Whisper API');
        }
    }

    /**
     * Generate captions using free alternative (placeholder)
     */
    async generateWithFreeAlternative(audioPath, language) {
        // This would require local Whisper installation
        // For now, return mock data
        console.log('Using mock caption data - install Whisper for real transcription');

        return [
            { startTime: 0, endTime: 3, text: 'Welcome to this video tutorial' },
            { startTime: 3, endTime: 6, text: 'Today we will learn about video editing' },
            { startTime: 6, endTime: 10, text: 'Using our powerful AI tools' }
        ];
    }

    /**
     * Generate captions from script text (for voiceover-based videos)
     * This creates timed captions based on the script instead of transcribing audio
     */
    async generateFromScript(scriptText, videoDuration) {
        if (!scriptText || !scriptText.trim()) {
            return [];
        }

        // Split script into caption-sized chunks (sentences or phrases)
        const sentences = this.splitIntoSentences(scriptText);
        const captions = [];

        // Calculate time per sentence (distribute evenly across video duration)
        const timePerSentence = videoDuration / sentences.length;

        sentences.forEach((sentence, index) => {
            const startTime = index * timePerSentence;
            const endTime = (index + 1) * timePerSentence;

            captions.push({
                startTime: Math.round(startTime * 10) / 10,
                endTime: Math.round(endTime * 10) / 10,
                text: sentence.trim()
            });
        });

        return captions;
    }

    /**
     * Split text into sentences for captions
     */
    splitIntoSentences(text) {
        // Split by sentence-ending punctuation
        const sentences = text
            .split(/(?<=[.!?])\s+/)
            .filter(s => s.trim().length > 0);

        // If sentences are too long, split by commas or phrases
        const MAX_CAPTION_LENGTH = 80;
        const result = [];

        sentences.forEach(sentence => {
            if (sentence.length <= MAX_CAPTION_LENGTH) {
                result.push(sentence);
            } else {
                // Split long sentences by commas or words
                const parts = sentence.split(/,\s+/);
                parts.forEach(part => {
                    if (part.length <= MAX_CAPTION_LENGTH) {
                        result.push(part);
                    } else {
                        // Split very long parts into chunks of words
                        const words = part.split(' ');
                        let chunk = '';
                        words.forEach(word => {
                            if ((chunk + ' ' + word).length <= MAX_CAPTION_LENGTH) {
                                chunk += (chunk ? ' ' : '') + word;
                            } else {
                                if (chunk) result.push(chunk);
                                chunk = word;
                            }
                        });
                        if (chunk) result.push(chunk);
                    }
                });
            }
        });

        return result;
    }

    /**
     * Parse SRT format to caption array
     */
    parseSRT(srtContent) {
        const captions = [];
        const blocks = srtContent.trim().split('\n\n');

        blocks.forEach(block => {
            const lines = block.split('\n');
            if (lines.length >= 3) {
                const timeMatch = lines[1].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})/);

                if (timeMatch) {
                    const startTime = this.timeToSeconds(timeMatch[1], timeMatch[2], timeMatch[3], timeMatch[4]);
                    const endTime = this.timeToSeconds(timeMatch[5], timeMatch[6], timeMatch[7], timeMatch[8]);
                    const text = lines.slice(2).join(' ');

                    captions.push({
                        startTime,
                        endTime,
                        text
                    });
                }
            }
        });

        return captions;
    }

    /**
     * Convert time to seconds
     */
    timeToSeconds(hours, minutes, seconds, milliseconds) {
        return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds) + parseInt(milliseconds) / 1000;
    }

    /**
     * Generate SRT file from caption array
     */
    generateSRT(captions, outputPath) {
        let srtContent = '';

        captions.forEach((caption, index) => {
            const startTime = this.secondsToTime(caption.startTime);
            const endTime = this.secondsToTime(caption.endTime);

            srtContent += `${index + 1}\n`;
            srtContent += `${startTime} --> ${endTime}\n`;
            srtContent += `${caption.text}\n\n`;
        });

        fs.writeFileSync(outputPath, srtContent.trim());
        return outputPath;
    }

    /**
     * Convert seconds to SRT time format
     */
    secondsToTime(seconds) {
        const hours = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
        const millis = Math.floor((seconds % 1) * 1000).toString().padStart(3, '0');

        return `${hours}:${minutes}:${secs},${millis}`;
    }

    /**
     * Update caption styling
     */
    applyStyling(captions, style) {
        // Style would be applied during video rendering
        // This method would return caption data with styling metadata
        return captions.map(caption => ({
            ...caption,
            style: {
                fontSize: style.fontSize || 24,
                fontFamily: style.fontFamily || 'Arial',
                color: style.color || '#FFFFFF',
                backgroundColor: style.backgroundColor || '#000000',
                position: style.position || 'bottom'
            }
        }));
    }

    /**
     * Translate captions to another language
     */
    async translateCaptions(captions, targetLanguage) {
        // Use the proper translation service
        const translationService = (await import('./translationService.js')).default;
        return await translationService.translateCaptions(captions, targetLanguage);
    }
}

export default new CaptionService();
