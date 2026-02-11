import { NavLink } from 'react-router-dom';

export default function Sidebar({ isOpen, onToggle }) {
  const links = [
    { path: '/avatars', icon: 'fa-user-circle', label: 'Аватары' },
    { path: '/references', icon: 'fa-film', label: 'Референсы' },
    { path: '/motions', icon: 'fa-running', label: 'Генерация' },
    { path: '/tracks', icon: 'fa-music', label: 'Треки' },
    { path: '/montage', icon: 'fa-wand-magic-sparkles', label: 'Монтаж' },
  ];

  const handleNav = () => {
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
            <li key={link.path}>
              <NavLink
                to={link.path}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={handleNav}
              >
                <i className={`fas ${link.icon}`}></i> {link.label}
              </NavLink>
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
