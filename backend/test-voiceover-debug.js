import voiceoverService from './services/voiceoverService.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testVoiceover() {
    try {
        console.log('Testing voiceover generation...');
        const outputPath = path.join(__dirname, 'uploads', 'audio', 'test-voiceover.mp3');

        const result = await voiceoverService.generateVoiceover('Test voiceover text', {
            voice: 'en-US',
            language: 'en-US',
            outputPath
        });

        console.log('Success! Voiceover generated at:', result);
    } catch (error) {
        console.error('Error:', error);
        console.error('Stack:', error.stack);
    }
}

testVoiceover();
