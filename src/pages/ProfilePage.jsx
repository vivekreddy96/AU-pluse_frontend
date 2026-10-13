import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return undefined;

    let active = true;
    const endpoint = user.role === 'faculty' ? '/faculty/dashboard' : '/student/dashboard';
    api.get(endpoint)
      .then((response) => {
        if (active) setProfile(response.data.data?.faculty || response.data.data?.student || null);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || 'Unable to load profile details.');
      });

    return () => { active = false; };
  }, [user]);

  if (!user) {
    return <div className="empty-state">No user profile available.</div>;
  }

  const account = profile || user;

  return (
    <div className="content-page">
      <div className="page-header">
        <p className="eyebrow">Profile</p>
        <h1>Account details</h1>
      </div>

      {error ? <div className="error-box">{error}</div> : null}

      <div className="profile-card">
        <h3>{account.name || user.username}</h3>
        <div className="detail-grid">
          <div>
            <span className="label">Role</span>
            <strong>{user.role}</strong>
          </div>
          <div>
            <span className="label">{user.role === 'faculty' ? 'Faculty ID' : 'Roll number'}</span>
            <strong>{user.role === 'faculty' ? (account.faculty_code || user.facultyCode || 'Not assigned') : account.roll_no || 'Not available'}</strong>
          </div>
          <div>
            <span className="label">Username</span>
            <strong>{account.username || user.username}</strong>
          </div>
          <div>
            <span className="label">College email</span>
            <strong>{account.email || user.email || 'Not available'}</strong>
          </div>
          {user.role === 'student' ? (
            <div>
              <span className="label">Section</span>
              <strong>{account.section || 'Not available'}</strong>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
