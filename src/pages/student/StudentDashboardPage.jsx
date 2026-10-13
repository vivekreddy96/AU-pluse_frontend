import { useEffect, useState } from 'react';
import { AlertTriangle, BookOpen, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../api';

export default function StudentDashboardPage() {
  const [data, setData] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [weeklySchedule, setWeeklySchedule] = useState([]);
  const [scheduleDate, setScheduleDate] = useState(() => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scheduleError, setScheduleError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/student/dashboard');
        setData(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load student dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  useEffect(() => {
    let active = true;

    api.get('/student/schedule', { params: { date: scheduleDate } })
      .then((response) => {
        if (active) {
          setSchedule(response.data.data || []);
          setScheduleError('');
        }
      })
      .catch((err) => {
        if (active) {
          setSchedule([]);
          setScheduleError(err.response?.data?.message || 'Unable to load your schedule.');
        }
      });

    return () => { active = false; };
  }, [scheduleDate]);

  useEffect(() => {
    let active = true;

    api.get('/student/schedule/week', { params: { date: scheduleDate } })
      .then((response) => {
        if (active) setWeeklySchedule(response.data.data || []);
      })
      .catch((err) => {
        if (active) {
          setWeeklySchedule([]);
          setScheduleError(err.response?.data?.message || 'Unable to load your weekly timetable.');
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
    return <div className="status-box">Loading attendance summary...</div>;
  }

  if (error) {
    return <div className="error-box">{error}</div>;
  }

  if (!data) {
    return <div className="empty-state">No attendance data is available.</div>;
  }

  const belowThreshold = data.summary.attendance_percentage < 75;

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Student dashboard</p>
          <h1>{data.student.name}</h1>
          <p>{data.student.roll_no} · Section {data.student.section} · {data.student.email}</p>
        </div>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <BookOpen size={18} />
          <div>
            <span>Roll number</span>
            <strong>{data.student.roll_no}</strong>
          </div>
        </div>
        <div className="stat-card">
          <CalendarDays size={18} />
          <div>
            <span>Section</span>
            <strong>{data.student.section}</strong>
          </div>
        </div>
        <div className="stat-card">
          <CheckCircle2 size={18} />
          <div>
            <span>Present</span>
            <strong>{data.summary.present_count}</strong>
          </div>
        </div>
        <div className="stat-card">
          <AlertTriangle size={18} />
          <div>
            <span>Absent</span>
            <strong>{data.summary.absent_count}</strong>
          </div>
        </div>
        <div className="stat-card">
          <CheckCircle2 size={18} />
          <div>
            <span>Overall attendance</span>
            <strong>{data.summary.attendance_percentage}%</strong>
          </div>
        </div>
      </section>

      {belowThreshold ? (
        <div className="warning-box">
          Your attendance is below the required threshold.
        </div>
      ) : null}

      <section className="table-card">
        <div className="table-header">
          <h3>Subject-wise attendance</h3>
        </div>

        {data.subjectSummary?.length ? (
          <table>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Total Classes</th>
                <th>Attendance</th>
              </tr>
            </thead>
            <tbody>
              {data.subjectSummary.map((subject) => (
                <tr key={subject.subject_name}>
                  <td>{subject.subject_name}</td>
                  <td>{subject.present_count}</td>
                  <td>{subject.absent_count}</td>
                  <td>{subject.total_records}</td>
                  <td>{subject.attendance_percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">No attendance records available.</div>
        )}
      </section>

      <section className="table-card">
        <div className="table-header flex-row">
          <h3>Today's schedule · Section {data.student.section}</h3>
          <label>
            Date
            <input type="date" value={scheduleDate} onChange={(event) => setScheduleDate(event.target.value)} />
          </label>
        </div>
        {scheduleError ? <div className="error-box">{scheduleError}</div> : null}
        {schedule.length ? (
          <table>
            <thead>
              <tr>
                <th>Day</th>
                <th>Subject</th>
                <th>Time</th>
                <th>Faculty</th>
                <th>Session</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((item) => (
                <tr key={`${item.subject_code}-${item.start_time}`}>
                  <td>{item.day_name}</td>
                  <td>{item.subject_name}</td>
                  <td>{item.start_time} - {item.end_time}</td>
                  <td>{item.faculty_name}</td>
                  <td>{item.session_type} · {Number(item.duration_hours)} hrs{Number(item.attendance_enabled) ? '' : ' · No attendance'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : !scheduleError ? (
          <div className="empty-state">No classes are scheduled for this date.</div>
        ) : null}
      </section>

      <section className="table-card">
        <div className="table-header flex-row">
          <div>
            <h3>Weekly timetable · Section {data.student.section}</h3>
            <p>Lunch break: 12:40 PM - 1:20 PM</p>
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
        {weeklySchedule.some((item) => item.source_note) ? (
          <div className="warning-box">Derived demo timetable based on the IT-B reference; not an official IT-{data.student.section} timetable.</div>
        ) : null}
        {weeklySchedule.length ? (
          <table>
            <thead>
              <tr>
                <th>Day</th>
                <th>Date</th>
                <th>Time</th>
                <th>Subject</th>
                <th>Faculty</th>
                <th>Room</th>
                <th>Session type</th>
              </tr>
            </thead>
            <tbody>
              {weeklySchedule.map((item) => (
                <tr key={`${item.schedule_date}-${item.start_time}-${item.subject_code}`}>
                  <td>{item.day_name}</td>
                  <td>{item.schedule_date}</td>
                  <td>{item.start_time} - {item.end_time}</td>
                  <td>{item.subject_name}</td>
                  <td>{item.faculty_name}</td>
                  <td>{item.room || 'Not specified'}</td>
                  <td>{item.session_type.replace(/([a-z])([A-Z])/g, '$1 $2')}{Number(item.attendance_enabled) ? '' : ' · No attendance'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : !scheduleError ? (
          <div className="empty-state">No timetable entries are active for this week.</div>
        ) : null}
      </section>

      <section className="table-card">
        <div className="table-header">
          <h3>Recent attendance</h3>
        </div>

        {data.recentRecords?.length ? (
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
              {data.recentRecords.map((row) => (
                <tr key={`${row.attendance_date}-${row.subject_name}-${row.faculty_name}`}>
                  <td>{row.attendance_date}</td>
                  <td>{row.subject_name}</td>
                  <td>{row.faculty_name}</td>
                  <td>
                    <span className={`status-badge ${row.status === 'Present' ? 'present' : 'absent'}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">No recent attendance is available.</div>
        )}
      </section>
    </div>
  );
}
