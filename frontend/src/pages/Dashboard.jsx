import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import {
  Video,
  Upload,
  FolderPlus,
  LogOut,
  User,
  Play,
  Clock,
  TrendingUp
} from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalVideos: 0,
    minutesProcessed: 0
  });
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        // Silently redirect to login
        navigate('/login');
        return;
      }

      const response = await api.get('/projects');
      const projectsData = response.data.data || [];

      // Show latest 6 projects
      setProjects(projectsData.slice(0, 6));

      // Calculate actual stats from the project data
      const totalVideos = projectsData.reduce((acc, project) => {
        const videoCount = project?.timeline?.tracks?.video?.length || 0;
        return acc + videoCount;
      }, 0);

      setStats({
        totalProjects: response.data.count || projectsData.length,
        totalVideos: totalVideos,
        minutesProcessed: user?.usage?.minutesProcessed || 0
      });
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      // Silently redirect to login for any error during initial load
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      toast.success('Logged out successfully');
      navigate('/login');
    }
  };

  const createNewProject = async () => {
    try {
      const response = await api.post('/projects', {
        name: `Untitled Project ${projects.length + 1}`,
        description: ''
      });

      const newProject = response.data.data;
      navigate(`/editor/${newProject._id}`);
    } catch (error) {
      toast.error('Failed to create project');
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
      // Create a new project first
      const projectResponse = await api.post('/projects', {
        name: file.name.replace(/\.[^/.]+$/, ''),
        description: 'Uploaded video project'
      });

      const newProject = projectResponse.data.data;

      // Upload video
      const formData = new FormData();
      formData.append('video', file);
      formData.append('projectId', newProject._id);

      await api.post('/videos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Video uploaded successfully!');
      navigate(`/editor/${newProject._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload video');
    } finally {
      setUploading(false);
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
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content container">
          <div className="logo-section">
            <Video size={32} />
            <h2>Clueso Clone</h2>
          </div>

          <nav className="nav-menu">
            <Link to="/" className="nav-link active">Dashboard</Link>
            <Link to="/projects" className="nav-link">Projects</Link>
          </nav>

          <div className="header-actions">
            <div className="user-profile-wrapper">
              <div
                className="user-profile"
                onClick={() => setProfileOpen(!profileOpen)}
              >
                <div className="user-avatar">
                  <User size={18} />
                </div>
                <div className="user-info">
                  <div className="user-name">{user?.name}</div>
                  <div className="user-email">{user?.email}</div>
                </div>
              </div>

              {profileOpen && (
                <div className="profile-dropdown">
                  <div className="dropdown-header">
                    <div className="avatar-large">
                      <User size={32} />
                    </div>
                    <div>
                      <div className="dropdown-name">{user?.name}</div>
                      <div className="dropdown-email">{user?.email}</div>
                    </div>
                  </div>

                  <div className="dropdown-divider"></div>

                  <div className="dropdown-stats">
                    <div className="stat-item">
                      <span className="stat-label">Projects</span>
                      <span className="stat-value">{stats.totalProjects}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Videos</span>
                      <span className="stat-value">{stats.totalVideos}</span>
                    </div>
                  </div>

                  <div className="dropdown-divider"></div>

                  <div className="dropdown-actions">
                    <button className="dropdown-btn" onClick={() => navigate('/projects')}>
                      <Video size={16} />
                      My Projects
                    </button>
                    <button className="dropdown-btn danger" onClick={() => { setProfileOpen(false); handleLogout(); }}>
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main container">
        {/* Welcome Section */}
        <section className="welcome-section staggered-reveal" style={{ '--delay': '0.1s' }}>
          <div className="welcome-content">
            <h1>Welcome back, {user?.name}! 👋</h1>
            <p>Create incredible product videos with AI in minutes</p>
          </div>

          <div className="quick-actions">
            <button onClick={createNewProject} className="btn btn-primary">
              <FolderPlus size={20} />
              New Project
            </button>
            <button
              onClick={() => document.getElementById('video-upload-dashboard').click()}
              className="btn btn-secondary"
              disabled={uploading}
            >
              <Upload size={20} />
              {uploading ? 'Uploading...' : 'Upload Video'}
            </button>
            <input
              id="video-upload-dashboard"
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              style={{ display: 'none' }}
            />
          </div>
        </section>

        {/* Stats Cards */}
        <section className="stats-grid">
          <div className="stat-card staggered-reveal" style={{ '--delay': '0.2s' }}>
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <FolderPlus size={24} />
            </div>
            <div className="stat-content">
              <h3>{stats.totalProjects}</h3>
              <p>Total Projects</p>
            </div>
          </div>

          <div className="stat-card staggered-reveal" style={{ '--delay': '0.3s' }}>
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #ec4899, #f43f5e)' }}>
              <Video size={24} />
            </div>
            <div className="stat-content">
              <h3>{stats.totalVideos}</h3>
              <p>Videos Created</p>
            </div>
          </div>

          <div className="stat-card staggered-reveal" style={{ '--delay': '0.4s' }}>
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #14b8a6)' }}>
              <Clock size={24} />
            </div>
            <div className="stat-content">
              <h3>{stats.minutesProcessed}</h3>
              <p>Minutes Processed</p>
            </div>
          </div>
        </section>

        {/* Recent Projects */}
        <section className="projects-section staggered-reveal" style={{ '--delay': '0.5s' }}>
          <div className="section-header">
            <h2>Recent Projects</h2>
            <Link to="/projects" className="view-all">View All →</Link>
          </div>

          {projects.length === 0 ? (
            <div className="empty-state">
              <Video size={64} style={{ opacity: 0.5 }} />
              <h3>No projects yet</h3>
              <p>Create your first project to get started</p>
              <button onClick={createNewProject} className="btn btn-primary">
                <FolderPlus size={20} />
                Create Project
              </button>
            </div>
          ) : (
            <div className="projects-grid">
              {projects.map((project) => (
                <div
                  key={project._id}
                  className="project-card"
                  onClick={() => navigate(`/editor/${project._id}`)}
                >
                  <div className="project-thumbnail">
                    {project.thumbnail ? (
                      <img src={project.thumbnail} alt={project.name} />
                    ) : (
                      <div className="thumbnail-placeholder">
                        <Video size={48} />
                      </div>
                    )}
                    <div className="project-status">
                      {project.status === 'completed' && (
                        <span className="status-badge success">Completed</span>
                      )}
                      {project.status === 'processing' && (
                        <span className="status-badge warning">Processing</span>
                      )}
                      {project.status === 'draft' && (
                        <span className="status-badge">Draft</span>
                      )}
                    </div>
                  </div>

                  <div className="project-info">
                    <h3>{project.name}</h3>
                    <p>{project.description || 'No description'}</p>
                    <div className="project-meta">
                      <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <style>{`
        .dashboard {
          min-height: 100vh;
          background: #0f1115; /* Dark studio background */
        }

        .staggered-reveal {
          opacity: 0;
          animation: staggeredFadeIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          animation-delay: var(--delay, 0s);
        }

        @keyframes staggeredFadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dashboard-header {
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
          padding: var(--spacing-md) 0;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--spacing-lg);
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          color: var(--primary);
        }

        .logo-section h2 {
          margin: 0;
          font-size: 1.25rem;
        }

        .nav-menu {
          display: flex;
          gap: var(--spacing-md);
        }

        .nav-link {
          padding: var(--spacing-sm) var(--spacing-md);
          color: var(--text-secondary);
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }

        .nav-link:hover {
          color: var(--text-primary);
          background: var(--bg-hover);
        }

        .nav-link.active {
          color: var(--primary);
          background: var(--bg-tertiary);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }
        
        .user-profile-wrapper {
          position: relative;
        }
        
        .user-profile {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        
        .user-profile:hover {
          background: var(--bg-hover);
          border-color: var(--primary);
        }
        
        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        
        .user-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .user-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        
        .user-email {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
        
        .profile-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 320px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          z-index: 1000;
          animation: slideDown 0.2s ease-out;
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .dropdown-header {
          padding: var(--spacing-lg);
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }
        
        .avatar-large {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        
        .dropdown-name {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        
        .dropdown-email {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
        
        .dropdown-divider {
          height: 1px;
          background: var(--border);
          margin: 0 var(--spacing-lg);
        }
        
        .dropdown-stats {
          padding: var(--spacing-md) var(--spacing-lg);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }
        
        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .stat-label {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
        
        .stat-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        
        .dropdown-actions {
          padding: var(--spacing-md) var(--spacing-lg) var(--spacing-lg);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }
        
        .dropdown-btn {
          width: 100%;
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        
        .dropdown-btn:hover {
          background: var(--bg-hover);
          border-color: var(--primary);
        }
        
        .dropdown-btn.danger:hover {
          background: var(--error);
          border-color: var(--error);
          color: white;
        }

        .dashboard-main {
          padding: var(--spacing-2xl) var(--spacing-lg);
        }

        .welcome-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-2xl);
          padding: var(--spacing-2xl);
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.05));
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          position: relative;
          overflow: hidden;
        }
        
        .welcome-section::before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.1), transparent);
          border-radius: 50%;
          transform: translate(30%, -30%);
        }

        .welcome-content {
          position: relative;
          z-index: 1;
        }

        .welcome-content h1 {
          margin-bottom: var(--spacing-sm);
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-size: 2.5rem;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .welcome-content p {
          color: var(--text-secondary);
          margin: 0;
          font-size: 1.125rem;
        }

        .quick-actions {
          display: flex;
          gap: var(--spacing-md);
          position: relative;
          z-index: 1;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-2xl);
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: var(--spacing-lg);
          padding: var(--spacing-xl);
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        
        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, transparent, rgba(99, 102, 241, 0.03));
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
          border-color: rgba(99, 102, 241, 0.3);
        }
        
        .stat-card:hover::before {
          opacity: 1;
        }

        .stat-icon {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-lg);
          color: white;
          position: relative;
          z-index: 1;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .stat-content h3 {
          font-size: 2.25rem;
          margin: 0;
          margin-bottom: var(--spacing-xs);
          font-weight: 700;
          background: linear-gradient(135deg, var(--text-primary), var(--text-secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .stat-content p {
          margin: 0;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .projects-section {
          margin-bottom: var(--spacing-2xl);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg);
        }

        .section-header h2 {
          margin: 0;
        }

        .view-all {
          color: var(--primary);
          font-weight: 600;
        }

        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: var(--spacing-lg);
        }

        .project-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }
        
        .project-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, transparent, rgba(99, 102, 241, 0.05));
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }

        .project-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.12);
          border-color: var(--primary);
        }
        
        .project-card:hover::after {
          opacity: 1;
        }

        .project-thumbnail {
          position: relative;
          width: 100%;
          aspect-ratio: 16/10;
          background: var(--bg-tertiary);
          overflow: hidden;
        }

        .project-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .thumbnail-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
        }

        .project-status {
          position: absolute;
          top: var(--spacing-sm);
          right: var(--spacing-sm);
        }

        .status-badge {
          padding: var(--spacing-xs) var(--spacing-sm);
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 600;
        }

        .status-badge.success {
          background: var(--success);
          border-color: var(--success);
          color: white;
        }

        .status-badge.warning {
          background: var(--warning);
          border-color: var(--warning);
          color: white;
        }

        .project-info {
          padding: var(--spacing-lg);
        }

        .project-info h3 {
          margin-bottom: var(--spacing-sm);
          font-size: 1.125rem;
        }

        .project-info p {
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin-bottom: var(--spacing-sm);
        }

        .project-meta {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .empty-state {
          text-align: center;
          padding: var(--spacing-2xl);
          background: var(--bg-card);
          border: 2px dashed var(--border);
          border-radius: var(--radius-lg);
        }

        .empty-state h3 {
          color: var(--text-secondary);
          margin-top: var(--spacing-lg);
        }

        .empty-state p {
          color: var(--text-muted);
          margin-bottom: var(--spacing-xl);
        }

        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }

        @media (max-width: 768px) {
          .welcome-section {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--spacing-lg);
          }

          .quick-actions {
            width: 100%;
            flex-direction: column;
          }

          .quick-actions .btn {
            width: 100%;
          }

          .header-content {
            flex-wrap: wrap;
          }

          .nav-menu {
            order: 3;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
