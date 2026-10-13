import { useEffect, useState } from 'react';
import { AlertTriangle, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import api from '../../api';

export default function FacultyDashboardPage() {
  const [data, setData] = useState(null);
  const [scheduleDate, setScheduleDate] = useState(() => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10));
  const [weeklySchedule, setWeeklySchedule] = useState([]);
  const [scheduleError, setScheduleError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/faculty/dashboard');
        setData(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  useEffect(() => {
    let active = true;

    api.get('/faculty/schedule/week', { params: { date: scheduleDate } })
      .then((response) => {
        if (active) {
          setWeeklySchedule(response.data.data || []);
          setScheduleError('');
        }
      })
      .catch((err) => {
        if (active) {
          setWeeklySchedule([]);
          setScheduleError(err.response?.data?.message || 'Unable to load the assigned timetable.');
        }
      });

    return () => { active = false; };
  }, [scheduleDate]);

  const changeWeek = (offset) => {
    const nextDate = new Date(`${scheduleDate}T00:00:00Z`);
    nextDate.setUTCDate(nextDate.getUTCDate() + (offset * 7));
    setScheduleDate(nextDate.toISOString().slice(0, 10));
  };

  if (loading) {
    return <div className="status-box">Loading faculty dashboard...</div>;
  }

  if (error) {
    return <div className="error-box">{error}</div>;
  }

  if (!data) {
    return <div className="empty-state">No dashboard data is available.</div>;
  }

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Faculty dashboard</p>
          <h1>Welcome, {data.faculty.name}</h1>
          <p className="eyebrow">Faculty ID: {data.faculty.faculty_code} · Username: {data.faculty.username}</p>
        </div>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <Users size={18} />
          <div>
            <span>Assigned classes</span>
            <strong>{data.classes?.length || 0}</strong>
          </div>
        </div>
        <div className="stat-card">
          <BookOpen size={18} />
          <div>
            <span>Subjects</span>
            <strong>{data.subjects?.length || 0}</strong>
          </div>
        </div>
        <div className="stat-card">
          <CheckCircle2 size={18} />
          <div>
            <span>Present</span>
            <strong>{Number(data.summary.present_count || 0)}</strong>
          </div>
        </div>
        <div className="stat-card">
          <AlertTriangle size={18} />
          <div>
            <span>Absent</span>
            <strong>{Number(data.summary.absent_count || 0)}</strong>
          </div>
        </div>
      </section>

      <section className="table-card">
        <div className="table-header flex-row">
          <div>
            <h3>Assigned weekly timetable</h3>
            <p>Only sessions assigned to your faculty account are shown.</p>
          </div>
          <div className="row-actions">
            <button type="button" className="icon-button" aria-label="Previous week" title="Previous week" onClick={() => changeWeek(-1)}>
              <ChevronLeft size={16} />
            </button>
            <label>
              Week containing
              <input type="date" value={scheduleDate} onChange={(event) => setScheduleDate(event.target.value)} />
            </label>
            <button type="button" className="icon-button" aria-label="Next week" title="Next week" onClick={() => changeWeek(1)}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        {scheduleError ? <div className="error-box">{scheduleError}</div> : null}
        {weeklySchedule.some((item) => item.source_note) ? (
          <div className="warning-box">Derived demo timetable entries are not official section timetables.</div>
        ) : null}
        {weeklySchedule.length ? (
          <table>
            <thead>
              <tr>
                <th>Day</th>
                <th>Date</th>
                <th>Time</th>
                <th>Section</th>
                <th>Subject</th>
                <th>Room</th>
                <th>Session</th>
              </tr>
            </thead>
            <tbody>
              {weeklySchedule.map((item) => (
                <tr key={`${item.schedule_id}-${item.schedule_date}`}>
                  <td>{item.day_name}</td>
                  <td>{item.schedule_date}</td>
                  <td>{item.start_time} - {item.end_time}</td>
                  <td>{item.section}</td>
                  <td>{item.subject_name}</td>
                  <td>{item.room || 'Not specified'}</td>
                  <td>{item.session_type.replace(/([a-z])([A-Z])/g, '$1 $2')}{Number(item.attendance_enabled) ? '' : ' · No attendance'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : !scheduleError ? (
          <div className="empty-state">No assigned sessions are scheduled for this week.</div>
        ) : null}
      </section>

      <section className="info-panel full-width">
        <h3>Assigned classes and subjects</h3>
        <ul className="feature-list compact">
          {data.classes?.length ? (
            data.classes.map((item) => (
              <li key={`${item.class_name}-${item.section}`}>
                {item.class_name} {item.section} • {item.academic_year}
              </li>
            ))
          ) : (
            <li>No classes are assigned yet.</li>
          )}
        </ul>
        <p>Subjects: {data.subjects?.length ? data.subjects.map((subject) => subject.subject_name).join(', ') : 'No subjects are assigned yet.'}</p>
      </section>

      <section className="table-card">
        <div className="table-header">
          <h3>Recent attendance records</h3>
        </div>

        {data.recentRecords?.length ? (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Subject</th>
                <th>Present</th>
                <th>Absent</th>
              </tr>
            </thead>
            <tbody>
              {data.recentRecords.map((row) => (
                <tr key={`${row.attendance_date}-${row.subject_name}`}>
                  <td>{row.attendance_date}</td>
                  <td>{row.subject_name}</td>
                  <td>{row.present_count}</td>
                  <td>{row.absent_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">No attendance records available.</div>
        )}
      </section>
    </div>
  );
}
