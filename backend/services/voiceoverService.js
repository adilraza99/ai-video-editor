import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/config.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import ffmpeg from 'fluent-ffmpeg';

class VoiceoverService {
    /**
     * Generate voiceover using Web Speech API (browser-based) or external API
     * For server-side, we'll create audio files using TTS
     */
    async generateVoiceover(text, options = {}) {
        const {
            voice = 'en-US',
            speed = 1.0,
            pitch = 1.0,
            outputPath,
            tone = null  // male, female, child
        } = options;

        // If tone is specified, map it to appropriate voice settings
        let voiceSettings = { voice, speed, pitch };
        if (tone) {
            voiceSettings = this.getToneVoiceMapping(tone, options.language);
        }

        // If ElevenLabs API key is available, use it
        if (config.elevenLabsApiKey) {
            return await this.generateElevenLabsVoiceover(text, outputPath, { ...options, ...voiceSettings });
        }

        // If OpenAI API key is available, use TTS
        if (config.openaiApiKey) {
            return await this.generateOpenAIVoiceover(text, outputPath, { ...options, ...voiceSettings });
        }

        // Otherwise, use free alternative (Google TTS or return instructions for client-side)
        return await this.generateFreeTTS(text, outputPath, { ...options, ...voiceSettings });
    }

    /**
     * Generate voiceover using ElevenLabs
     */
    async generateElevenLabsVoiceover(text, outputPath, options = {}) {
        try {
            // Use voiceId from options, or default based on tone
            const voiceId = options.voiceId || options.voice || '21m00Tcm4TlvDq8ikWAM';

            console.log('Using ElevenLabs voice ID:', voiceId);

            const response = await axios({
                method: 'post',
                url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
                headers: {
                    'Accept': 'audio/mpeg',
                    'xi-api-key': config.elevenLabsApiKey,
                    'Content-Type': 'application/json'
                },
                data: {
                    text,
                    model_id: 'eleven_monolingual_v1',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.5
                    }
                },
                responseType: 'arraybuffer'
            });

            fs.writeFileSync(outputPath, response.data);
            return outputPath;
        } catch (error) {
            console.error('ElevenLabs TTS error:', error.message);
            throw new Error('Failed to generate voiceover with ElevenLabs');
        }
    }

    /**
     * Generate voiceover using OpenAI TTS
     */
    async generateOpenAIVoiceover(text, outputPath, options = {}) {
        try {
            const voice = options.voice || 'alloy'; // alloy, echo, fable, onyx, nova, shimmer

            const response = await axios({
                method: 'post',
                url: 'https://api.openai.com/v1/audio/speech',
                headers: {
                    'Authorization': `Bearer ${config.openaiApiKey}`,
                    'Content-Type': 'application/json'
                },
                data: {
                    model: 'tts-1',
                    input: text,
                    voice: voice
                },
                responseType: 'arraybuffer'
            });

            fs.writeFileSync(outputPath, response.data);
            return outputPath;
        } catch (error) {
            console.error('OpenAI TTS error:', error.message);
            throw new Error('Failed to generate voiceover with OpenAI');
        }
    }

    /**
     * Generate voiceover using free Google TTS
     * Handles long text by splitting into chunks and concatenating
     */
    async generateFreeTTS(text, outputPath, options = {}) {
        try {
            const lang = options.language || 'en';
            const MAX_CHARS = 200; // Google TTS limit per request

            // Try macOS say command first for better voice variety (handles long text)
            try {
                const execPromise = promisify(exec);

                const voiceMap = {
                    'en-US': 'Alex',      // Male
                    'en-GB': 'Samantha',  // Female
                    'en-AU': 'Zarvox'     // Child
                };

                const voice = voiceMap[lang] || 'Alex';

                // Calculate speech rate for macOS say
                // Default rate is ~175 words/min, we can adjust from 1-500
                const speechRate = options.speechRate || 1.0;
                const targetDuration = options.targetDuration || null;
                const sayRate = Math.max(50, Math.min(350, Math.round(175 * speechRate)));

                console.log(`Using macOS voice: ${voice}, rate: ${sayRate} wpm (${speechRate}x) for ${text.length} chars`);

                const tempAiff = outputPath.replace('.mp3', '.aiff');
                const escapedText = text.replace(/"/g, '\\"');

                // Use say with custom rate
                await execPromise(`say -v "${voice}" -r ${sayRate} -o "${tempAiff}" "${escapedText}"`);

                // Convert to MP3
                await new Promise((resolve, reject) => {
                    ffmpeg(tempAiff)
                        .toFormat('mp3')
                        .audioBitrate(192)
                        .on('end', () => {
                            if (fs.existsSync(tempAiff)) fs.unlinkSync(tempAiff);
                            resolve();
                        })
                        .on('error', reject)
                        .save(outputPath);
                });

                // If we have a target duration and audio is shorter, add silence padding
                if (targetDuration) {
                    const metadata = await new Promise((resolve, reject) => {
                        ffmpeg.ffprobe(outputPath, (err, metadata) => {
                            if (err) reject(err);
                            else resolve(metadata);
                        });
                    });
                    const audioDuration = metadata.format.duration;

                    if (audioDuration < targetDuration) {
                        console.log(`Adding silence padding: ${audioDuration}s -> ${targetDuration}s`);
                        const paddedPath = outputPath.replace('.mp3', '-padded.mp3');
                        await new Promise((resolve, reject) => {
                            ffmpeg(outputPath)
                                .audioFilters([`apad=whole_dur=${targetDuration}`])
                                .toFormat('mp3')
                                .audioBitrate(192)
                                .on('end', () => {
                                    fs.renameSync(paddedPath, outputPath);
                                    resolve();
                                })
                                .on('error', reject)
                                .save(paddedPath);
                        });
                        console.log(`✅ Padded audio to ${targetDuration}s: ${outputPath}`);
                    } else {
                        console.log(`✅ Audio duration (${audioDuration}s) matches target`);
                    }
                }

                console.log(`✅ Full audio with ${voice} voice (${text.length} chars): ${outputPath}`);
                return outputPath;
            } catch (sayError) {
                console.log(`macOS say failed: ${sayError.message}`);
                if (sayError.stderr) console.log(`stderr: ${sayError.stderr}`);
                if (sayError.stdout) console.log(`stdout: ${sayError.stdout}`);
                console.log('Falling back to Google TTS with chunking...');
            }

            // Fallback: Google TTS with chunking for long text
            if (text.length <= MAX_CHARS) {
                // Simple case: text fits in one request
                console.log(`Generating TTS for: "${text.substring(0, 50)}..."`);
                const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;

                const response = await axios({
                    method: 'get',
                    url: url,
                    responseType: 'arraybuffer',
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });

                fs.writeFileSync(outputPath, response.data);
                console.log(`✅ Audio generated: ${outputPath}`);
                return outputPath;
            }

            // Complex case: split text into sentences and generate multiple audio files
            console.log(`Text too long (${text.length} chars), splitting into chunks...`);

            // Split by sentences
            const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
            const audioChunks = [];
            let currentChunk = '';
            const chunks = [];

            // Group sentences into chunks under MAX_CHARS
            sentences.forEach(sentence => {
                if ((currentChunk + sentence).length <= MAX_CHARS) {
                    currentChunk += sentence;
                } else {
                    if (currentChunk) chunks.push(currentChunk.trim());
                    currentChunk = sentence;
                }
            });
            if (currentChunk) chunks.push(currentChunk.trim());

            console.log(`Split into ${chunks.length} chunks for TTS generation`);

            // Generate audio for each chunk
            const tempDir = path.dirname(outputPath);
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                const chunkPath = path.join(tempDir, `chunk-${i}-${uuidv4()}.mp3`);

                const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${lang}&client=tw-ob`;
                const response = await axios({
                    method: 'get',
                    url: url,
                    responseType: 'arraybuffer',
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });

                fs.writeFileSync(chunkPath, response.data);
                audioChunks.push(chunkPath);
                console.log(`✅ Chunk ${i + 1}/${chunks.length} generated`);
            }

            // Concatenate all chunks using FFmpeg
            const listPath = path.join(tempDir, `concat-list-${uuidv4()}.txt`);
            const listContent = audioChunks.map(p => `file '${p}'`).join('\n');
            fs.writeFileSync(listPath, listContent);

            await new Promise((resolve, reject) => {
                ffmpeg()
                    .input(listPath)
                    .inputOptions(['-f concat', '-safe 0'])
                    .outputOptions(['-c copy'])
                    .on('end', () => {
                        // Cleanup chunks
                        audioChunks.forEach(chunk => { if (fs.existsSync(chunk)) fs.unlinkSync(chunk); });
                        if (fs.existsSync(listPath)) fs.unlinkSync(listPath);
                        resolve();
                    })
                    .on('error', reject)
                    .save(outputPath);
            });

            console.log(`✅ Full audio generated from ${chunks.length} chunks: ${outputPath}`);
            return outputPath;
        } catch (error) {
            console.error('Free TTS error:', error.message);
            return null;
        }
    }

    /**
     * List available voices
     */
    async getAvailableVoices() {
        // Predefined voice list
        return {
            free: [
                { id: 'en-US', name: 'English (US)', language: 'en-US' },
                { id: 'en-GB', name: 'English (UK)', language: 'en-GB' },
                { id: 'hi-IN', name: 'Hindi', language: 'hi-IN' },
                { id: 'es-ES', name: 'Spanish', language: 'es-ES' },
                { id: 'fr-FR', name: 'French', language: 'fr-FR' },
                { id: 'de-DE', name: 'German', language: 'de-DE' },
                { id: 'it-IT', name: 'Italian', language: 'it-IT' },
                { id: 'pt-BR', name: 'Portuguese (Brazil)', language: 'pt-BR' },
                { id: 'ja-JP', name: 'Japanese', language: 'ja-JP' },
                { id: 'ko-KR', name: 'Korean', language: 'ko-KR' },
                { id: 'zh-CN', name: 'Chinese (Simplified)', language: 'zh-CN' }
            ],
            openai: config.openaiApiKey ? [
                { id: 'alloy', name: 'Alloy' },
                { id: 'echo', name: 'Echo' },
                { id: 'fable', name: 'Fable' },
                { id: 'onyx', name: 'Onyx' },
                { id: 'nova', name: 'Nova' },
                { id: 'shimmer', name: 'Shimmer' }
            ] : [],
            elevenlabs: config.elevenLabsApiKey ? 'Available via API' : []
        };
    }

    /**
     * Get voice tone mappings
     * Maps user-friendly tones to TTS voice settings
     */
    getToneVoiceMapping(tone, language = 'en') {
        // Map common language codes to Google TTS/macOS compatible codes
        const langMap = {
            'en': 'en-US',
            'hi': 'hi-IN',
            'es': 'es-ES',
            'fr': 'fr-FR',
            'de': 'de-DE',
            'it': 'it-IT',
            'pt': 'pt-BR',
            'ja': 'ja-JP',
            'ko': 'ko-KR',
            'zh': 'zh-CN'
        };

        const targetLang = langMap[language] || language || 'en-US';

        // ElevenLabs voice IDs (used if ELEVENLABS_API_KEY is configured)
        const elevenLabsVoices = {
            male: 'pNInz6obpgDQGcFmaJgB',      // Adam - Deep male
            female: 'EXAVITQu4vr4xnSDxMaL',    // Bella - Warm female  
            child: 'nPczCjzI2devNBz1zQrb'     // Brian - Young voice
        };

        // OpenAI TTS voice mappings (used if OPENAI_API_KEY is configured)
        const openaiVoices = {
            male: 'onyx',      // Deep, authoritative male voice
            female: 'nova',    // Warm, friendly female voice
            child: 'shimmer'   // Light, energetic voice
        };

        const toneMappings = {
            male: {
                voiceId: elevenLabsVoices.male,
                voice: config.elevenLabsApiKey ? elevenLabsVoices.male : (config.openaiApiKey ? openaiVoices.male : targetLang),
                language: targetLang,
                pitch: 1.0,
                speed: 1.0
            },
            female: {
                voiceId: elevenLabsVoices.female,
                voice: config.elevenLabsApiKey ? elevenLabsVoices.female : (config.openaiApiKey ? openaiVoices.female : targetLang),
                language: targetLang,
                pitch: 1.0,
                speed: 1.0
            },
            child: {
                voiceId: elevenLabsVoices.child,
                voice: config.elevenLabsApiKey ? elevenLabsVoices.child : (config.openaiApiKey ? openaiVoices.child : targetLang),
                language: targetLang,
                pitch: 1.0,
                speed: 1.05
            }
        };

        return toneMappings[tone] || toneMappings.male;
    }

    /**
     * Get available voice tones
     */
    getAvailableTones() {
        return [
            { id: 'male', name: 'Male Voice', description: 'Deep, masculine voice' },
            { id: 'female', name: 'Female Voice', description: 'Clear, feminine voice' },
            { id: 'child', name: 'Child Voice', description: 'Young, energetic voice' }
        ];
    }
}

export default new VoiceoverService();
