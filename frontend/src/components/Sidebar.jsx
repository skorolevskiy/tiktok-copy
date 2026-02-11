export default function Sidebar({ active, onNavigate, isOpen, onToggle }) {
  const links = [
    { id: 'avatars', icon: 'fa-user-circle', label: 'Аватары' },
    { id: 'references', icon: 'fa-film', label: 'Референсы' },
    { id: 'motions', icon: 'fa-running', label: 'Генерация' },
    { id: 'tracks', icon: 'fa-music', label: 'Треки' },
    { id: 'montage', icon: 'fa-wand-magic-sparkles', label: 'Монтаж' },
  ];

  const handleNav = (id) => {
    onNavigate(id);
    if (onToggle) onToggle(false);
  };

  return (
    <>
      <button className="hamburger" onClick={() => onToggle(!isOpen)}>
        <i className={`fas ${isOpen ? 'fa-times' : 'fa-bars'}`}></i>
      </button>

      {isOpen && (
        <div
          className="sidebar-overlay active"
          onClick={() => onToggle(false)}
        />
      )}

      <nav className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <i className="fas fa-film"></i>
          <span>Video Service</span>
        </div>
        <ul className="nav-links">
          {links.map((link) => (
            <li key={link.id}>
              <a
                href="#"
                className={`nav-link ${active === link.id ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNav(link.id);
                }}
              >
                <i className={`fas ${link.icon}`}></i> {link.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="sidebar-footer">
          <a
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="docs-link"
          >
            <i className="fas fa-book"></i> API Docs
          </a>
        </div>
      </nav>
    </>
  );
}
