import { Link, NavLink, useNavigate } from 'react-router-dom';
import { BookOpen, GraduationCap, LayoutDashboard, LogOut, ShieldCheck, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = user?.role === 'faculty'
    ? [
        { to: '/faculty/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/faculty/attendance', label: 'Attendance', icon: BookOpen },
        { to: '/faculty/history', label: 'History', icon: ShieldCheck },
        { to: '/profile', label: 'Profile', icon: UserCircle }
      ]
    : [
        { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/student/attendance', label: 'Attendance', icon: BookOpen },
        { to: '/student/history', label: 'History', icon: ShieldCheck },
        { to: '/profile', label: 'Profile', icon: UserCircle }
      ];

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark">AU</div>
          <div>
            <div className="brand-name">AUPluse</div>
            <div className="brand-subtitle">Smart Attendance Management System</div>
          </div>
        </div>

        <nav className="main-nav" aria-label="Main navigation">
          {!user ? (
            <>
              <NavLink to="/">Home</NavLink>
              <NavLink to="/privacy">Privacy Policy</NavLink>
              <NavLink to="/terms">Terms</NavLink>
              <Link to="/login" className="nav-button">Login</Link>
            </>
          ) : (
            <>
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} className="nav-link">
                  <Icon size={16} />
                  <span>{label}</span>
                </NavLink>
              ))}
              <button type="button" className="logout-button" onClick={handleLogout}>
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </>
          )}
        </nav>
      </header>

      <main className="page-content">{children}</main>

      <footer className="site-footer">
        <div>
          <strong>AUPluse</strong>
          <span>Smart Attendance Management System</span>
        </div>
        <div>Anurag University</div>
        <div className="footer-links">
          <Link to="/">Home</Link>
          <Link to="/login">Login</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms and Conditions</Link>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
