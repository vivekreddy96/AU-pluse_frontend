import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [role, setRole] = useState('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await login(role, identifier, password);
      const redirectPath = location.state?.from || (response.user.role === 'faculty' ? '/faculty/dashboard' : '/student/dashboard');
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to log in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-mark small">AU</div>
          <div>
            <h1>AUPluse</h1>
            <p>Sign in to continue</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="login-role-selector" role="group" aria-label="Account type">
            <button
              type="button"
              className={role === 'student' ? 'selected' : ''}
              aria-pressed={role === 'student'}
              onClick={() => { setRole('student'); setIdentifier(''); setError(''); }}
            >
              Student
            </button>
            <button
              type="button"
              className={role === 'faculty' ? 'selected' : ''}
              aria-pressed={role === 'faculty'}
              onClick={() => { setRole('faculty'); setIdentifier(''); setError(''); }}
            >
              Faculty
            </button>
          </div>

          <label>
            {role === 'student' ? 'College Email' : 'Username'}
            <input
              type={role === 'student' ? 'email' : 'text'}
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value.trim())}
              placeholder={role === 'student' ? '24eg112a24@anurag.edu.in' : 'faculty001'}
              autoCapitalize="none"
              autoComplete="username"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error ? <div className="error-box">{error}</div> : null}

          <button type="submit" className="primary-button submit-button" disabled={loading}>
            <LogIn size={16} />
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
