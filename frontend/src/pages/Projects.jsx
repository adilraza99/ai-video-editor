import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import { Video, FolderPlus, LogOut, Settings, Trash2, Edit } from 'lucide-react';

const Projects = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data.data);
    } catch (error) {
      toast.error('Failed to load projects');
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
      navigate(`/editor/${newProject._id}`);
    } catch (error) {
      toast.error('Failed to create project');
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
      toast.error('Failed to delete project');
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
    <div className="projects-page">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content container">
          <div className="logo-section">
            <Video size={32} />
            <h2>Clueso Clone</h2>
          </div>

          <nav className="nav-menu">
            <Link to="/" className="nav-link">Dashboard</Link>
            <Link to="/projects" className="nav-link active">Projects</Link>
          </nav>

          <div className="header-actions">
            <button className="btn btn-secondary btn-sm">
              <Settings size={16} />
              Settings
            </button>
            <button onClick={() => { logout(); navigate('/login'); }} className="btn btn-secondary btn-sm">
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
                  <div className="project-overlay">
                    <button
                      className="overlay-btn"
                      onClick={(e) => deleteProject(project._id, e)}
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
                  <h3>{project.name}</h3>
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
          gap: var(--spacing-sm);
        }

        .projects-main {
          padding: var(--spacing-2xl) var(--spacing-lg);
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-2xl);
        }

        .page-header h1 {
          margin-bottom: var(--spacing-xs);
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
          transition: all var(--transition-normal);
        }

        .project-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
          border-color: var(--primary);
        }

        .project-card:hover .project-overlay {
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

        .project-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-sm);
          opacity: 0;
          transition: opacity var(--transition-fast);
        }

        .overlay-btn {
          padding: var(--spacing-sm);
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .overlay-btn:hover {
          background: var(--error);
          border-color: var(--error);
          transform: scale(1.1);
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
          margin-top: var (--spacing-lg);
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
          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--spacing-md);
          }

          .page-header button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default Projects;
