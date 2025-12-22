import axios from 'axios';
import { config } from '../config/config.js';

class ScriptGenerationService {
    /**
     * Generate video script using Google Gemini API
     */
    async generateScript(prompt, options = {}) {
        const {
            tone = 'professional',
            length = 'medium',
            language = 'en',
            videoDuration = null
        } = options;

        try {
            if (!config.geminiApiKey) {
                throw new Error('Google Gemini API key not configured');
            }

            // Calculate target word count based on video duration if provided
            const targetWordCount = videoDuration ? this.calculateWordCount(videoDuration) : null;

            // Build the enhanced prompt
            const enhancedPrompt = this.buildPrompt(prompt, tone, length, language, targetWordCount);

            // Call Google Gemini API
            // Note: Don't include 'models/' prefix in the URL path - it's only used in the response from ListModels
            // Using gemini-2.5-flash (free tier) instead of gemini-2.5-pro (paid tier)
            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${config.geminiApiKey}`,
                {
                    contents: [{
                        parts: [{
                            text: enhancedPrompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 2048,  // Increased for longer scripts
                    }
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Extract the generated text
            const generatedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!generatedText) {
                throw new Error('No content generated from API');
            }

            return {
                script: generatedText,
                wordCount: generatedText.split(/\s+/).length,
                estimatedDuration: this.estimateDuration(generatedText)
            };
        } catch (error) {
            console.error('Script generation error:', error.response?.data || error.message);
            throw new Error(`Failed to generate script: ${error.response?.data?.error?.message || error.message}`);
        }
    }

    /**
     * Build enhanced prompt for script generation
     */
    buildPrompt(userPrompt, tone, length, language, targetWordCount = null) {
        const lengthGuidelines = {
            short: '30-50 words (15-20 seconds)',
            medium: '100-150 words (45-60 seconds)',
            long: '200-300 words (90-120 seconds)'
        };

        // Use specific word count if video duration was provided
        const lengthRequirement = targetWordCount
            ? `approximately ${targetWordCount} words to match the video duration`
            : lengthGuidelines[length] || lengthGuidelines.medium;

        const toneDescriptions = {
            professional: 'formal, business-like, and authoritative',
            casual: 'friendly, conversational, and relaxed',
            enthusiastic: 'energetic, exciting, and motivational',
            educational: 'informative, clear, and instructional'
        };

        return `Generate a comprehensive, detailed video voiceover script based on the following requirements:

Topic/Description: ${userPrompt}

Requirements:
- Tone: ${tone} (${toneDescriptions[tone] || 'neutral'})
- Target Length: ${lengthRequirement}
- Language: ${language}
- This script will be spoken as voiceover for a video, so make it natural and engaging

${targetWordCount ? `CRITICAL: You MUST generate approximately ${targetWordCount} words to fill the entire video duration.

To achieve this word count:
1. Start with an engaging introduction (10-15% of content)
2. Provide detailed explanations with specific examples
3. Break down the topic into multiple sections/points
4. Include relevant statistics, benefits, or features where applicable
5. Add context and background information
6. Explain the 'why' and 'how' in detail
7. Include a strong conclusion/call-to-action (10% of content)

Make the script flow naturally while being comprehensive and informative.
` : 'Make it suitable for a product video or promotional content'}

IMPORTANT GUIDELINES:
- Write in a natural, conversational speaking style
- Use short, clear sentences that are easy to speak
- Include natural transitions between topics
- Avoid overly technical jargon unless necessary
- Make every sentence count - be informative and engaging
- Do NOT include stage directions, formatting, or timestamps
- Just write the spoken words as they should be read aloud

Generate the complete ${targetWordCount ? `${targetWordCount}-word ` : ''}script now:`;
    }

    /**
     * Calculate target word count based on video duration
     * Reduced for free TTS compatibility (200 char limit)
     */
    calculateWordCount(durationSeconds) {
        const wordsPerSecond = 2.0;  // Reduced to fit free TTS limits
        return Math.ceil(durationSeconds * wordsPerSecond);
    }

    /**
     * Estimate duration in seconds based on word count
     * Average speaking pace: ~150 words per minute
     */
    estimateDuration(text) {
        const words = text.split(/\s+/).length;
        const wordsPerSecond = 150 / 60; // ~2.5 words per second
        return Math.ceil(words / wordsPerSecond);
    }

    /**
     * Get available script tones
     */
    getAvailableTones() {
        return [
            { id: 'professional', name: 'Professional', description: 'Formal and business-like' },
            { id: 'casual', name: 'Casual', description: 'Friendly and conversational' },
            { id: 'enthusiastic', name: 'Enthusiastic', description: 'Energetic and exciting' },
            { id: 'educational', name: 'Educational', description: 'Informative and instructional' }
        ];
    }

    /**
     * Get available script lengths
     */
    getAvailableLengths() {
        return [
            { id: 'short', name: 'Short', description: '15-20 seconds', words: '30-50' },
            { id: 'medium', name: 'Medium', description: '45-60 seconds', words: '100-150' },
            { id: 'long', name: 'Long', description: '90-120 seconds', words: '200-300' }
        ];
    }
}

export default new ScriptGenerationService();
