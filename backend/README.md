# Clueso AI Backend

The backend service for Clueso AI Editor, built with Node.js, Express, and MongoDB. It handles file processing, AI integration, and project data management.

## 🏗️ Architecture

-   **Routes**: API endpoints separated by resource (projects, editing, auth).
-   **Services**: Encapsulated business logic and external API integrations.
    -   `scriptGenerationService.js`: Integrates with Google Gemini for AI script generation.
    -   `voiceoverService.js`: Handles TTS using Google Cloud Text-to-Speech (with macOS `say` fallback).
    -   `captionService.js`: Generates captions using **AssemblyAI** or **OpenAI Whisper** for transcription.
    -   `translationService.js`: Manages content localization via Google Gemini.
    -   `videoProcessingService.js`: Wraps FFmpeg for video manipulation, audio extraction, and audio stretching.
-   **Models**: Mongoose schemas for User and Project data.

## 🔌 API Endpoints

### Authentication
-   `POST /api/auth/signup`: Create new user.
-   `POST /api/auth/login`: Authenticate user & get token.

### Projects
-   `GET /api/projects`: List user projects.
-   `POST /api/projects`: Create a new project.
-   `GET /api/projects/:id`: Get project details.
-   `PUT /api/projects/:id`: Update project (timeline, settings).
-   `DELETE /api/projects/:id`: Delete project.

### AI Editing
-   `POST /api/editing/script`: Generate script from video context.
-   `POST /api/editing/voiceover`: Generate AI voiceover from script.
-   `POST /api/editing/captions`: Generate captions (Script-based or Audio-based).
-   `POST /api/editing/translate`: Localize project content.

## 🛠️ Setup & Configuration

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Environment Variables**
    Create a `.env` file in this directory:
    ```env
    PORT=5001
    MONGODB_URI=mongodb://localhost:27017/clueso-ai-editor
    JWT_SECRET=your_jwt_secret
    
    # AI Services
    GEMINI_API_KEY=your_gemini_key
    ASSEMBLYAI_API_KEY=your_assemblyai_key
    OPENAI_API_KEY=your_openai_key (Optional)
    GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json
    ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```
