import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/config.js';

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
            voiceSettings = this.getToneVoiceMapping(tone);
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
     * Simplified to work reliably - truncates long text to 200 chars
     */
    async generateFreeTTS(text, outputPath, options = {}) {
        try {
            const lang = options.language || 'en';
            const MAX_CHARS = 200; // Google TTS limit

            // Truncate text if too long (user can generate shorter scripts)
            let finalText = text;
            if (text.length > MAX_CHARS) {
                console.log(`Text too long (${text.length} chars), truncating to ${MAX_CHARS}`);
                finalText = text.substring(0, MAX_CHARS);
            }

            // Try macOS say command first for better voice variety
            try {
                const { exec } = require('child_process');
                const { promisify } = require('util');
                const execPromise = promisify(exec);

                const voiceMap = {
                    'en-US': 'Alex',      // Male
                    'en-GB': 'Samantha',  // Female
                    'en-AU': 'Zarvox'     // Child
                };

                const voice = voiceMap[lang] || 'Alex';
                console.log(`Using macOS voice: ${voice}`);

                const tempAiff = outputPath.replace('.mp3', '.aiff');
                const escapedText = finalText.replace(/"/g, '\\"');
                await execPromise(`say -v "${voice}" -o "${tempAiff}" "${escapedText}"`);

                // Convert to MP3
                const ffmpeg = require('fluent-ffmpeg');
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

                console.log(`✅ Audio with ${voice} voice: ${outputPath}`);
                return outputPath;
            } catch (sayError) {
                console.log('macOS say failed, using Google TTS...');
            }

            console.log(`Generating TTS for: "${finalText.substring(0, 50)}..."`);

            const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(finalText)}&tl=${lang}&client=tw-ob`;

            const response = await axios({
                method: 'get',
                url: url,
                responseType: 'arraybuffer',
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            fs.writeFileSync(outputPath, response.data);
            console.log(`✅ Audio generated: ${outputPath}`);
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
     * 
     * IMPORTANT NOTE ON FREE GOOGLE TTS LIMITATIONS:
     * The free Google Translate TTS API does NOT support pitch or speed adjustments.
     * To provide tone variety, we use different English language variants:
     * - en-US (American): Neutral, suitable for male voice
     * - en-GB (British): Tends to sound lighter/clearer, suitable for female voice  
     * - en-AU (Australian): More energetic tone, suitable for child voice
     * 
     * For true voice tone control, consider upgrading to:
     * - Google Cloud Text-to-Speech (supports voice types and pitch/speed)
     * - OpenAI TTS (6 distinct voices)
     * - ElevenLabs (highly realistic AI voices)
     */
    getToneVoiceMapping(tone) {
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
                voice: config.elevenLabsApiKey ? elevenLabsVoices.male : (config.openaiApiKey ? openaiVoices.male : 'en-US'),
                language: 'en',
                pitch: 1.0,
                speed: 1.0
            },
            female: {
                voiceId: elevenLabsVoices.female,
                voice: config.elevenLabsApiKey ? elevenLabsVoices.female : (config.openaiApiKey ? openaiVoices.female : 'en-GB'),
                language: 'en-GB',
                pitch: 1.0,
                speed: 1.0
            },
            child: {
                voiceId: elevenLabsVoices.child,
                voice: config.elevenLabsApiKey ? elevenLabsVoices.child : (config.openaiApiKey ? openaiVoices.child : 'en-AU'),
                language: 'en-AU',
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
