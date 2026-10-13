import { useEffect, useState } from 'react';
import api from '../../api';

export default function StudentHistoryPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get('/student/attendance/history');
        setRecords(response.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load attendance history.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return <div className="status-box">Loading attendance history...</div>;
  }

  if (error) {
    return <div className="error-box">{error}</div>;
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <p className="eyebrow">Student history</p>
        <h1>Attendance history</h1>
      </div>

      {records.length ? (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Subject</th>
                <th>Faculty</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={`${record.attendance_date}-${record.subject_name}-${record.faculty_name}`}>
                  <td>{record.attendance_date}</td>
                  <td>{record.subject_name}</td>
                  <td>{record.faculty_name}</td>
                  <td>
                    <span className={`status-badge ${record.status === 'Present' ? 'present' : 'absent'}`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">No attendance history is available.</div>
      )}
    </div>
  );
}
