# 🎬 Clueso AI Video Editor

> An AI-powered video editing platform I built for automated video content creation with voice generation, multilingual dubbing, smart captions, and professional editing capabilities.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6+-brightgreen.svg)](https://www.mongodb.com/)

## 🚀 About This Project

I developed this full-stack AI video editor to simplify professional video creation. The platform uses AI to generate scripts, create natural voiceovers in 26+ languages, auto-generate captions, and provide multilingual dubbing - all through an intuitive web interface.

## ✨ Key Features I Implemented

### 🎙️ AI Voice Generation
- **26 Languages Supported** - Built language-aware voice selection for natural pronunciation
- **3 Voice Tones** - Implemented male, female, and child voice options
- **Smart Voice Mapping** - Created intelligent voice selection based on language (Lekha for Hindi, Jorge/Paulina for Spanish, etc.)
- **Multiple TTS Engines** - Integrated macOS say, Google TTS, ElevenLabs, and OpenAI

### 🌍 Multilingual Dubbing
- **37+ Languages** - Implemented comprehensive translation and dubbing pipeline
- **Audio-Video Sync** - Solved video duration preservation issue during voiceover replacement
- **Smart Extension** - Built audio padding system to match video length

### 📝 Smart Captions
- **Auto-Generated** - Integrated AI transcription for automatic caption generation
- **Script-Based** - Implemented script-aligned caption system
- **Translation** - Added caption translation to any supported language

### 🎵 Video Editing
- **FFmpeg Integration** - Built comprehensive video processing pipeline
- **Version Control** - Implemented timeline system for managing multiple voiceover versions
- **Export System** - Created video download functionality

## 🛠️ Technology Stack

**Frontend:**
- React 18 with Vite
- React Router for navigation
- Axios for API calls
- React Toastify for notifications

**Backend:**
- Node.js & Express
- MongoDB with Mongoose
- JWT authentication
- Multer for file uploads
- FFmpeg for video processing

**AI Services:**
- macOS say (free TTS)
- Google Cloud TTS
- ElevenLabs
- OpenAI & Gemini
- AssemblyAI

## 🔧 Problems I Solved

### Voice Tone Selection Fix
Fixed issue where voice tone wasn't changing - was always using male voice regardless of selection. Implemented proper tone-based voice mapping in `voiceoverService.js`.

### Export Functionality
Built actual video export system. Previously just changed status without downloading file. Now creates download URL and triggers browser download.

### Audio-Video Sync Issue
Solved critical bug where videos became 1 second long after voiceover generation. Removed FFmpeg `-shortest` flag and implemented proper audio padding with silence.

### Language-Aware Voices
Created `getVoiceForLanguage()` method to select appropriate native voices for each language instead of using English voices for all languages (which produced garbled 0.5s audio).

### Translation Error Handling
Fixed issue where error messages were being spoken in voiceover. Removed error prefix from translation fallback.

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+
- MongoDB 6+
- FFmpeg

### Quick Start

1. **Clone repository**
   ```bash
   git clone https://github.com/adilraza99/ai-video-editor.git
   cd ai-video-editor
   ```

2. **Install dependencies**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. **Configure environment**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Start application**
   ```bash
   # From project root
   ./start.sh
   ```

5. **Access at** `http://localhost:5173`

## 📝 Environment Configuration

```env
# Required
PORT=5001
MONGODB_URI=mongodb://localhost:27017/clueso-ai-editor
JWT_SECRET=your-secret-key

# Optional (for premium features)
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=...
GOOGLE_TRANSLATE_API_KEY=...
```

## 📊 Project Structure

```
Clueso_AI_Editor/
├── backend/
│   ├── config/           # Configuration files
│   ├── middleware/       # Auth middleware
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic
│   │   ├── voiceoverService.js
│   │   ├── translationService.js
│   │   └── videoProcessingService.js
│   └── uploads/         # Media storage
├── frontend/
│   ├── src/
│   │   ├── pages/       # React pages
│   │   ├── context/     # State management
│   │   └── utils/       # Utilities
│   └── public/
└── README.md
```

## 🎯 Recent Improvements

- ✅ Fixed voice tone selection (male/female/child)
- ✅ Implemented export functionality
- ✅ Solved audio-video sync issue
- ✅ Added language-aware voice selection (26 languages)
- ✅ Improved translation error handling
- ✅ Enhanced audio padding system

## 🌟 Supported Languages

English, Spanish, French, German, Italian, Portuguese, Russian, Chinese, Japanese, Korean, Hindi, Arabic, Turkish, Dutch, Polish, Swedish, Norwegian, Danish, Finnish, Greek, Czech, Romanian, Hungarian, Thai, Indonesian, Vietnamese

## 📞 Contact

**Adil Raza**
- GitHub: [@adilraza99](https://github.com/adilraza99)
- Repository: [ai-video-editor](https://github.com/adilraza99/ai-video-editor)

## 📜 License

This project is licensed under the MIT License.

---

<div align="center">

**Built with ❤️ using React, Node.js, and AI**

</div>
