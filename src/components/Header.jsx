export default function Header({ user, profile, onViewChange, onLogout }) {
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-brand">
          <div className="logo">
            <span className="logo-icon">◆</span>
            <span className="logo-text">Commun</span>
          </div>
        </div>

        <nav className="header-nav">
          <button
            className="nav-btn"
            onClick={() => onViewChange('feed')}
          >
            Feed
          </button>
          <button
            className="nav-btn"
            onClick={() => onViewChange('profile')}
          >
            Profile
          </button>
        </nav>

        <div className="header-actions">
          <div className="user-menu">
            <span className="user-name">{profile?.display_name || user?.email}</span>
            <button className="btn btn-sm btn-outline" onClick={onLogout}>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
