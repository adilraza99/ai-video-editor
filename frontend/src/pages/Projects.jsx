import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import { Video, FolderPlus, LogOut, Settings, Trash2, Edit2, Check, X } from 'lucide-react';

const Projects = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editName, setEditName] = useState('');

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    // Check authentication
    if (!user) {
      console.log('No user found, redirecting to login...');
      navigate('/login');
      return;
    }

    fetchProjects();
  }, [user, navigate]);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching projects...');
      const response = await api.get('/projects');
      console.log('Projects fetched:', response.data);

      setProjects(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      setError(error.response?.data?.message || 'Failed to load projects');

      // If unauthorized, redirect to login
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        logout();
        navigate('/login');
      } else {
        toast.error('Failed to load projects');
      }
    } finally {
      setLoading(false);
    }
  };

  const createNewProject = async () => {
    try {
      const response = await api.post('/projects', {
        name: `Untitled Project ${projects.length + 1}`,
        description: ''
      });

      const newProject = response.data.data;
      toast.success('Project created!');
      navigate(`/editor/${newProject._id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error(error.response?.data?.message || 'Failed to create project');
    }
  };

  const deleteProject = async (projectId, e) => {
    e.stopPropagation();

    if (!window.confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      await api.delete(`/projects/${projectId}`);
      setProjects(projects.filter(p => p._id !== projectId));
      toast.success('Project deleted');
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast.error('Failed to delete project');
    }
  };

  const startEditingProject = (project, e) => {
    e.stopPropagation();
    setEditingProject(project._id);
    setEditName(project.name);
  };

  const saveProjectName = async (projectId, e) => {
    if (e) e.stopPropagation();

    if (!editName.trim()) {
      toast.error('Project name cannot be empty');
      return;
    }

    try {
      await api.put(`/projects/${projectId}`, { name: editName });
      setProjects(projects.map(p => p._id === projectId ? { ...p, name: editName } : p));
      toast.success('Project renamed');
      setEditingProject(null);
    } catch (error) {
      console.error('Failed to rename project:', error);
      toast.error('Failed to rename project');
    }
  };

  const cancelEditing = (e) => {
    if (e) e.stopPropagation();
    setEditingProject(null);
    setEditName('');
  };

  // Loading State with Skeleton
  if (loading) {
    return (
      <div className="projects-page">
        <header className="dashboard-header">
          <div className="header-content container">
            <div className="logo-section">
              <Video size={32} />
              <h2>Clueso AI Editor</h2>
            </div>
          </div>
        </header>

        <main className="projects-main container">
          <div className="loading-state">
            <div className="spinner-large"></div>
            <p>Loading your projects...</p>
          </div>
        </main>

        <style>{`
          .loading-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 60vh;
            gap: var(--spacing-lg);
          }
          
          .spinner-large {
            width: 60px;
            height: 60px;
            border: 4px solid var(--bg-tertiary);
            border-top-color: var(--primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          
          .loading-state p {
            color: var(--text-secondary);
            font-size: 1.125rem;
          }
        `}</style>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="projects-page">
        <header className="dashboard-header">
          <div className="header-content container">
            <div className="logo-section">
              <Video size={32} />
              <h2>Clueso AI Editor</h2>
            </div>
            <div className="header-actions">
              <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="projects-main container">
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h2>Unable to Load Projects</h2>
            <p>{error}</p>
            <button onClick={fetchProjects} className="btn btn-primary">
              Try Again
            </button>
          </div>
        </main>

        <style>{`
          .error-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 60vh;
            gap: var(--spacing-lg);
            text-align: center;
          }
          
          .error-icon {
            font-size: 4rem;
            animation: shake 0.5s ease;
          }
          
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            75% { transform: translateX(10px); }
          }
          
          .error-state h2 {
            color: var(--error);
          }
          
          .error-state p {
            color: var(--text-secondary);
            max-width: 500px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="projects-page">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content container">
          <div className="logo-section">
            <Video size={32} />
            <h2>Clueso AI Editor</h2>
          </div>

          <nav className="nav-menu">
            <Link to="/" className="nav-link">Dashboard</Link>
            <Link to="/projects" className="nav-link active">Projects</Link>
          </nav>

          <div className="header-actions">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => toast.info('Settings feature coming soon!')}
            >
              <Settings size={16} />
              Settings
            </button>
            <button onClick={handleLogout} className="btn btn-secondary btn-sm">
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="projects-main container">
        <section className="page-header">
          <div>
            <h1>All Projects</h1>
            <p>Manage and edit your video projects</p>
          </div>
          <button onClick={createNewProject} className="btn btn-primary">
            <FolderPlus size={20} />
            New Project
          </button>
        </section>

        {projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Video size={64} />
            </div>
            <h3>No projects yet</h3>
            <p>Create your first project to get started with AI-powered video editing</p>
            <button onClick={createNewProject} className="btn btn-primary btn-lg">
              <FolderPlus size={20} />
              Create Your First Project
            </button>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((project, index) => (
              <div
                key={project._id}
                className="project-card"
                onClick={() => navigate(`/editor/${project._id}`)}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="project-thumbnail">
                  {project.thumbnail ? (
                    <img src={project.thumbnail} alt={project.name} />
                  ) : (
                    <div className="thumbnail-placeholder">
                      <Video size={48} />
                    </div>
                  )}
                  <div className="project-overlay">
                    <button
                      className="overlay-btn"
                      onClick={(e) => deleteProject(project._id, e)}
                      title="Delete project"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
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
                  {editingProject === project._id ? (
                    <div className="edit-name-container" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        className="edit-name-input"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveProjectName(project._id);
                          if (e.key === 'Escape') cancelEditing();
                        }}
                        autoFocus
                      />
                      <div className="edit-actions">
                        <button
                          className="edit-btn save"
                          onClick={() => saveProjectName(project._id)}
                          title="Save"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          className="edit-btn cancel"
                          onClick={cancelEditing}
                          title="Cancel"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="project-title-row">
                      <h3>{project.name}</h3>
                      <button
                        className="edit-icon-btn"
                        onClick={(e) => startEditingProject(project, e)}
                        title="Rename project"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                  )}
                  <p>{project.description || 'No description'}</p>
                  <div className="project-meta">
                    <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to log out? Any unsaved changes will be lost.</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowLogoutConfirm(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={confirmLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .projects-page {
          min-height: 100vh;
          background: var(--bg-primary);
        }

        .dashboard-header {
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
          padding: var(--spacing-md) 0;
          position: sticky;
          top: 0;
          z-index: 100;
          backdrop-filter: blur(10px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
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
          font-weight: 500;
        }

        .nav-link:hover {
          color: var(--text-primary);
          background: var(--bg-hover);
          transform: translateY(-1px);
        }

        .nav-link.active {
          color: var(--primary);
          background: var(--bg-tertiary);
        }

        .header-actions {
          display: flex;
          gap: var(--spacing-sm);
        }

        .projects-main {
          padding: var(--spacing-2xl) var(--spacing-lg);
          animation: fadeIn 0.5s ease;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-2xl);
          animation: slideInDown 0.4s ease;
        }

        .page-header h1 {
          margin-bottom: var(--spacing-xs);
          font-size: 2rem;
        }

        .page-header p {
          color: var(--text-secondary);
          margin: 0;
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
          animation: fadeInUp 0.4s ease both;
        }

        .project-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 12px 24px rgba(99, 102, 241, 0.2);
          border-color: var(--primary);
        }

        .project-card:hover .project-overlay {
          opacity: 1;
        }

        .project-thumbnail {
          position: relative;
          width: 100%;
          aspect-ratio: 16/10;
          background: linear-gradient(135deg, var(--bg-tertiary), var(--bg-hover));
          overflow: hidden;
        }

        .project-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .project-card:hover .project-thumbnail img {
          transform: scale(1.1);
        }

        .thumbnail-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
        }

        .project-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-sm);
          opacity: 0;
          transition: opacity var(--transition-fast);
        }

        .overlay-btn {
          padding: var(--spacing-md);
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: var(--radius-md);
          color: white;
          cursor: pointer;
          transition: all var(--transition-fast);
          backdrop-filter: blur(10px);
        }

        .overlay-btn:hover {
          background: var(--error);
          border-color: var(--error);
          transform: scale(1.15) rotate(5deg);
        }

        .project-status {
          position: absolute;
          top: var(--spacing-sm);
          right: var(--spacing-sm);
        }

        .status-badge {
          padding: var(--spacing-xs) var(--spacing-sm);
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 600;
          color: white;
        }

        .status-badge.success {
          background: var(--success);
          border-color: var(--success);
        }

        .status-badge.warning {
          background: var(--warning);
          border-color: var(--warning);
        }

        .project-info {
          padding: var(--spacing-lg);
        }

        .project-info h3 {
          margin-bottom: var(--spacing-sm);
          font-size: 1.125rem;
          color: var(--text-primary);
        }

        .project-info p {
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin-bottom: var(--spacing-sm);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .project-meta {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .project-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-sm);
        }

        .project-title-row h3 {
          margin-bottom: 0;
        }

        .edit-icon-btn {
          opacity: 0;
          padding: var(--spacing-xs);
          background: var(--bg-hover);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .project-card:hover .edit-icon-btn {
          opacity: 1;
        }

        .edit-icon-btn:hover {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
          transform: scale(1.1);
        }

        .edit-name-container {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-sm);
        }

        .edit-name-input {
          flex: 1;
          padding: var(--spacing-sm);
          background: var(--bg-tertiary);
          border: 2px solid var(--primary);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          font-size: 1rem;
          font-weight: 600;
        }

        .edit-name-input:focus {
          outline: none;
          border-color: var(--secondary);
          background: var(--bg-secondary);
        }

        .edit-actions {
          display: flex;
          gap: var(--spacing-xs);
        }

        .edit-btn {
          padding: var(--spacing-xs);
          border: 1px solid transparent;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .edit-btn.save {
          background: var(--success);
          color: white;
        }

        .edit-btn.save:hover {
          background: var(--success);
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(67, 233, 123, 0.3);
        }

        .edit-btn.cancel {
          background: var(--bg-tertiary);
          color: var(--text-secondary);
        }

        .edit-btn.cancel:hover {
          background: var(--error);
          color: white;
          transform: scale(1.1);
        }

        .empty-state {
          text-align: center;
          padding: var(--spacing-2xl) * 2;
          background: var(--bg-card);
          border: 2px dashed var(--border);
          border-radius: var(--radius-lg);
          animation: fadeInScale 0.5s ease;
        }

        .empty-icon {
          color: var(--text-muted);
          margin-bottom: var(--spacing-lg);
          animation: float 3s ease-in-out infinite;
        }

        .empty-state h3 {
          color: var(--text-primary);
          margin-top: var(--spacing-lg);
          font-size: 1.5rem;
        }

        .empty-state p {
          color: var(--text-secondary);
          margin-bottom: var(--spacing-xl);
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }

        .btn-lg {
          padding: var(--spacing-md) var(--spacing-xl);
          font-size: 1.125rem;
        }

        /* Animations */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }

        .modal-content {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: var(--spacing-xl);
          max-width: 400px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          animation: slideInDown 0.3s ease;
        }

        .modal-content h3 {
          margin: 0 0 var(--spacing-md);
          color: var(--text-primary);
        }

        .modal-content p {
          color: var(--text-secondary);
          margin-bottom: var(--spacing-lg);
          line-height: 1.6;
        }

        .modal-actions {
          display: flex;
          gap: var(--spacing-sm);
          justify-content: flex-end;
          position: relative;
          z-index: 1001;
        }

        .modal-actions .btn {
          min-width: 100px;
          pointer-events: auto;
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .header-content {
            flex-wrap: wrap;
          }
          
          .nav-menu {
            order: 3;
            width: 100%;
          }
          
          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--spacing-md);
          }

          .page-header button {
            width: 100%;
          }
          
          .projects-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Projects;
