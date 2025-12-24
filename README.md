# Clueso AI Editor Clone

A powerful, AI-driven video editing platform that simplifies the creation of professional documentation and tutorial videos. This project is a full-stack clone of Clueso.io, featuring automated script generation, AI voiceovers, and intelligent localization.

## 🚀 Key Features

-   **AI Script Generation**: Automatically generates scripts from screen recordings or raw footage.
-   **Neural Voiceovers**: High-quality AI voiceover generation with support for multiple tones and languages.
-   **Smart Captions**: Auto-generated captions that sync perfectly with your script (Script-Based Generation) or audio transcription.
-   **One-Click Localization**: instantly translate your video's script, voiceover, and captions into multiple languages (Hindi, Spanish, French, German).
-   **Interactive Timeline**: Multi-track timeline for video, audio, and captions.
-   **Version Control**: Manage multiple versions of voiceovers and edits with ease. Protected original version and safe delete functionality.

## 🛠️ Tech Stack

-   **Frontend**: React, Vite, Context API, Tailwind CSS
-   **Backend**: Node.js, Express, MongoDB
-   **AI Services**: 
    -   Google Gemini (Script Generation, Translation)
    -   OpenAI Whisper (Transcription - *Optional*)
    -   Google Cloud Text-to-Speech (Voiceover)

## 📦 Project Structure

```bash
Clueso_AI_Editor/
├── backend/            # Express server & API routes
│   ├── config/         # DB & API configurations
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API endpoints (projects, editing, etc.)
│   └── services/       # Business logic (AI, File processing)
├── frontend/           # React application
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── context/    # Global state (Auth, Project)
│   │   ├── pages/      # Application views (Dashboard, Editor)
│   │   └── services/   # API client
└── README.md           # Project documentation
```

## 🏁 Getting Started

### Prerequisites

-   Node.js (v18+)
-   MongoDB (Running locally or Atlas URI)
-   FFmpeg (Installed on system for video processing)

### Installation

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd Clueso_AI_Editor
    ```

2.  **Setup Backend**
    ```bash
    cd backend
    npm install
    cp .env.example .env # (or create .env with your keys)
    npm run dev
    ```

3.  **Setup Frontend**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

4.  **Access the App**
    Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🔐 Environment Variables

**Backend (.env)**
```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/clueso-clone
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_key
GOOGLE_APPLICATION_CREDENTIALS=path/to/gcp-key.json
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
