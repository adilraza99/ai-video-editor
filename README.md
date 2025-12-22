# Clueso Clone - AI Video Editor

> A professional AI-powered video editing platform with intelligent voiceover generation and editing capabilities.

## 🚀 Features

### Core Features
- **AI Script Generation** - Generate video scripts using Google Gemini AI based on your video topic
- **Intelligent Voiceover** - Convert scripts to speech with multiple voice tones (Male, Female, Child)
- **Video Processing** - Upload, edit, and export videos with professional quality
- **Project Management** - Organize your videos into projects with full CRUD operations
- **Real-time Preview** - See changes instantly as you edit

### Advanced Features
- **Multiple Voice Tones** - Choose from different voice personalities using macOS text-to-speech
- **Script Duration Matching** - AI automatically calculates optimal script length based on video duration
- **Audio Processing** - Automatic audio merging and video rendering with FFmpeg
- **File Management** - Download individual audio files and processed videos
- **Responsive UI** - Beautiful, modern interface that works on all screen sizes

## 🛠️ Tech Stack

### Frontend
- **React** 18+ with Vite
- **React Router** for navigation
- **Axios** for API calls
- **React Toastify** for notifications
- **Lucide React** for icons
- Modern CSS with CSS variables

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **JWT** for authentication
- **FFmpeg** for video/audio processing
- **Google Gemini AI** for script generation
- **macOS say** for text-to-speech (with Google TTS fallback)

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB (local or Atlas)
- FFmpeg installed
- macOS (for say command) or any OS (fallback to Google TTS)
- Google Gemini API key

## ⚡ Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd cluesoooo
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Configure Environment Variables

**Backend** (`/backend/.env`):
```env
# Server
PORT=5001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/clueso-clone

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key-here

# Optional: OpenAI TTS (for premium voices)
# OPENAI_API_KEY=sk-your-openai-key

# Optional: ElevenLabs (for premium voices)
# ELEVENLABS_API_KEY=your-elevenlabs-key
```

**Frontend** (`/frontend/.env`):
```env
VITE_API_URL=http://localhost:5001/api
```

### 4. Start the Application

**Option A: Use the start script (recommended)**
```bash
chmod +x start.sh
./start.sh
```

**Option B: Manual start**
```bash
# Terminal 1 - Backend
cd backend
PORT=5001 npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 5. Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5001/api

## 📁 Project Structure

```
cluesoooo/
├── backend/
│   ├── config/          # Configuration files
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   │   ├── scriptGenerationService.js
│   │   ├── voiceoverService.js
│   │   └── videoProcessingService.js
│   ├── middleware/      # Auth & validation
│   ├── uploads/         # Uploaded files
│   └── server.js        # Entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── context/     # React context
│   │   ├── pages/       # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Editor.jsx
│   │   │   └── Projects.jsx
│   │   ├── services/    # API services
│   │   └── styles/      # Global styles
│   └── public/          # Static assets
│
└── start.sh            # Startup script
```

## 🎯 Key Features Guide

### AI Script Generation
1. Navigate to the Editor page
2. Enter your video topic in "What's your video about"
3. Click "Generate Script with AI"
4. AI generates a script matched to your video duration

### Voiceover Generation
1. Generate or write your script
2. Select voice tone (Male/Female/Child)
3. Click "Generate Voiceover"
4. Video automatically updates with voiceover audio

### File Management
1. Click the "Files" icon in the editor sidebar
2. View all generated audio files and processed videos
3. Download any file with one click

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Video & Editing
- `POST /api/videos/upload` - Upload video
- `POST /api/editing/script` - Generate AI script
- `POST /api/editing/voiceover` - Generate voiceover
- `POST /api/editing/export` - Export final video

## 🎨 UI Components

### Dashboard
- Welcome section with user greeting
- Stats cards (Projects, Videos, Minutes Processed)
- Recent projects grid
- Clickable profile dropdown with user info

### Editor
- Video preview with refresh capability
- Voiceover panel with AI script generation
- Multiple tool panels (Captions, Music, Effects, etc.)
- Files panel showing generated assets
- Timeline showing video versions

### Profile Dropdown
- User avatar with gradient
- Name and email display
- Project and video stats
- Quick actions (My Projects, Logout)

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas or use your database
2. Configure environment variables on your hosting platform
3. Install FFmpeg on the server
4. Deploy using services like:
   - Heroku
   - Railway
   - DigitalOcean
   - AWS EC2

### Frontend Deployment
1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```
2. Deploy the `dist` folder to:
   - Vercel
   - Netlify
   - AWS S3 + CloudFront

## 🔐 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Backend port (default: 5001) |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for JWT tokens |
| `GEMINI_API_KEY` | Yes | Google Gemini API key for script generation |
| `OPENAI_API_KEY` | No | OpenAI key for premium TTS |
| `ELEVENLABS_API_KEY` | No | ElevenLabs key for premium voices |

## 📝 Development Notes

### Adding New Features
1. Backend: Create service in `/backend/services/`
2. Frontend: Add component in `/frontend/src/components/`
3. Update routes and API as needed

### Video Processing
- Uses FFmpeg for video/audio merging
- Supports MP4, MOV, AVI formats
- Automatic audio extension to match video duration

### Voice Tones
- Uses macOS `say` command for different voices
- Falls back to Google Translate TTS if macOS unavailable
- Can be upgraded to OpenAI TTS or ElevenLabs for premium quality

## 🐛 Troubleshooting

### FFmpeg Not Found
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
```

### MongoDB Connection Failed
- Check if MongoDB is running
- Verify `MONGODB_URI` in `.env`
- Ensure network access if using Atlas

### Voiceover Not Generating
- Check Gemini API key is valid
- Verify FFmpeg is installed
- Check backend logs for errors

## 📄 License

MIT License - feel free to use for personal or commercial projects.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues or questions, please open an issue on GitHub.

---

**Built with ❤️ using React, Node.js, and AI**
