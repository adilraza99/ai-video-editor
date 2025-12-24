# Clueso AI Editor Frontend

The frontend application for Clueso, built with React, Vite, and Tailwind CSS. It provides a polished, interactive interface for AI video creation and editing.

## 🌟 Features

-   **Dashboard**: Project management with visual stats and staggering entry animations.
-   **Editor Interface**: A comprehensive video editor layout.
    -   **Timeline**: Multi-track timeline for precision editing.
    -   **Video Preview**: Real-time playback with caption overlay.
    -   **Properties Panel**: Context-aware settings for Voiceover, Captions, Localization, and Export.
    -   **Files Panel**: Manage version history (Original, Voiceover versions) with preview and delete capabilities.
-   **Authentication**: Premium cinematic login/signup screens with glassmorphism design.

## 📂 Structure

-   `src/pages/`: Main application views.
    -   `Editor.jsx`: The core editing interface (monolithic component managing complex state).
    -   `Dashboard.jsx`: User project overview.
    -   `Login.jsx` / `Signup.jsx`: Auth pages.
-   `src/components/`: Reusable UI components.
    -   `PrivateRoute.jsx`: Route protection wrapper.
    -   `CaptionOverlay.jsx`: Renders subtitles over video.
-   `src/context/`:
    -   `AuthContext.jsx`: User session management.
-   `src/services/`:
    -   `api.js`: Axios instance with interceptors for auth tokens.

## 🚀 Development

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Run Dev Server**
    ```bash
    npm run dev
    ```
    The app will be available at [http://localhost:5173](http://localhost:5173).

## 🎨 Styling

-   **Tailwind CSS**: Utility-first CSS for layout and spacing.
-   **Custom CSS Variables**: Defined in `index.css` for consistent theming (colors, typography).
-   **Animations**: Custom keyframe animations for polished UI transitions.

## 🔌 Configuration

Copy `.env.example` to `.env`:
```env
VITE_API_URL=http://localhost:5001/api
```
