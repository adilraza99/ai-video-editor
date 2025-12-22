import axios from 'axios';
import { config } from '../config/config.js';

class TranslationService {
    /**
     * Translate text to target language
     */
    async translateText(text, targetLanguage, sourceLanguage = 'auto') {
        // If Google Translate API key is available, use official API
        if (config.googleTranslateApiKey) {
            return await this.translateWithGoogleAPI(text, targetLanguage, sourceLanguage);
        }

        // Otherwise use free alternative
        return await this.translateFree(text, targetLanguage, sourceLanguage);
    }

    /**
     * Translate using Google Cloud Translation API
     */
    async translateWithGoogleAPI(text, targetLanguage, sourceLanguage) {
        try {
            const response = await axios({
                method: 'post',
                url: `https://translation.googleapis.com/language/translate/v2`,
                params: {
                    key: config.googleTranslateApiKey,
                    q: text,
                    target: targetLanguage,
                    ...(sourceLanguage !== 'auto' && { source: sourceLanguage })
                }
            });

            return response.data.data.translations[0].translatedText;
        } catch (error) {
            console.error('Google Translate API error:', error.message);
            throw new Error('Translation failed');
        }
    }

    /**
     * Translate using free service
     */
    async translateFree(text, targetLanguage, sourceLanguage) {
        try {
            // Using a free translate API (example: MyMemory)
            const response = await axios({
                method: 'get',
                url: 'https://api.mymemory.translated.net/get',
                params: {
                    q: text,
                    langpair: `${sourceLanguage === 'auto' ? 'en' : sourceLanguage}|${targetLanguage}`
                }
            });

            if (response.data.responseStatus === 200) {
                return response.data.responseData.translatedText;
            } else {
                throw new Error('Translation service unavailable');
            }
        } catch (error) {
            console.error('Free translation error:', error.message);
            // Return original text if translation fails
            return text;
        }
    }

    /**
     * Translate array of captions
     */
    async translateCaptions(captions, targetLanguage) {
        const translatedCaptions = [];

        for (const caption of captions) {
            try {
                const translatedText = await this.translateText(caption.text, targetLanguage);
                translatedCaptions.push({
                    ...caption,
                    text: translatedText
                });
            } catch (error) {
                console.error(`Failed to translate caption: ${caption.text}`);
                translatedCaptions.push(caption); // Keep original if translation fails
            }
        }

        return translatedCaptions;
    }

    /**
     * Get supported languages
     */
    getSupportedLanguages() {
        return [
            { code: 'en', name: 'English' },
            { code: 'es', name: 'Spanish' },
            { code: 'fr', name: 'French' },
            { code: 'de', name: 'German' },
            { code: 'it', name: 'Italian' },
            { code: 'pt', name: 'Portuguese' },
            { code: 'ru', name: 'Russian' },
            { code: 'ja', name: 'Japanese' },
            { code: 'ko', name: 'Korean' },
            { code: 'zh-CN', name: 'Chinese (Simplified)' },
            { code: 'zh-TW', name: 'Chinese (Traditional)' },
            { code: 'ar', name: 'Arabic' },
            { code: 'hi', name: 'Hindi' },
            { code: 'bn', name: 'Bengali' },
            { code: 'pa', name: 'Punjabi' },
            { code: 'te', name: 'Telugu' },
            { code: 'mr', name: 'Marathi' },
            { code: 'ta', name: 'Tamil' },
            { code: 'ur', name: 'Urdu' },
            { code: 'gu', name: 'Gujarati' },
            { code: 'kn', name: 'Kannada' },
            { code: 'ml', name: 'Malayalam' },
            { code: 'th', name: 'Thai' },
            { code: 'vi', name: 'Vietnamese' },
            { code: 'id', name: 'Indonesian' },
            { code: 'tr', name: 'Turkish' },
            { code: 'pl', name: 'Polish' },
            { code: 'uk', name: 'Ukrainian' },
            { code: 'nl', name: 'Dutch' },
            { code: 'sv', name: 'Swedish' },
            { code: 'da', name: 'Danish' },
            { code: 'fi', name: 'Finnish' },
            { code: 'no', name: 'Norwegian' },
            { code: 'cs', name: 'Czech' },
            { code: 'ro', name: 'Romanian' },
            { code: 'hu', name: 'Hungarian' },
            { code: 'el', name: 'Greek' },
            { code: 'he', name: 'Hebrew' }
        ];
    }

    /**
     * Detect language of text
     */
    async detectLanguage(text) {
        try {
            const response = await axios({
                method: 'get',
                url: 'https://api.mymemory.translated.net/get',
                params: {
                    q: text,
                    langpair: 'en|es' // Dummy pair for detection
                }
            });

            // This is a simplified detection - in production use proper language detection API
            return 'en'; // Default to English
        } catch (error) {
            return 'en';
        }
    }
}

export default new TranslationService();
