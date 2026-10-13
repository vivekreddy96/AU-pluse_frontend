import { useEffect, useState } from 'react';
import api from '../../api';

export default function StudentAttendancePage() {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await api.get('/student/attendance/summary');
        setSummary(response.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load attendance summary.');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) {
    return <div className="status-box">Loading attendance data...</div>;
  }

  if (error) {
    return <div className="error-box">{error}</div>;
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <p className="eyebrow">Student attendance</p>
        <h1>Subject-wise attendance</h1>
      </div>

      {summary.length ? (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((item) => (
                <tr key={item.subject_name}>
                  <td>{item.subject_name}</td>
                  <td>{item.present_count}</td>
                  <td>{item.absent_count}</td>
                  <td>{item.attendance_percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">No attendance records available.</div>
      )}
    </div>
  );
}
