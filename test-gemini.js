import axios from 'axios';

const API_KEY = 'AIzaSyCNN-sC1qR1x6zXPBqSI2QGlrpLyN9WNz8';

async function testGemini() {
    try {
        console.log('Testing Gemini API...');
        console.log('API Key:', API_KEY.substring(0, 20) + '...');

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
            {
                contents: [{
                    parts: [{
                        text: 'Write a short 20-word script about a productivity app.'
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Success!');
        console.log('Response:', JSON.stringify(response.data, null, 2));

        const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log('\nGenerated Text:', text);

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        console.error('Status:', error.response?.status);
        console.error('Full error:', error);
    }
}

testGemini();
