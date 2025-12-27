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
            console.log('🎙️ Transcribing with OpenAI Whisper API...');

            const FormData = (await import('form-data')).default;
            const formData = new FormData();

            formData.append('file', fs.createReadStream(audioPath));
            formData.append('model', 'whisper-1');
            formData.append('response_format', 'verbose_json'); // Get word-level timestamps
            formData.append('timestamp_granularities[]', 'word');
            if (language && language !== 'auto') {
                formData.append('language', language);
            }

            const response = await axios({
                method: 'post',
                url: 'https://api.openai.com/v1/audio/transcriptions',
                headers: {
                    'Authorization': `Bearer ${config.openaiApiKey}`,
                    ...formData.getHeaders()
                },
                data: formData
            });

            const transcriptData = response.data;

            console.log('\n========== WHISPER API DEBUG ==========');
            console.log('Full transcribed text:', transcriptData.text);
            console.log('Text length:', transcriptData.text?.length || 0);
            console.log('Words array length:', transcriptData.words?.length || 0);
            console.log('======================================\n');

            // Convert Whisper format to caption format
            const captions = [];
            const words = transcriptData.words || [];

            if (words.length === 0 && transcriptData.text) {
                // Fallback: create basic captions from text
                console.log('⚠️ No word-level timestamps, using fallback');
                const sentences = transcriptData.text.split(/[.!?]+/).filter(s => s.trim());
                const duration = transcriptData.duration || 10;
                const timePerSentence = sentences.length > 0 ? duration / sentences.length : 5;

                sentences.forEach((sentence, index) => {
                    captions.push({
                        startTime: index * timePerSentence,
                        endTime: (index + 1) * timePerSentence,
                        text: sentence.trim()
                    });
                });
            } else {
                // Group words into caption-sized chunks
                let currentCaption = { startTime: 0, endTime: 0, words: [] };

                words.forEach((word, index) => {
                    const wordStart = word.start;
                    const wordEnd = word.end;

                    if (currentCaption.words.length === 0) {
                        currentCaption.startTime = wordStart;
                    }

                    currentCaption.words.push(word.word);
                    currentCaption.endTime = wordEnd;

                    // Create new caption every 8 words or 5 seconds
                    const duration = currentCaption.endTime - currentCaption.startTime;
                    if (currentCaption.words.length >= 8 || duration >= 5 || index === words.length - 1) {
                        captions.push({
                            startTime: Math.round(currentCaption.startTime * 10) / 10,
                            endTime: Math.round(currentCaption.endTime * 10) / 10,
                            text: currentCaption.words.join(' ')
                        });
                        currentCaption = { startTime: 0, endTime: 0, words: [] };
                    }
                });
            }

            console.log(`✅ Generated ${captions.length} captions from Whisper`);
            console.log(`📝 Full transcribed text: "${transcriptData.text}"`);
            return captions;
        } catch (error) {
            console.error('❌ Whisper API error:', error.response?.data || error.message);
            throw new Error(`Failed to generate captions with Whisper API: ${error.message}`);
        }
    }

    /**
     * Generate captions using free alternative (AssemblyAI free tier)
     * Provides 100 hours/month of transcription
     */
    async generateWithFreeAlternative(audioPath, language) {
        // Check if AssemblyAI API key is available
        if (!config.assemblyAIApiKey) {
            console.warn('⚠️ AssemblyAI API key not configured, using basic caption generation');
            return await this.generateBasicCaptions(audioPath, language);
        }

        try {
            console.log('🎙️ Transcribing audio with AssemblyAI...');
            const apiKey = config.assemblyAIApiKey;

            // Step 1: Upload audio file
            const uploadUrl = 'https://api.assemblyai.com/v2/upload';
            const audioData = fs.readFileSync(audioPath);

            const uploadResponse = await axios.post(uploadUrl, audioData, {
                headers: {
                    'authorization': apiKey,
                    'Content-Type': 'application/octet-stream'
                }
            });

            const audioUrl = uploadResponse.data.upload_url;
            console.log('✅ Audio uploaded to AssemblyAI');

            // Step 2: Request transcription
            const transcriptUrl = 'https://api.assemblyai.com/v2/transcript';
            const transcriptRequest = await axios.post(transcriptUrl, {
                audio_url: audioUrl,
                language_code: language === 'en' ? 'en' : 'en_us' // AssemblyAI supports many languages
            }, {
                headers: {
                    'authorization': apiKey,
                    'Content-Type': 'application/json'
                }
            });

            const transcriptId = transcriptRequest.data.id;
            console.log(`⏳ Transcription job started: ${transcriptId}`);

            // Step 3: Poll for completion
            const pollUrl = `https://api.assemblyai.com/v2/transcript/${transcriptId}`;
            let transcriptData;
            let attempts = 0;
            const maxAttempts = 60; // 5 minutes max

            while (attempts < maxAttempts) {
                const pollResponse = await axios.get(pollUrl, {
                    headers: { 'authorization': apiKey }
                });

                transcriptData = pollResponse.data;

                if (transcriptData.status === 'completed') {
                    console.log('✅ Transcription completed!');
                    break;
                } else if (transcriptData.status === 'error') {
                    throw new Error(`Transcription failed: ${transcriptData.error}`);
                }

                // Wait 5 seconds before polling again
                await new Promise(resolve => setTimeout(resolve, 5000));
                attempts++;

                if (attempts % 5 === 0) {
                    console.log(`⏳ Still transcribing... (${attempts * 5}s elapsed)`);
                }
            }


            if (!transcriptData || transcriptData.status !== 'completed') {
                throw new Error('Transcription timeout');
            }

            // Debug: Log the FULL response from AssemblyAI
            console.log('\n========== ASSEMBLYAI DEBUG ==========');
            console.log('Full transcribed text:', transcriptData.text);
            console.log('Text length:', transcriptData.text?.length || 0);
            console.log('Words array length:', transcriptData.words?.length || 0);
            console.log('======================================\n');

            // Step 4: Convert words to caption format with timestamps
            const captions = [];
            const words = transcriptData.words || [];

            if (words.length === 0 && transcriptData.text) {
                // Fallback: if no word-level timestamps, create basic captions
                console.log('⚠️ No word-level timestamps, using fallback method');
                const sentences = transcriptData.text.split(/[.!?]+/).filter(s => s.trim());
                const estimatedDuration = 20; // Estimate 20 seconds if we don't have word timing
                const timePerSentence = sentences.length > 0 ? estimatedDuration / sentences.length : 5;

                sentences.forEach((sentence, index) => {
                    captions.push({
                        startTime: index * timePerSentence,
                        endTime: (index + 1) * timePerSentence,
                        text: sentence.trim()
                    });
                });
            } else {
                // Group words into caption-sized chunks (5-10 words or 3-5 seconds)
                let currentCaption = { startTime: 0, endTime: 0, words: [] };

                words.forEach((word, index) => {
                    const wordStart = word.start / 1000; // Convert ms to seconds
                    const wordEnd = word.end / 1000;

                    if (currentCaption.words.length === 0) {
                        currentCaption.startTime = wordStart;
                    }

                    currentCaption.words.push(word.text);
                    currentCaption.endTime = wordEnd;

                    // Create new caption every 8 words or 5 seconds
                    const duration = currentCaption.endTime - currentCaption.startTime;
                    if (currentCaption.words.length >= 8 || duration >= 5 || index === words.length - 1) {
                        captions.push({
                            startTime: Math.round(currentCaption.startTime * 10) / 10,
                            endTime: Math.round(currentCaption.endTime * 10) / 10,
                            text: currentCaption.words.join(' ')
                        });
                        currentCaption = { startTime: 0, endTime: 0, words: [] };
                    }
                });
            }

            console.log(`✅ Generated ${captions.length} captions from transcription`);
            console.log(`📝 Transcribed text: "${transcriptData.text.substring(0, 100)}${transcriptData.text.length > 100 ? '...' : ''}"`);
            console.log(`📝 FULL TEXT: "${transcriptData.text}"`);
            return captions;
        } catch (error) {
            console.error('❌ AssemblyAI transcription error:', error.message);
            console.log('⚠️ Falling back to basic transcription message');

            // Fallback: Return a single caption instructing user to configure API
            return [
                {
                    startTime: 0,
                    endTime: 5,
                    text: 'Transcription requires API configuration. Please add OPENAI_API_KEY or ASSEMBLYAI_API_KEY to your .env file.'
                }
            ];
        }
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
        // Split by sentence-ending punctuation (avoiding regex lookbehind for compatibility)
        const sentences = text
            .split(/[.!?]+/)
            .map(s => s.trim())
            .filter(s => s.length > 0);

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

    /**
     * Generate basic captions when no API key is available
     * Creates timed placeholders based on audio duration
     */
    async generateBasicCaptions(audioPath, language) {
        console.log('📝 Creating basic caption template...');

        try {
            // Get audio duration using FFmpeg
            const { stdout } = await execPromise(
                `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`
            );
            const duration = parseFloat(stdout.trim());

            if (isNaN(duration) || duration <= 0) {
                throw new Error('Invalid audio duration');
            }

            // Create 5-second caption slots
            const captions = [];
            const captionDuration = 5;
            const numCaptions = Math.ceil(duration / captionDuration);

            for (let i = 0; i < numCaptions; i++) {
                captions.push({
                    startTime: i * captionDuration,
                    endTime: Math.min((i + 1) * captionDuration, duration),
                    text: `Caption ${i + 1} - Edit this text to match the audio`
                });
            }

            console.log(`✅ Created ${captions.length} caption slots for ${duration.toFixed(1)}s audio`);
            console.log('💡 Tip: Add OPENAI_API_KEY or ASSEMBLYAI_API_KEY to .env for automatic transcription');
            return captions;
        } catch (error) {
            console.error('❌ Failed to get audio duration:', error.message);
            // Return minimal fallback
            return [{
                startTime: 0,
                endTime: 10,
                text: 'Add your caption text here. Configure OPENAI_API_KEY or ASSEMBLYAI_API_KEY for automatic transcription.'
            }];
        }
    }
}

export default new CaptionService();
