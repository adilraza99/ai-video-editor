import { useState, useEffect } from 'react';
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
    Image as ImageIcon,
    Settings,
    Play,
    Pause
} from 'lucide-react';

const Editor = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [activePanel, setActivePanel] = useState('voiceover');

    useEffect(() => {
        fetchProject();
    }, [projectId]);

    const fetchProject = async () => {
        try {
            const response = await api.get(`/projects/${projectId}`);
            setProject(response.data.data);
        } catch (error) {
            toast.error('Failed to load project');
            navigate('/projects');
        } finally {
            setLoading(false);
        }
    };

    const saveProject = async () => {
        try {
            const response = await api.put(`/projects/${projectId}`, {
                name: project.name,
                timeline: project.timeline,
                voiceover: project.voiceover,
                captions: project.captions,
                music: project.music
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
            toast.info('Starting video export...');
            const response = await api.post('/editing/export', { projectId });
            toast.success('Export complete! Check your downloads.');
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

    // Voiceover state
    const [voiceoverData, setVoiceoverData] = useState({
        prompt: '',
        script: '',
        tone: 'male',  // Changed from voice to tone
        scriptTone: 'professional',  // Renamed from tone to scriptTone to avoid confusion
        generatingScript: false,
        generatingVoiceover: false,
        videoDuration: null  // Track video duration
    });

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
                language: 'en'
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
                tone: voiceoverData.tone  // Use tone instead of voice/language
            });

            toast.success('Voiceover generated! Refreshing video...');

            // Force hard refresh of project
            setTimeout(async () => {
                await fetchProject();
                // Force video reload by updating a dummy state
                setProject(prev => ({ ...prev, _lastUpdate: Date.now() }));
            }, 1000);

            setVoiceoverData(prev => ({ ...prev, generatingVoiceover: false }));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to generate voiceover');
            setVoiceoverData(prev => ({ ...prev, generatingVoiceover: false }));
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
            </div>
        );
    }

    return (
        <div className="editor">
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
                <div className="editor-sidebar">
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
                        className={`tool-btn ${activePanel === 'language' ? 'active' : ''}`}
                        onClick={() => setActivePanel('language')}
                        title="Language"
                    >
                        <Globe size={24} />
                        <span>Language</span>
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

                {/* Video Preview */}
                <div className="video-preview-container">
                    <div className="video-preview">
                        {project?.timeline?.tracks?.video?.length > 0 ? (
                            <div className="main-video-container">
                                <video
                                    src={project.timeline.tracks.video[project.timeline.tracks.video.length - 1].url}
                                    className="main-video"
                                    controls
                                    key={project.timeline.tracks.video[project.timeline.tracks.video.length - 1].url}
                                />
                                <div style={{
                                    position: 'absolute',
                                    bottom: '20px',
                                    left: '20px',
                                    background: 'rgba(0,0,0,0.7)',
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    color: 'white',
                                    fontSize: '0.875rem'
                                }}>
                                    {project.timeline.tracks.video[project.timeline.tracks.video.length - 1].type === 'processed-voiceover'
                                        ? '🎙️ With Voiceover'
                                        : '📹 Original Video'}
                                </div>
                                <button
                                    onClick={() => {
                                        fetchProject();
                                        toast.info('Video refreshed!');
                                    }}
                                    className="btn btn-secondary btn-sm"
                                    style={{
                                        position: 'absolute',
                                        top: '20px',
                                        right: '20px',
                                        zIndex: 10
                                    }}
                                >
                                    🔄 Refresh
                                </button>
                            </div>
                        ) : (
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
                                <div key={idx} className="version-chip">
                                    {vid.type === 'processed-voiceover' ? '🎙️ With Voiceover' : '📹 Original'}
                                    {idx === project.timeline.tracks.video.length - 1 && (
                                        <span className="current-badge">Current</span>
                                    )}
                                </div>
                            )) || <div className="version-chip">No videos yet</div>}
                        </div>
                    </div>
                </div>

                {/* Right Panel - Properties */}
                <div className="properties-panel">
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
                                    Auto-generate and customize captions
                                </p>
                                <button className="btn btn-primary" style={{ width: '100%', marginBottom: 'var(--spacing-md)' }}>
                                    Auto-Generate Captions
                                </button>
                                <div className="form-group">
                                    <label>Font Size</label>
                                    <input type="range" min="12" max="48" defaultValue="24" className="input" />
                                </div>
                                <div className="form-group">
                                    <label>Position</label>
                                    <select className="select">
                                        <option>Bottom</option>
                                        <option>Top</option>
                                        <option>Center</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {activePanel === 'music' && (
                            <div className="panel-section">
                                <p className="panel-description">
                                    Add background music to your video
                                </p>
                                <input type="file" accept="audio/*" className="input" style={{ marginBottom: 'var(--spacing-md)' }} />
                                <div className="form-group">
                                    <label>Volume</label>
                                    <input type="range" min="0" max="100" defaultValue="30" className="input" />
                                </div>
                                <button className="btn btn-primary" style={{ width: '100%' }}>
                                    Add Music
                                </button>
                            </div>
                        )}

                        {activePanel === 'language' && (
                            <div className="panel-section">
                                <p className="panel-description">
                                    Translate captions and voiceover
                                </p>
                                <div className="form-group">
                                    <label>Target Language</label>
                                    <select className="select">
                                        <option>Spanish</option>
                                        <option>French</option>
                                        <option>German</option>
                                        <option>Japanese</option>
                                        <option>Chinese</option>
                                    </select>
                                </div>
                                <button className="btn btn-primary" style={{ width: '100%' }}>
                                    Translate
                                </button>
                            </div>
                        )}

                        {activePanel === 'background' && (
                            <div className="panel-section">
                                <p className="panel-description">
                                    Change video background
                                </p>
                                <div className="form-group">
                                    <label>Background Type</label>
                                    <select className="select">
                                        <option>Color</option>
                                        <option>Blur</option>
                                        <option>Image</option>
                                    </select>
                                </div>
                                <div className="background-templates">
                                    <div className="template-item" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}></div>
                                    <div className="template-item" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}></div>
                                    <div className="template-item" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}></div>
                                    <div className="template-item" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}></div>
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
                                    <select className="select">
                                        <option>1920x1080 (Full HD)</option>
                                        <option>1280x720 (HD)</option>
                                        <option>3840x2160 (4K)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Frame Rate</label>
                                    <select className="select">
                                        <option>30 FPS</option>
                                        <option>60 FPS</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Quality</label>
                                    <select className="select">
                                        <option>High</option>
                                        <option>Ultra</option>
                                        <option>Medium</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {activePanel === 'files' && (
                            <div className="panel-section">
                                <p className="panel-description">
                                    Generated voiceover files and processed videos
                                </p>

                                {/* Audio Files */}
                                <div className="form-group">
                                    <label>🎵 Audio Files</label>
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
                                                style={{ marginTop: 'var(--spacing-xs)' }}
                                            >
                                                <Download size={16} />
                                                Download
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="empty-state-small">
                                            No audio files yet
                                        </div>
                                    )}
                                </div>

                                {/* Processed Videos */}
                                <div className="form-group">
                                    <label>🎬 Processed Videos</label>
                                    {project?.timeline?.tracks?.video?.filter(v => v.type === 'processed-voiceover').length > 0 ? (
                                        <div className="files-list">
                                            {project.timeline.tracks.video
                                                .filter(v => v.type === 'processed-voiceover')
                                                .map((vid, idx) => (
                                                    <div key={idx} className="file-item">
                                                        <div className="file-info">
                                                            <span className="file-name">With Voiceover #{idx + 1}</span>
                                                            <span className="file-type">.mp4</span>
                                                        </div>
                                                        <a
                                                            href={vid.url}
                                                            download
                                                            className="btn btn-secondary btn-sm"
                                                            style={{ marginTop: 'var(--spacing-xs)' }}
                                                        >
                                                            <Download size={16} />
                                                            Download
                                                        </a>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    ) : (
                                        <div className="empty-state-small">
                                            No processed videos yet
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
        .editor {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: var(--bg-primary);
          overflow: hidden;
        }

        .editor-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-md) var(--spacing-lg);
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
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

        .editor-main {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .editor-sidebar {
          width: 80px;
          background: var(--bg-secondary);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          padding: var(--spacing-md) 0;
          gap: var(--spacing-xs);
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

        .video-preview-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .video-preview {
          flex: 1;
          background: var(--bg-tertiary);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-xl);
          position: relative;
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
          box-shadow: var(--shadow-xl);
        }

        .main-video {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .preview-placeholder {
          text-align: center;
          color: var(--text-muted);
        }

        .preview-placeholder p {
          margin: var(--spacing-lg) 0;
        }

        .timeline {
          height: 120px;
          background: var(--bg-secondary);
          border-top: 1px solid var(--border);
          padding: var(--spacing-md);
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
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          color: var(--text-primary);
        }

        .current-badge {
          padding: 2px 8px;
          background: var(--primary);
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          color: white;
          font-weight: 600;
        }

        .properties-panel {
          width: 320px;
          background: var(--bg-secondary);
          border-left: 1px solid var(--border);
          padding: var(--spacing-lg);
          overflow-y: auto;
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
