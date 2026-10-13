import { useEffect, useMemo, useState } from 'react';
import api from '../../api';

export default function FacultyHistoryPage() {
  const [records, setRecords] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionRecords, setSessionRecords] = useState([]);
  const [audit, setAudit] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHistory = async () => {
    try {
      const response = await api.get('/attendance/history');
      setRecords(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load attendance history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    api.get('/attendance/history')
      .then((response) => {
        if (active) setRecords(response.data.data || []);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || 'Unable to load attendance history.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  const openSession = async (sessionId) => {
    try {
      const response = await api.get(`/attendance/session/${sessionId}`);
      const payload = response.data.data || {};
      setSelectedSession(payload.session || null);
      setSessionRecords(payload.records || []);
      setAudit(payload.audit || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load this attendance session.');
    }
  };

  const handleStatusUpdate = (recordId, status) => {
    setSessionRecords((previous) => previous.map((record) => {
      if (record.record_id !== recordId) return record;
      return { ...record, status };
    }));
  };

  const saveSessionChanges = async () => {
    if (!selectedSession) return;

    const confirmed = window.confirm('Save attendance changes?');
    if (!confirmed) return;

    try {
      await api.put(`/attendance/session/${selectedSession.id}`, {
        records: sessionRecords.map((record) => ({
          recordId: record.record_id,
          studentId: record.student_id,
          status: record.status
        })),
        reason: 'Faculty corrected attendance record.'
      });
      await fetchHistory();
      await openSession(selectedSession.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update attendance.');
    }
  };

  const summaryRows = useMemo(
    () => records.map((record) => ({
      ...record,
      key: `${record.attendance_date}-${record.subject_name}-${record.class_name}-${record.section}-${record.session_type}`
    })),
    [records]
  );

  if (loading) {
    return <div className="status-box">Loading attendance history...</div>;
  }

  if (error) {
    return <div className="error-box">{error}</div>;
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <p className="eyebrow">Attendance history</p>
        <h1>Previously recorded attendance</h1>
      </div>

      {summaryRows.length ? (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Subject</th>
                <th>Class</th>
                <th>Section</th>
                <th>Type</th>
                <th>Time</th>
                <th>Duration</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {summaryRows.map((record) => (
                <tr key={record.key}>
                  <td>{record.attendance_date}</td>
                  <td>{record.subject_name}</td>
                  <td>{record.class_name}</td>
                  <td>{record.section}</td>
                  <td>{record.session_type || 'Theory'}</td>
                  <td>{record.start_time && record.end_time ? `${record.start_time} - ${record.end_time}` : '—'}</td>
                  <td>{Number(record.duration_hours || 0)} hrs</td>
                  <td>{Number(record.present_count || 0)}</td>
                  <td>{Number(record.absent_count || 0)}</td>
                  <td>
                    <button type="button" className="secondary-button" onClick={() => openSession(record.session_id)}>
                      Edit Attendance
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">No attendance history is available.</div>
      )}

      {selectedSession ? (
        <div className="table-card">
          <div className="table-header">
            <h3>
              {selectedSession.subject_name} • {selectedSession.class_name} • {selectedSession.section}
            </h3>
            <p>
              {selectedSession.attendance_date} • {selectedSession.start_time && selectedSession.end_time ? `${selectedSession.start_time} - ${selectedSession.end_time} • ` : ''}{selectedSession.session_type} • {Number(selectedSession.duration_hours || 0)} hour(s)
            </p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Roll Number</th>
                <th>Student Name</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sessionRecords.map((record) => (
                <tr key={record.record_id}>
                  <td>{record.roll_no}</td>
                  <td>{record.name}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        type="button"
                        className={`toggle-button ${record.status === 'Present' ? 'active' : ''}`}
                        onClick={() => handleStatusUpdate(record.record_id, 'Present')}
                      >
                        Present
                      </button>
                      <button
                        type="button"
                        className={`toggle-button ${record.status === 'Absent' ? 'active' : ''}`}
                        onClick={() => handleStatusUpdate(record.record_id, 'Absent')}
                      >
                        Absent
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="row-actions pad-top">
            <button type="button" className="primary-button" onClick={saveSessionChanges}>
              Save Attendance Changes
            </button>
          </div>
        </div>
      ) : null}

      {selectedSession && audit.length ? (
        <div className="table-card">
          <div className="table-header">
            <h3>Attendance change history</h3>
          </div>
          <table>
            <thead>
              <tr>
                <th>Roll Number</th>
                <th>Previous</th>
                <th>New</th>
                <th>Changed By</th>
                <th>Timestamp</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {audit.map((entry, index) => (
                <tr key={`${entry.record_id}-${entry.changed_at}-${index}`}>
                  <td>{entry.roll_no}</td>
                  <td>{entry.previous_status}</td>
                  <td>{entry.new_status}</td>
                  <td>{entry.faculty_name} ({entry.faculty_code}, {entry.username})</td>
                  <td>{entry.changed_at}</td>
                  <td>{entry.reason || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
