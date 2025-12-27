import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import {
    Video,
    ArrowLeft,
    Save,
    Download,
    Mic,
    Type,
    Music,
    Globe,
    Globe2,
    Image as ImageIcon,
    Settings,
    Play,
    Pause,
    RefreshCw
} from 'lucide-react';

const Editor = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();

    // ALL HOOKS MUST BE AT THE TOP - React Rules of Hooks
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [activePanel, setActivePanel] = useState('voiceover');

    // Comparison view and music playback hooks
    const [viewMode, setViewMode] = useState('single'); // single, split
    const [isPlaying, setIsPlaying] = useState(false);
    const mainVideoRef = useRef(null);
    const originalVideoRef = useRef(null);
    const editedVideoRef = useRef(null);
    const musicAudioRef = useRef(null);
    const [activeVersionIndex, setActiveVersionIndex] = useState(-1);
    const [currentTime, setCurrentTime] = useState(0);

    // Music state
    const [musicVolume, setMusicVolume] = useState((project?.music?.volume || 0.3) * 100);
    const [uploadingMusic, setUploadingMusic] = useState(false);

    // Voiceover state
    const [voiceoverData, setVoiceoverData] = useState({
        prompt: '',
        script: '',
        tone: 'male',  // Changed from voice to tone
        scriptTone: 'professional',  // Renamed from tone to scriptTone to avoid confusion
        language: 'en', // Added language support
        generatingScript: false,
        generatingVoiceover: false,
        videoDuration: null  // Track video duration
    });

    const [targetLanguage, setTargetLanguage] = useState('en'); // Default to English for testing dubbing accuracy
    const [sourceLanguage, setSourceLanguage] = useState('en'); // Original audio language
    const [generatingCaptions, setGeneratingCaptions] = useState(false);
    const [translating, setTranslating] = useState(false);
    const [dubbing, setDubbing] = useState(false);
    const [supportedLanguages, setSupportedLanguages] = useState([]);

    useEffect(() => {
        console.log('Editor mounted, projectId:', projectId);
        fetchProject();
    }, [projectId]);

    // Sync music with video
    useEffect(() => {
        if (musicAudioRef.current && project?.music?.enabled) {
            musicAudioRef.current.volume = project.music.volume || 0.3;
        }
    }, [project?.music]);

    const fetchProject = async () => {
        setLoading(true);
        setError(null);

        try {
            console.log('Fetching project:', projectId);
            const response = await api.get(`/projects/${projectId}`);
            console.log('Project fetched:', response.data);
            setProject(response.data.data);

            // Set initial active version if not set
            if (activeVersionIndex === -1 && response.data.data.timeline?.tracks?.video?.length > 0) {
                setActiveVersionIndex(response.data.data.timeline.tracks.video.length - 1);
            }
        } catch (error) {
            console.error('Failed to fetch project:', error);
            const errorMessage = error.response?.data?.message || 'Failed to load project';
            setError(errorMessage);
            toast.error(errorMessage);

            // Only navigate away if it's a 404 or 403
            if (error.response?.status === 404 || error.response?.status === 403) {
                setTimeout(() => navigate('/projects'), 2000);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchLanguages = async () => {
        try {
            const response = await api.get('/editing/languages');
            setSupportedLanguages(response.data.data);
        } catch (error) {
            console.error('Failed to fetch languages:', error);
        }
    };

    useEffect(() => {
        fetchLanguages();
    }, []);

    const saveProject = async () => {
        try {
            const response = await api.put(`/projects/${projectId}`, {
                name: project.name,
                timeline: project.timeline,
                voiceover: project.voiceover,
                captions: project.captions,
                music: project.music,
                settings: project.settings,
                exportSettings: project.exportSettings
            });
            toast.success('Project saved successfully!');
            setProject(response.data.data);
        } catch (error) {
            console.error('Save error:', error);
            toast.error(error.response?.data?.message || 'Failed to save project');
        }
    };

    const exportVideo = async () => {
        try {
            toast.info('Preparing video for export...');
            const response = await api.post('/editing/export', { projectId });

            if (response.data.success && response.data.data.downloadUrl) {
                const { downloadUrl, fileName } = response.data.data;

                // Create download link
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = fileName || 'export.mp4';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                toast.success('Video exported successfully!');
            } else {
                toast.warning('No video available to export');
            }

            // Refresh project to show export status
            await fetchProject();
        } catch (error) {
            console.error('Export error:', error);
            toast.error(error.response?.data?.message || 'Failed to export video');
        }
    };

    const handleVideoUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('video/')) {
            toast.error('Please select a video file');
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('video', file);
            formData.append('projectId', projectId);

            const response = await api.post('/videos/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success('Video uploaded successfully!');
            // Refresh project to show the video
            fetchProject();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to upload video');
        } finally {
            setUploading(false);
        }
    };

    const handleGenerateScript = async () => {
        if (!voiceoverData.prompt.trim()) {
            toast.error('Please enter a description for your voiceover');
            return;
        }

        setVoiceoverData(prev => ({ ...prev, generatingScript: true }));
        try {
            const response = await api.post('/editing/generate-script', {
                prompt: voiceoverData.prompt,
                tone: voiceoverData.scriptTone,
                projectId: projectId,  // Pass projectId to get video duration
                language: targetLanguage
            });

            setVoiceoverData(prev => ({
                ...prev,
                script: response.data.data.script,
                videoDuration: response.data.data.videoDuration,
                generatingScript: false
            }));
            toast.success('Script generated successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to generate script');
            setVoiceoverData(prev => ({ ...prev, generatingScript: false }));
        }
    };

    const handleGenerateVoiceover = async () => {
        if (!voiceoverData.script.trim()) {
            toast.error('Please enter or generate a script first');
            return;
        }

        setVoiceoverData(prev => ({ ...prev, generatingVoiceover: true }));
        try {
            const response = await api.post('/editing/voiceover', {
                projectId,
                text: voiceoverData.script,
                tone: voiceoverData.tone,  // Use tone instead of voice/language
                language: targetLanguage
            });

            toast.success('Voiceover generated! Switching to new version...');
            const updatedProject = response.data.data.project;
            setProject(updatedProject);

            // Switch to the latest version
            setActiveVersionIndex(updatedProject.timeline.tracks.video.length - 1);

            setVoiceoverData(prev => ({ ...prev, generatingVoiceover: false }));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to generate voiceover');
            setVoiceoverData(prev => ({ ...prev, generatingVoiceover: false }));
        }
    };

    const handleGenerateCaptions = async () => {
        setGeneratingCaptions(true);
        try {
            // Check if we should use the script for captions (if available)
            const shouldUseScript = voiceoverData.script && voiceoverData.script.trim().length > 0;

            const response = await api.post('/editing/captions', {
                projectId,
                language: 'en', // Always use English for captions
                // Pass script if we want to align captions with it
                script: shouldUseScript ? voiceoverData.script : undefined
            });

            setProject(response.data.data.project);
            toast.success('Captions generated successfully!');
            setActivePanel('captions');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to generate captions');
        } finally {
            setGeneratingCaptions(false);
        }
    };

    const handleTranslate = async () => {
        setTranslating(true);
        try {
            const response = await api.post('/editing/translate', {
                projectId,
                targetLanguage: targetLanguage
            });

            setProject(response.data.data.project);

            // If script was translated, update voiceoverData
            if (response.data.data.script) {
                setVoiceoverData(prev => ({
                    ...prev,
                    script: response.data.data.script
                }));

                toast.info('Script translated! Regenerating localized voiceover...');

                // Trigger voiceover generation for the new language
                await handleGenerateLocalizedVoiceover(response.data.data.script);
            } else {
                toast.success(`Captions localized to ${supportedLanguages.find(l => l.code === targetLanguage)?.name || targetLanguage}!`);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to translate');
        } finally {
            setTranslating(false);
        }
    };

    const handleGenerateLocalizedVoiceover = async (scriptText) => {
        setVoiceoverData(prev => ({ ...prev, generatingVoiceover: true }));
        try {
            const response = await api.post('/editing/voiceover', {
                projectId,
                text: scriptText,
                tone: voiceoverData.tone,
                language: targetLanguage
            });

            toast.success('Localized Audio Generated! Switching to new version...');
            const updatedProject = response.data.data.project;
            setProject(updatedProject);

            // Switch to the latest version
            setActiveVersionIndex(updatedProject.timeline.tracks.video.length - 1);
        } catch (error) {
            toast.error('Localized audio generation failed');
        } finally {
            setVoiceoverData(prev => ({ ...prev, generatingVoiceover: false }));
        }
    };

    const handleDubVideo = async () => {
        setDubbing(true);
        try {
            toast.info('Starting dubbing process... This may take a few minutes.');

            const response = await api.post('/editing/dub', {
                projectId,
                targetLanguage,
                tone: voiceoverData.tone
            });

            const updatedProject = response.data.data.project;
            setProject(updatedProject);

            // Switch to the newly dubbed version
            setActiveVersionIndex(updatedProject.timeline.tracks.video.length - 1);

            toast.success(`Video dubbed to ${supportedLanguages.find(l => l.code === targetLanguage)?.name || targetLanguage}!`);
        } catch (error) {
            console.error('Dubbing error:', error);
            toast.error(error.response?.data?.message || 'Failed to dub video');
        } finally {
            setDubbing(false);
        }
    };

    const toggleCaptions = async () => {
        const currentCaptions = project.captions || { enabled: false, data: [], language: 'en' };
        const newState = !currentCaptions.enabled;

        // Optimistically update UI
        setProject(prev => ({
            ...prev,
            captions: {
                ...currentCaptions,
                enabled: newState
            }
        }));

        try {
            const response = await api.put(`/projects/${projectId}`, {
                captions: {
                    ...currentCaptions,
                    enabled: newState
                }
            });
            // Update with server response
            setProject(response.data.data);
            toast.success(newState ? 'Captions Visible ✓' : 'Captions Hidden');
        } catch (error) {
            // Revert on error
            setProject(prev => ({
                ...prev,
                captions: {
                    ...currentCaptions,
                    enabled: !newState
                }
            }));
            toast.error('Failed to toggle captions');
        }
    };

    const handleDeleteVersion = async (versionIndex) => {
        if (versionIndex === 0) {
            toast.error('Cannot delete the original video');
            return;
        }

        const version = project.timeline.tracks.video[versionIndex];
        const confirmMessage = `Delete "${version.name || 'Version ' + versionIndex}"? This cannot be undone.`;

        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            // Remove the version from the array
            const updatedVideos = project.timeline.tracks.video.filter((_, idx) => idx !== versionIndex);

            const response = await api.put(`/projects/${projectId}`, {
                timeline: {
                    ...project.timeline,
                    tracks: {
                        ...project.timeline.tracks,
                        video: updatedVideos
                    }
                }
            });

            setProject(response.data.data);

            // If we deleted the active version, switch to the original
            if (activeVersionIndex === versionIndex) {
                setActiveVersionIndex(0);
            } else if (activeVersionIndex > versionIndex) {
                // Adjust index if a version before the active one was deleted
                setActiveVersionIndex(activeVersionIndex - 1);
            }

            toast.success('Version deleted successfully');
        } catch (error) {
            console.error('Delete version error:', error);
            toast.error('Failed to delete version');
        }
    };

    // Music handlers
    const handleMusicUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('audio/')) {
            toast.error('Please select an audio file');
            return;
        }

        // Check file size (max 50MB)
        if (file.size > 50 * 1024 * 1024) {
            toast.error('File size must be less than 50MB');
            return;
        }

        setUploadingMusic(true);
        try {
            const formData = new FormData();
            formData.append('music', file);
            formData.append('projectId', projectId);
            formData.append('volume', musicVolume / 100);

            const response = await api.post('/editing/music', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success('Background music added successfully!');
            setProject(response.data.data.project);
            setMusicVolume((response.data.data.project.music.volume || 0.3) * 100);
        } catch (error) {
            console.error('Music upload error:', error);
            toast.error(error.response?.data?.message || 'Failed to upload music');
        } finally {
            setUploadingMusic(false);
        }
    };

    const handleMusicVolumeChange = async (value) => {
        setMusicVolume(value);

        if (!project?.music?.enabled) return;

        // Debounce save to avoid too many API calls
        clearTimeout(window.musicVolumeTimeout);
        window.musicVolumeTimeout = setTimeout(async () => {
            try {
                await api.put(`/projects/${projectId}`, {
                    music: {
                        ...project.music,
                        volume: value / 100
                    }
                });
            } catch (error) {
                console.error('Failed to update volume:', error);
            }
        }, 500);
    };

    const handleRemoveMusic = async () => {
        if (!project?.music?.enabled && !project?.music?.track) {
            toast.error('No music to remove');
            return;
        }

        try {
            await api.put(`/projects/${projectId}`, {
                music: {
                    enabled: false,
                    track: null,
                    volume: 0.3
                }
            });

            setProject(prev => ({
                ...prev,
                music: { enabled: false, track: null, volume: 0.3 }
            }));

            setMusicVolume(30);
            toast.success('Music removed');
        } catch (error) {
            console.error('Failed to remove music:', error);
            toast.error('Failed to remove music');
        }
    };

    const handleToggleMusic = async (enabled) => {
        if (!project?.music?.track) {
            toast.error('Please upload music first');
            return;
        }

        try {
            await api.put(`/projects/${projectId}`, {
                music: {
                    ...project.music,
                    enabled
                }
            });

            setProject(prev => ({
                ...prev,
                music: { ...prev.music, enabled }
            }));

            toast.success(`Music ${enabled ? 'enabled' : 'disabled'}`);
        } catch (error) {
            console.error('Failed to toggle music:', error);
            toast.error('Failed to toggle music');
        }
    };


    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
                <p style={{ marginTop: '20px', color: 'var(--text-secondary)' }}>Loading project...</p>
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div className="loading-container">
                <div style={{ textAlign: 'center', maxWidth: '500px' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '20px' }}>⚠️</div>
                    <h2 style={{ color: 'var(--error)', marginBottom: '10px' }}>Error Loading Project</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>{error}</p>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button onClick={fetchProject} className="btn btn-primary">
                            Try Again
                        </button>
                        <button onClick={() => navigate('/projects')} className="btn btn-secondary">
                            Back to Projects
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // No project data
    if (!project) {
        return (
            <div className="loading-container">
                <p style={{ color: 'var(--text-secondary)' }}>No project found</p>
                <button onClick={() => navigate('/projects')} className="btn btn-primary" style={{ marginTop: '20px' }}>
                    Back to Projects
                </button>
            </div>
        );
    }

    // Synchronized playback control
    const handlePlayPause = () => {
        if (viewMode === 'single') {
            if (mainVideoRef.current) {
                if (isPlaying) {
                    mainVideoRef.current.pause();
                    if (musicAudioRef.current) musicAudioRef.current.pause();
                } else {
                    mainVideoRef.current.play();
                    if (project?.music?.enabled && musicAudioRef.current) {
                        musicAudioRef.current.play();
                    }
                }
            }
        } else {
            // Split view - sync both videos
            if (isPlaying) {
                originalVideoRef.current?.pause();
                editedVideoRef.current?.pause();
                if (musicAudioRef.current) musicAudioRef.current.pause();
            } else {
                originalVideoRef.current?.play();
                editedVideoRef.current?.play();
                if (project?.music?.enabled && musicAudioRef.current) {
                    musicAudioRef.current.play();
                }
            }
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="editor">
            {/* Hidden Music Player */}
            {project?.music?.enabled && project?.music?.track && (
                <audio
                    ref={musicAudioRef}
                    src={project.music.track}
                    loop
                    style={{ display: 'none' }}
                />
            )}
            {/* Top Bar */}
            <div className="editor-topbar">
                <div className="topbar-left">
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate('/projects')}>
                        <ArrowLeft size={18} />
                        Back
                    </button>
                    <div className="project-name">
                        <input
                            type="text"
                            value={project?.name || ''}
                            onChange={(e) => setProject({ ...project, name: e.target.value })}
                            onBlur={saveProject}
                            placeholder="Project Name"
                            className="name-input"
                        />
                    </div>
                </div>

                <div className="topbar-right">
                    <button className="btn btn-secondary btn-sm" onClick={saveProject}>
                        <Save size={18} />
                        Save
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={exportVideo}>
                        <Download size={18} />
                        Export
                    </button>
                </div>
            </div>

            {/* Main Editor Layout */}
            <div className="editor-main">
                {/* Left Sidebar - Tools */}
                <div className="editor-left">
                    <button
                        className={`tool-btn ${activePanel === 'voiceover' ? 'active' : ''}`}
                        onClick={() => setActivePanel('voiceover')}
                        title="Voiceover"
                    >
                        <Mic size={24} />
                        <span>Voiceover</span>
                    </button>

                    <button
                        className={`tool-btn ${activePanel === 'captions' ? 'active' : ''}`}
                        onClick={() => setActivePanel('captions')}
                        title="Captions"
                    >
                        <Type size={24} />
                        <span>Captions</span>
                    </button>

                    <button
                        className={`tool-btn ${activePanel === 'music' ? 'active' : ''}`}
                        onClick={() => setActivePanel('music')}
                        title="Music"
                    >
                        <Music size={24} />
                        <span>Music</span>
                    </button>

                    <button
                        className={`tool-btn ${activePanel === 'dubbing' ? 'active' : ''}`}
                        onClick={() => setActivePanel('dubbing')}
                        title="Dubbing (Coming Soon)"
                        style={{ position: 'relative' }}
                    >
                        <Globe2 size={24} />
                        <span>Dubbing</span>
                        <span style={{
                            position: 'absolute',
                            top: '5px',
                            right: '5px',
                            background: 'var(--primary)',
                            color: 'white',
                            fontSize: '0.6rem',
                            padding: '1px 4px',
                            borderRadius: '4px',
                            fontWeight: 'bold'
                        }}>SOON</span>
                    </button>

                    <button
                        className={`tool-btn ${activePanel === 'language' ? 'active' : ''}`}
                        onClick={() => setActivePanel('language')}
                        title="Language"
                    >
                        <Globe size={24} />
                        <span>Localization</span>
                    </button>

                    <button
                        className={`tool-btn ${activePanel === 'background' ? 'active' : ''}`}
                        onClick={() => setActivePanel('background')}
                        title="Background"
                    >
                        <ImageIcon size={24} />
                        <span>Background</span>
                    </button>

                    <button
                        className={`tool-btn ${activePanel === 'settings' ? 'active' : ''}`}
                        onClick={() => setActivePanel('settings')}
                        title="Settings"
                    >
                        <Settings size={24} />
                        <span>Settings</span>
                    </button>

                    <button
                        className={`tool-btn ${activePanel === 'files' ? 'active' : ''}`}
                        onClick={() => setActivePanel('files')}
                        title="Files"
                    >
                        <Download size={24} />
                        <span>Files</span>
                    </button>
                </div>

                {/* Center Column - Video + Timeline */}
                <div className="editor-center">
                    {/* Video Preview with Comparison View */}
                    <div className="video-preview-container">
                        {/* View Mode Selector */}
                        {project?.timeline?.tracks?.video?.length > 1 && (
                            <div className="view-mode-selector">
                                <button
                                    className={`view-mode-btn ${viewMode === 'single' ? 'active' : ''}`}
                                    onClick={() => setViewMode('single')}
                                >
                                    <span>🎥</span> Single View
                                </button>
                                <button
                                    className={`view-mode-btn ${viewMode === 'split' ? 'active' : ''}`}
                                    onClick={() => setViewMode('split')}
                                >
                                    <span>⚡</span> Compare
                                </button>
                            </div>
                        )}

                        <div className="video-preview">
                            {project?.timeline?.tracks?.video?.length > 0 ? (
                                <>
                                    {viewMode === 'single' ? (
                                        /* Single Video View */
                                        <div className="main-video-container single-view">
                                            <video
                                                ref={mainVideoRef}
                                                src={project.timeline.tracks.video[activeVersionIndex !== -1 ? activeVersionIndex : project.timeline.tracks.video.length - 1].url}
                                                className="main-video"
                                                controls
                                                onPlay={() => {
                                                    setIsPlaying(true);
                                                    if (project?.music?.enabled && musicAudioRef.current) {
                                                        musicAudioRef.current.currentTime = mainVideoRef.current.currentTime;
                                                        musicAudioRef.current.play();
                                                    }
                                                }}
                                                onPause={() => {
                                                    setIsPlaying(false);
                                                    if (musicAudioRef.current) musicAudioRef.current.pause();
                                                }}
                                                onTimeUpdate={(e) => {
                                                    setCurrentTime(e.target.currentTime);
                                                }}
                                                onSeeking={(e) => {
                                                    if (musicAudioRef.current) {
                                                        musicAudioRef.current.currentTime = e.target.currentTime;
                                                    }
                                                }}
                                                key={project.timeline.tracks.video[project.timeline.tracks.video.length - 1].url}
                                            />
                                            {/* Caption Overlay */}
                                            {project?.captions?.enabled && project?.captions?.data?.length > 0 && (
                                                <div className={`caption-overlay ${project.captions.style?.position || 'bottom'}`}
                                                    style={{
                                                        fontSize: `${project.captions.style?.fontSize || 24}px`,
                                                        fontFamily: project.captions.style?.fontFamily || 'Arial',
                                                        color: project.captions.style?.color || '#FFFFFF',
                                                        backgroundColor: project.captions.style?.backgroundColor || 'rgba(0,0,0,0.7)',
                                                        padding: '8px 16px',
                                                        borderRadius: '4px',
                                                        textAlign: 'center',
                                                        position: 'absolute',
                                                        left: '50%',
                                                        transform: 'translateX(-50%)',
                                                        bottom: project.captions.style?.position === 'bottom' ? '15%' : 'auto',
                                                        top: project.captions.style?.position === 'top' ? '15%' : 'auto',
                                                        maxWidth: '80%',
                                                        zIndex: 10,
                                                        pointerEvents: 'none'
                                                    }}>
                                                    {project.captions.data.find(c => currentTime >= c.startTime && currentTime <= c.endTime)?.text}
                                                </div>
                                            )}

                                            {/* Video Label Badge */}
                                            <div className="video-label-badge">
                                                {(() => {
                                                    const currentVid = project.timeline.tracks.video[activeVersionIndex !== -1 ? activeVersionIndex : project.timeline.tracks.video.length - 1];
                                                    if (activeVersionIndex === 0) return '📹 Original';
                                                    return currentVid.name || '🎙️ With Voiceover';
                                                })()}
                                            </div>

                                            {/* Music Indicator */}
                                            {project?.music?.enabled && (
                                                <div className="music-indicator">
                                                    🎵 Background Music: {Math.round((project.music.volume || 0.3) * 100)}%
                                                </div>
                                            )}

                                            {/* Refresh Button */}
                                            <button
                                                onClick={() => {
                                                    fetchProject();
                                                    toast.info('Video refreshed!');
                                                }}
                                                className="btn btn-secondary btn-sm refresh-btn"
                                                title="Refresh Video"
                                            >
                                                <RefreshCw size={16} className="refresh-icon" />
                                                <span>Refresh</span>
                                            </button>
                                        </div>
                                    ) : (
                                        /* Split Comparison View */
                                        <div className="comparison-view">
                                            {/* Original Video */}
                                            <div className="video-half original">
                                                <div className="video-label">📹 Original</div>
                                                <video
                                                    ref={originalVideoRef}
                                                    src={project.timeline.tracks.video[0].url}
                                                    className="comparison-video"
                                                    controls
                                                    onPlay={() => {
                                                        setIsPlaying(true);
                                                        // Independent playback - no auto-sync
                                                    }}
                                                    onPause={() => {
                                                        setIsPlaying(false);
                                                        // Independent playback - no auto-sync
                                                    }}
                                                    onSeeking={(e) => {
                                                        // Independent seeking - no auto-sync
                                                    }}
                                                />
                                            </div>

                                            {/* Divider */}
                                            <div className="comparison-divider">
                                                <div className="divider-line"></div>
                                            </div>

                                            {/* Processed/Edited Video */}
                                            <div className="video-half edited">
                                                <div className="video-label">✨ Edited</div>
                                                <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <video
                                                        ref={editedVideoRef}
                                                        src={project.timeline.tracks.video[activeVersionIndex !== -1 ? activeVersionIndex : project.timeline.tracks.video.length - 1].url}
                                                        className="comparison-video"
                                                        controls
                                                        onPlay={() => setIsPlaying(true)}
                                                        onPause={() => setIsPlaying(false)}
                                                        onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
                                                        key={project.timeline.tracks.video[project.timeline.tracks.video.length - 1].url}
                                                    />
                                                    {/* Caption Overlay in Split View */}
                                                    {project?.captions?.enabled && project?.captions?.data?.length > 0 && (
                                                        <div className="caption-overlay"
                                                            style={{
                                                                fontSize: '18px',
                                                                color: '#FFFFFF',
                                                                backgroundColor: 'rgba(0,0,0,0.7)',
                                                                padding: '4px 8px',
                                                                borderRadius: '4px',
                                                                textAlign: 'center',
                                                                position: 'absolute',
                                                                left: '50%',
                                                                transform: 'translateX(-50%)',
                                                                bottom: '10%',
                                                                width: '90%',
                                                                zIndex: 10,
                                                                pointerEvents: 'none'
                                                            }}>
                                                            {project.captions.data.find(c => currentTime >= c.startTime && currentTime <= c.endTime)?.text}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Music Indicator for Comparison */}
                                            {project?.music?.enabled && (
                                                <div className="music-indicator-comparison">
                                                    🎵 Music: {Math.round((project.music.volume || 0.3) * 100)}%
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : (
                                /* Empty State */
                                <div className="preview-placeholder">
                                    <Video size={64} style={{ opacity: 0.3 }} />
                                    <p>Upload a video to get started</p>
                                    <button
                                        onClick={() => document.getElementById('video-upload-editor').click()}
                                        className="btn btn-primary"
                                        disabled={uploading}
                                    >
                                        <Video size={18} />
                                        {uploading ? 'Uploading...' : 'Upload Video'}
                                    </button>
                                    <input
                                        id="video-upload-editor"
                                        type="file"
                                        accept="video/*"
                                        onChange={handleVideoUpload}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Timeline - Video Versions */}
                    <div className="timeline">
                        <div className="timeline-header">
                            <h4>📹 Video Versions</h4>
                            {project?.timeline?.tracks?.video?.length > 1 && (
                                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    {project.timeline.tracks.video.length} versions available
                                </span>
                            )}
                        </div>
                        <div className="video-versions">
                            {project?.timeline?.tracks?.video?.map((vid, idx) => (
                                <button
                                    key={idx}
                                    className={`version-chip ${(activeVersionIndex === idx || (activeVersionIndex === -1 && idx === project.timeline.tracks.video.length - 1)) ? 'active' : ''}`}
                                    onClick={() => {
                                        setActiveVersionIndex(idx);
                                        if (vid.script) {
                                            setVoiceoverData(prev => ({ ...prev, script: vid.script }));
                                        }
                                        toast.success('Switched to ' + (vid.name || (vid.type === 'processed-voiceover' ? 'voiceover version' : 'original')));
                                    }}
                                    title="Click to switch to this version"
                                >
                                    {vid.type === 'processed-voiceover' ? '🎙️ ' + (vid.name || 'Voiceover') : '📹 Original'}
                                    {(activeVersionIndex === idx || (activeVersionIndex === -1 && idx === project.timeline.tracks.video.length - 1)) && (
                                        <span className="current-badge">Active</span>
                                    )}
                                </button>
                            )) || <div className="version-chip">No videos yet</div>}
                        </div>
                    </div>
                </div>

                {/* Right Panel - Properties */}
                <div className="editor-right properties-panel">
                    <h3>{activePanel.charAt(0).toUpperCase() + activePanel.slice(1)}</h3>

                    <div className="panel-content">
                        {activePanel === 'voiceover' && (
                            <div className="panel-section">
                                <p className="panel-description">
                                    Generate AI voiceovers for your video
                                </p>

                                {/* AI Script Generation */}
                                <div className="form-group">
                                    <label>What's your video about? (AI will generate a script)</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="e.g., A productivity app that helps users manage tasks"
                                        value={voiceoverData.prompt}
                                        onChange={(e) => setVoiceoverData(prev => ({ ...prev, prompt: e.target.value }))}
                                    />
                                </div>

                                <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--spacing-sm)' }}>
                                    <div>
                                        <label>Script Tone</label>
                                        <select
                                            className="select"
                                            value={voiceoverData.scriptTone}
                                            onChange={(e) => setVoiceoverData(prev => ({ ...prev, scriptTone: e.target.value }))}
                                        >
                                            <option value="professional">Professional</option>
                                            <option value="casual">Casual</option>
                                            <option value="enthusiastic">Enthusiastic</option>
                                            <option value="educational">Educational</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Show video duration if available */}
                                {project?.timeline?.tracks?.video?.length > 0 && (
                                    <div className="form-group">
                                        <label>📹 Video Duration</label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={voiceoverData.videoDuration
                                                ? `${Math.floor(voiceoverData.videoDuration)}s (script will match this duration)`
                                                : 'Calculating...'}
                                            disabled
                                            style={{ background: 'var(--bg-tertiary)', cursor: 'not-allowed' }}
                                        />
                                    </div>
                                )}

                                <button
                                    className="btn btn-secondary"
                                    style={{ width: '100%', marginBottom: 'var(--spacing-md)' }}
                                    onClick={handleGenerateScript}
                                    disabled={voiceoverData.generatingScript || !voiceoverData.prompt.trim()}
                                >
                                    {voiceoverData.generatingScript ? 'Generating Script...' : '✨ Generate Script with AI'}
                                </button>

                                {/* Voice Tone Selection */}
                                <div className="form-group">
                                    <label>Voice Tone</label>
                                    <select
                                        className="select"
                                        value={voiceoverData.tone}
                                        onChange={(e) => setVoiceoverData(prev => ({ ...prev, tone: e.target.value }))}
                                    >
                                        <option value="male">🎙️ Male Voice</option>
                                        <option value="female">🎤 Female Voice</option>
                                        <option value="child">👶 Child Voice</option>
                                    </select>
                                </div>

                                <div className="form-group" style={{ padding: 'var(--spacing-sm)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Target Language</span>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                                            {supportedLanguages.find(l => l.code === targetLanguage)?.name || targetLanguage}
                                        </span>
                                    </div>
                                    <small style={{ display: 'block', marginTop: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        Change this in the <b>Localization</b> panel.
                                    </small>
                                </div>

                                {/* Script Editor */}
                                <div className="form-group">
                                    <label>Script</label>
                                    <textarea
                                        className="textarea"
                                        placeholder="Generated script will appear here, or write your own..."
                                        rows={8}
                                        value={voiceoverData.script}
                                        onChange={(e) => setVoiceoverData(prev => ({ ...prev, script: e.target.value }))}
                                    />
                                </div>

                                <button
                                    className="btn btn-primary"
                                    style={{ width: '100%' }}
                                    onClick={handleGenerateVoiceover}
                                    disabled={voiceoverData.generatingVoiceover || !voiceoverData.script.trim()}
                                >
                                    {voiceoverData.generatingVoiceover ? 'Generating Voiceover...' : 'Generate Voiceover'}
                                </button>
                            </div>
                        )}

                        {activePanel === 'captions' && (
                            <div className="panel-section">
                                <p className="panel-description">
                                    Auto-generate and customize captions for your video
                                </p>

                                <button
                                    className="btn btn-secondary"
                                    style={{ width: '100%', marginBottom: 'var(--spacing-lg)' }}
                                    onClick={handleGenerateCaptions}
                                    disabled={generatingCaptions}
                                >
                                    {generatingCaptions ? 'Generating Captions...' : '🎙️ Generate Captions'}
                                </button>

                                <div className="form-group" style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    background: project?.captions?.enabled ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-tertiary)',
                                    padding: 'var(--spacing-md)',
                                    borderRadius: 'var(--radius-md)',
                                    marginBottom: 'var(--spacing-md)',
                                    border: project?.captions?.enabled ? '1px solid var(--primary)' : '1px solid transparent',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div>
                                        <label style={{ margin: 0, display: 'block', fontWeight: '600' }}>Captions Visibility</label>
                                        <small style={{ color: 'var(--text-muted)' }}>{project?.captions?.enabled ? 'Currently showing' : 'Currently hidden'}</small>
                                    </div>
                                    <button
                                        className={`btn ${project?.captions?.enabled ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                                        onClick={toggleCaptions}
                                        style={{ minWidth: '80px', boxShadow: project?.captions?.enabled ? '0 0 15px rgba(99, 102, 241, 0.3)' : 'none' }}
                                    >
                                        {project?.captions?.enabled ? 'ENABLED' : 'DISABLED'}
                                    </button>
                                </div>

                                <div className="form-group">
                                    <label>Font Size</label>
                                    <input
                                        type="range"
                                        min="12"
                                        max="48"
                                        value={project?.captions?.style?.fontSize || 24}
                                        onChange={async (e) => {
                                            const newFontSize = parseInt(e.target.value);
                                            try {
                                                const response = await api.put(`/projects/${projectId}`, {
                                                    captions: {
                                                        ...project.captions,
                                                        style: {
                                                            ...project.captions?.style,
                                                            fontSize: newFontSize
                                                        }
                                                    }
                                                });
                                                setProject(response.data.data);
                                            } catch (error) {
                                                console.error('Failed to update font size:', error);
                                            }
                                        }}
                                        className="input"
                                    />
                                    <small className="help-text">Current size: {project?.captions?.style?.fontSize || 24}px</small>
                                </div>

                                <div className="form-group">
                                    <label>Position</label>
                                    <select
                                        className="select"
                                        value={project?.captions?.style?.position || 'bottom'}
                                        onChange={async (e) => {
                                            const newPosition = e.target.value;
                                            try {
                                                const response = await api.put(`/projects/${projectId}`, {
                                                    captions: {
                                                        ...project.captions,
                                                        style: {
                                                            ...project.captions?.style,
                                                            position: newPosition
                                                        }
                                                    }
                                                });
                                                setProject(response.data.data);
                                                toast.success(`Caption position: ${newPosition}`);
                                            } catch (error) {
                                                console.error('Failed to update position:', error);
                                                toast.error('Failed to update position');
                                            }
                                        }}
                                    >
                                        <option value="bottom">Bottom</option>
                                        <option value="top">Top</option>
                                        <option value="center">Center</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {activePanel === 'music' && (
                            <div className="panel-section">
                                <p className="panel-description">
                                    Add background music to enhance your video
                                </p>

                                {/* Music Upload */}
                                {!project?.music?.track && (
                                    <div className="form-group">
                                        <label>Upload Music File</label>
                                        <input
                                            type="file"
                                            accept="audio/*"
                                            className="input"
                                            onChange={handleMusicUpload}
                                            disabled={uploadingMusic}
                                            style={{ marginBottom: 'var(--spacing-md)' }}
                                        />
                                        {uploadingMusic && <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Uploading...</p>}
                                    </div>
                                )}

                                {/* Music Info & Controls */}
                                {project?.music?.track && (
                                    <>
                                        {/* Music Info */}
                                        <div className="form-group">
                                            <label>🎵 Current Music</label>
                                            <div style={{
                                                padding: 'var(--spacing-md)',
                                                background: 'var(--bg-tertiary)',
                                                borderRadius: 'var(--radius-md)',
                                                marginBottom: 'var(--spacing-md)'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-xs)' }}>
                                                    <span style={{ color: 'var(--text-secondary)' }}>Status</span>
                                                    <span style={{ fontWeight: '600', color: project.music.enabled ? 'var(--success)' : 'var(--text-muted)' }}>
                                                        {project.music.enabled ? '✓ Enabled' : '○ Disabled'}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: 'var(--text-secondary)' }}>File</span>
                                                    <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                                                        {project.music.track.split('/').pop().substring(0, 20)}...
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Music Preview */}
                                        <div className="form-group">
                                            <label>Preview</label>
                                            <audio
                                                controls
                                                style={{ width: '100%', marginBottom: 'var(--spacing-md)' }}
                                                src={project.music.track}
                                            />
                                        </div>

                                        {/* Enable/Disable Toggle */}
                                        <div className="form-group">
                                            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <span>Enable Background Music</span>
                                                <label className="toggle-switch">
                                                    <input
                                                        type="checkbox"
                                                        checked={project.music.enabled}
                                                        onChange={(e) => handleToggleMusic(e.target.checked)}
                                                    />
                                                    <span className="toggle-slider"></span>
                                                </label>
                                            </label>
                                        </div>

                                        {/* Volume Control */}
                                        <div className="form-group">
                                            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span>Volume</span>
                                                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                    {Math.round(musicVolume)}%
                                                </span>
                                            </label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={musicVolume}
                                                onChange={(e) => handleMusicVolumeChange(parseInt(e.target.value))}
                                                className="input"
                                            />
                                        </div>

                                        {/* Remove Music Button */}
                                        <button
                                            className="btn btn-danger"
                                            style={{ width: '100%', marginTop: 'var(--spacing-md)' }}
                                            onClick={handleRemoveMusic}
                                        >
                                            🗑️ Remove Music
                                        </button>
                                    </>
                                )}

                                {/* Info Message */}
                                {!project?.music?.track && !uploadingMusic && (
                                    <div style={{
                                        marginTop: 'var(--spacing-sm)',
                                        padding: 'var(--spacing-sm)',
                                        background: 'var(--bg-tertiary)',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: '0.875rem',
                                        color: 'var(--text-secondary)',
                                        textAlign: 'center'
                                    }}>
                                        ℹ️ Supported formats: MP3, WAV, AAC, M4A (Max 50MB)
                                    </div>
                                )}
                            </div>
                        )}

                        {activePanel === 'dubbing' && (
                            <div className="panel-section">
                                <p className="panel-description">
                                    Translate your video's spoken audio into another language
                                </p>
                                <div style={{
                                    padding: 'var(--spacing-2xl)',
                                    textAlign: 'center',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: 'var(--radius-lg)',
                                    border: '2px dashed var(--border)',
                                    marginTop: 'var(--spacing-lg)'
                                }}>
                                    <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>🎙️</div>
                                    <h3 style={{ marginBottom: 'var(--spacing-sm)', color: 'var(--text-primary)' }}>Coming Soon</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                        AI Video Dubbing is currently under development.
                                        Soon you'll be able to translate your videos into 20+ languages with perfect lip-sync and voice preservation!
                                    </p>
                                    <div style={{
                                        marginTop: 'var(--spacing-lg)',
                                        padding: 'var(--spacing-sm)',
                                        background: 'rgba(99, 102, 241, 0.1)',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: '0.75rem',
                                        color: 'var(--primary)',
                                        fontWeight: '600'
                                    }}>
                                        🚀 STAGE: BETA TESTING
                                    </div>
                                </div>
                            </div>
                        )}

                        {activePanel === 'language' && (
                            <div className="side-panel">
                                <h2 className="panel-title">Localization</h2>
                                <p className="panel-description">
                                    Translate and localize your entire project
                                </p>
                                <div className="form-group">
                                    <label>Global Target Language</label>
                                    <select
                                        className="select"
                                        value={targetLanguage}
                                        onChange={(e) => setTargetLanguage(e.target.value)}
                                    >
                                        {supportedLanguages.map(lang => (
                                            <option key={lang.code} value={lang.code}>
                                                {lang.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    className="btn btn-primary"
                                    style={{ width: '100%' }}
                                    onClick={handleTranslate}
                                    disabled={translating}
                                >
                                    {translating ? 'Localizing Everything...' : 'Localize Project (Audio + Text)'}
                                </button>
                                <div style={{ marginTop: 'var(--spacing-lg)' }}>
                                    <small className="help-text">
                                        This will translate all existing captions to the target language.
                                        You can then regenerate the voiceover in the Voiceover panel to match.
                                    </small>
                                </div>
                            </div>
                        )}

                        {activePanel === 'background' && (
                            <div className="panel-section">
                                <p className="panel-description">
                                    Change video background
                                </p>
                                <div style={{
                                    padding: 'var(--spacing-2xl)',
                                    textAlign: 'center',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: 'var(--radius-lg)',
                                    border: '2px dashed var(--border)'
                                }}>
                                    <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>🎨</div>
                                    <h3 style={{ marginBottom: 'var(--spacing-sm)', color: 'var(--text-primary)' }}>Coming Soon</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                        Background customization features are under development.
                                        Stay tuned for color overlays, blur effects, and custom backgrounds!
                                    </p>
                                </div>
                            </div>
                        )}

                        {activePanel === 'settings' && (
                            <div className="panel-section">
                                <p className="panel-description">
                                    Project settings and export options
                                </p>
                                <div className="form-group">
                                    <label>Resolution</label>
                                    <select className="select"
                                        value={`${project?.settings?.resolution?.width}x${project?.settings?.resolution?.height}`}
                                        onChange={(e) => {
                                            const [width, height] = e.target.value.split('x').map(Number);
                                            setProject(prev => ({
                                                ...prev,
                                                settings: { ...prev.settings, resolution: { width, height } }
                                            }));
                                            toast.info(`Resolution set to ${e.target.value}`);
                                        }}
                                    >
                                        <option value="1920x1080">1920x1080 (Full HD)</option>
                                        <option value="1280x720">1280x720 (HD)</option>
                                        <option value="3840x2160">3840x2160 (4K)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Frame Rate</label>
                                    <select className="select"
                                        value={project?.settings?.frameRate || 30}
                                        onChange={(e) => {
                                            setProject(prev => ({
                                                ...prev,
                                                settings: { ...prev.settings, frameRate: Number(e.target.value) }
                                            }));
                                            toast.info(`Frame rate set to ${e.target.value} FPS`);
                                        }}
                                    >
                                        <option value="30">30 FPS</option>
                                        <option value="60">60 FPS</option>
                                        <option value="24">24 FPS</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Quality</label>
                                    <select className="select"
                                        value={project?.exportSettings?.quality || 'high'}
                                        onChange={(e) => {
                                            setProject(prev => ({
                                                ...prev,
                                                exportSettings: { ...prev.exportSettings, quality: e.target.value }
                                            }));
                                            toast.info(`Quality set to ${e.target.value}`);
                                        }}
                                    >
                                        <option value="high">High</option>
                                        <option value="ultra">Ultra</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                    </select>
                                </div>
                                <button
                                    className="btn btn-secondary"
                                    style={{ width: '100%', marginTop: 'var(--spacing-md)' }}
                                    onClick={saveProject}
                                >
                                    💾 Save Settings
                                </button>
                            </div>
                        )}

                        {activePanel === 'files' && (
                            <div className="panel-section">
                                <p className="panel-description">
                                    Project versions and generated files
                                </p>

                                {/* Video Versions */}
                                <div className="form-group">
                                    <label>🗂️ Video Versions</label>
                                    <div className="files-list">
                                        {/* Original Video */}
                                        <div
                                            className={`file-item ${activeVersionIndex === 0 ? 'active' : ''}`}
                                            onClick={() => {
                                                setActiveVersionIndex(0);
                                                toast.info('Switched to Original Video');
                                            }}
                                            style={{ cursor: 'pointer', border: activeVersionIndex === 0 ? '1px solid var(--primary)' : '1px solid transparent' }}
                                        >
                                            <div className="file-info">
                                                <span className="file-name" style={{ fontWeight: 'bold' }}>📹 Original Upload</span>
                                                <span className="file-type">.mp4</span>
                                            </div>
                                        </div>

                                        {/* Processed Versions */}
                                        {project?.timeline?.tracks?.video?.map((vid, realIdx) => {
                                            if (realIdx === 0) return null; // Skip original as it's handled above
                                            return (
                                                <div
                                                    key={realIdx}
                                                    className={`file-item ${activeVersionIndex === realIdx ? 'active' : ''}`}
                                                    onClick={() => {
                                                        setActiveVersionIndex(realIdx);
                                                        if (vid.script) {
                                                            setVoiceoverData(prev => ({ ...prev, script: vid.script }));
                                                        }
                                                        toast.info(`Switched to: ${vid.name || `Version ${realIdx}`}`);
                                                    }}
                                                    style={{ cursor: 'pointer', border: activeVersionIndex === realIdx ? '1px solid var(--primary)' : '1px solid transparent', transition: 'all 0.2s ease' }}
                                                >
                                                    <div className="file-info">
                                                        <span className="file-name" style={{ fontWeight: 'bold' }}>{vid.name || `Voiceover Version ${realIdx}`}</span>
                                                        <span className="file-type">.mp4</span>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-xs)' }}>
                                                        <a
                                                            href={vid.url}
                                                            download
                                                            className="btn btn-secondary btn-sm"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <Download size={14} />
                                                            Download
                                                        </a>
                                                        <button
                                                            className="btn btn-danger btn-sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteVersion(realIdx);
                                                            }}
                                                            title="Delete this version"
                                                        >
                                                            🗑️ Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Audio Only */}
                                <div className="form-group" style={{ marginTop: 'var(--spacing-lg)' }}>
                                    <label>🎵 Raw Audio</label>
                                    {project?.voiceover?.audioUrl ? (
                                        <div className="file-item">
                                            <div className="file-info">
                                                <span className="file-name">Voiceover Audio</span>
                                                <span className="file-type">.mp3</span>
                                            </div>
                                            <a
                                                href={project.voiceover.audioUrl}
                                                download
                                                className="btn btn-secondary btn-sm"
                                            >
                                                <Download size={14} />
                                                Download
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="empty-state-small">
                                            No audio files yet
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Scoped Styles */}
            <style>{`
        .editor {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: var(--bg-primary);
          overflow: hidden;
        }



        .topbar-left, .topbar-right {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .project-name {
          margin-left: var(--spacing-md);
        }

        .name-input {
          background: transparent;
          border: none;
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
          padding: var(--spacing-xs);
          border-bottom: 1px solid transparent;
          transition: border-color var(--transition-fast);
        }

        .name-input:focus {
          outline: none;
          border-bottom-color: var(--primary);
        }

        .editor-container {
          height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #0f1115;
        }

        .editor-main {
          display: flex;
          flex: 1;
          overflow: hidden;
          min-height: 0;
        }

        .editor-left {
          width: 80px;
          background: #090b0f;
          border-right: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: var(--spacing-md) 0;
          gap: var(--spacing-sm);
        }

        .editor-right {
          width: 380px;
          background: #11141b;
          border-left: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          position: relative;
          height: 100%;
        }

        .tool-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-md);
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
          font-size: 0.7rem;
        }

        .tool-btn:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .tool-btn.active {
          background: var(--bg-tertiary);
          color: var(--primary);
        }

        .editor-center {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden; /* Changed from auto to hidden to enforce internal container scaling */
          min-width: 0;
          min-height: 0;
          background: #0f1115;
        }

        .video-preview-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #000;
          padding: 0;
          position: relative;
          min-height: 0;
        }

        .video-preview {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-xl); /* Increased padding to make video feel contained */
          position: relative;
          min-height: 0;
        }

        .view-mode-selector {
          position: absolute;
          top: var(--spacing-md);
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: var(--spacing-xs);
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(10px);
          padding: 4px;
          border-radius: var(--radius-full);
          border: 1px solid rgba(255, 255, 255, 0.1);
          z-index: 10;
        }

        .view-mode-btn {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: 6px 16px;
          border-radius: var(--radius-full);
          border: none;
          background: transparent;
          color: white;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .view-mode-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .view-mode-btn.active {
          background: var(--primary);
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
        }

        .comparison-view {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: var(--spacing-md);
          width: 100%;
          height: 100%;
          align-items: center;
        }

        .video-half {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
          height: 100%;
          justify-content: center;
        }

        .video-label {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          text-align: center;
        }

        .comparison-video {
          width: 100%;
          height: 100%;
          max-height: calc(100% - 30px);
          object-fit: contain;
          border-radius: var(--radius-md);
          background: #000;
        }

        .comparison-divider {
          width: 1px;
          height: 80%;
          background: var(--border);
          position: relative;
        }

        .divider-line {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          right: 0;
        }

        .main-video-container {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000;
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.05);
          position: relative;
        }

        .main-video {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: var(--radius-md);
        }

        .preview-placeholder {
          text-align: center;
          color: var(--text-muted);
        }

        .preview-placeholder p {
          margin: var(--spacing-lg) 0;
        }

        .timeline {
          height: 120px; /* Reverted to 120px for better vertical balance */
          background: linear-gradient(to bottom, #161920, #0f1115);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding: var(--spacing-md);
          position: relative;
          overflow: hidden;
        }

        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
        }

        .timeline-header h4 {
          margin: 0;
          font-size: 0.95rem;
          color: var(--text-secondary);
        }

        .video-versions {
          display: flex;
          gap: var(--spacing-sm);
          flex-wrap: wrap;
        }

        .version-chip {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-xs) var(--spacing-md);
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-md);
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .version-chip:hover {
          background: var(--bg-hover);
          border-color: var(--primary);
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .version-chip.active {
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          border-color: var(--primary);
          color: white;
          font-weight: 600;
        }

        .current-badge {
          padding: 2px 8px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          color: white;
          font-weight: 600;
        }

        .version-chip:not(.active) .current-badge {
          background: var(--primary);
        }

        /* Refresh Button Animation */
        .refresh-btn {
          position: relative;
          overflow: hidden;
        }

        .refresh-btn:hover {
          animation: refreshPulse 0.6s ease-in-out;
        }

        .refresh-btn:active .refresh-icon {
          animation: refreshSpin 0.5s linear;
        }

        .refresh-icon {
          display: inline-block;
          transition: transform 0.3s ease;
        }

        @keyframes refreshSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes refreshPulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        .properties-panel {
          padding: var(--spacing-lg);
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
        }

        /* Glassmorphism for Topbar */
        .editor-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-sm) var(--spacing-xl);
          background: rgba(15, 17, 21, 0.8);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .properties-panel h3 {
          font-size: 1.25rem;
          margin-bottom: var(--spacing-lg);
        }

        .panel-content {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .panel-section {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .panel-description {
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin: 0;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .form-group label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .background-templates {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--spacing-sm);
          margin-top: var(--spacing-md);
        }

        .template-item {
          aspect-ratio: 16/9;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: transform var(--transition-fast);
        }

        .template-item:hover {
          transform: scale(1.05);
        }
        
        .file-item {
          padding: var(--spacing-md);
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          margin-bottom: var(--spacing-sm);
        }
        
        .file-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-sm);
        }
        
        .file-name {
          font-size: 0.875rem;
          color: var(--text-primary);
          font-weight: 500;
        }
        
        .file-type {
          font-size: 0.75rem;
          color: var(--text-secondary);
          padding: 2px 6px;
          background: var(--bg-secondary);
          border-radius: var(--radius-sm);
        }
        
        .files-list {
          max-height: 300px;
          overflow-y: auto;
        }
        
        .empty-state-small {
          padding: var(--spacing-md);
          text-align: center;
          color: var(--text-secondary);
          font-size: 0.875rem;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
        }

        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }

        @media (max-width: 1024px) {
          .properties-panel {
            display: none;
          }
        }
      `}</style>
        </div>
    );
};

export default Editor;
