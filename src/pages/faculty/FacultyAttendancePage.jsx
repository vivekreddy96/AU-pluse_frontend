import { useEffect, useMemo, useState } from 'react';
import { Check, Search, X } from 'lucide-react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';

const EMPTY_FORM = {
  className: '',
  section: '',
  subjectId: '',
  scheduleId: '',
  date: '',
  sessionType: 'Theory',
  durationHours: '1'
};

export default function FacultyAttendancePage() {
  const [sections, setSections] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [recordIds, setRecordIds] = useState({});
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [rosterStatus, setRosterStatus] = useState('idle');
  const [rosterError, setRosterError] = useState('');
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const classesResponse = await api.get('/faculty/classes');

        if (!Array.isArray(classesResponse.data.data)) {
          throw new Error('The assigned classes response is not a list.');
        }
        setSections(classesResponse.data.data);
      } catch (err) {
        setError(getRequestError(err, 'Unable to load your assigned classes.'));
      }
    };

    loadCatalog();
  }, []);

  useEffect(() => {
    let active = true;

    const loadSchedules = async () => {
      if (!form.date || !form.section) {
        setSchedules([]);
        setScheduleError('');
        return;
      }

      setScheduleLoading(true);
      setScheduleError('');
      try {
        const response = await api.get('/faculty/schedule', {
          params: { date: form.date, section: form.section }
        });
        if (!Array.isArray(response.data.data)) {
          throw new Error('The scheduled classes response is not a list.');
        }
        if (active) setSchedules(response.data.data);
      } catch (err) {
        if (active) {
          setSchedules([]);
          setScheduleError(getRequestError(err, 'Unable to load scheduled sessions.'));
        }
      } finally {
        if (active) setScheduleLoading(false);
      }
    };

    loadSchedules();
    return () => { active = false; };
  }, [form.date, form.section]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = 'You have unsaved attendance changes.';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const availableSections = useMemo(
    () => [...new Set(sections.map((item) => item.section))].sort(),
    [sections]
  );

  const scheduleSubjects = useMemo(
    () => [...new Map(schedules.filter((schedule) => Number(schedule.attendance_enabled) === 1)
      .map((schedule) => [schedule.subject_id, schedule])).values()],
    [schedules]
  );

  const subjectSchedules = useMemo(
    () => schedules.filter((schedule) => Number(schedule.attendance_enabled) === 1
      && String(schedule.subject_id) === form.subjectId),
    [schedules, form.subjectId]
  );

  const filteredStudents = useMemo(() => {
    const value = searchTerm.trim().toLowerCase();

    return [...students]
      .filter((student) => {
        if (!value) return true;
        return (
          student.roll_no.toLowerCase().includes(value) ||
          student.name.toLowerCase().includes(value)
        );
      })
      .sort((left, right) => left.roll_no.localeCompare(right.roll_no));
  }, [students, searchTerm]);

  const presentCount = students.filter((student) => attendanceMap[student.id] === 'Present').length;
  const absentCount = students.filter((student) => attendanceMap[student.id] === 'Absent').length;

  const loadStudents = async () => {
    const { section } = form;
    if (!section || !form.date || !form.scheduleId) {
      setStudents([]);
      setRosterStatus('idle');
      setRosterError('Choose a date, section, subject, and scheduled session before loading the roster.');
      return false;
    }

    setStudentsLoading(true);
    setRosterStatus('loading');
    setRosterError('');
    setError('');
    setSuccess('');

    try {
      const selectedSchedule = schedules.find((schedule) => String(schedule.schedule_id) === form.scheduleId);
      console.info('[attendance] Loading roster', {
        facultyCode: user?.facultyCode || selectedSchedule?.faculty_code || null,
        scheduleId: form.scheduleId,
        classId: selectedSchedule?.class_id ?? null,
        subjectId: form.subjectId,
        section: form.section,
        date: form.date
      });
      const response = await api.get('/faculty/students', {
        params: { section, scheduleId: form.scheduleId, date: form.date }
      });
      console.info('[attendance] Roster response', {
        status: response.status,
        responseKeys: Object.keys(response.data || {}),
        dataType: Array.isArray(response.data?.data) ? 'array' : typeof response.data?.data,
        studentCount: Array.isArray(response.data?.data) ? response.data.data.length : null
      });
      if (!Array.isArray(response.data?.data)) {
        throw new Error('The roster response did not contain a student list.');
      }

      const list = response.data.data;
      if (list.some((student) => student.id == null || !student.roll_no || !student.name)) {
        throw new Error('The roster response contains incomplete student records.');
      }
      setStudents(list);
      setAttendanceMap({});
      setRecordIds({});
      setSessionId(null);
      setHasUnsavedChanges(false);

      const historyResponse = await api.get('/attendance/history', {
        params: {
          date: form.date,
          subjectId: form.subjectId,
          className: selectedSchedule?.class_name,
          section: form.section
        }
      });
      if (!Array.isArray(historyResponse.data?.data)) {
        throw new Error('The attendance history response did not contain a session list.');
      }

      const timeValue = (value) => String(value || '').slice(0, 5);
      const candidates = historyResponse.data.data.filter((session) =>
        timeValue(session.start_time) === timeValue(selectedSchedule?.start_time)
        && timeValue(session.end_time) === timeValue(selectedSchedule?.end_time)
      );
      if (candidates.length > 1) {
        throw new Error('More than one saved session matches this timetable slot. Contact an administrator.');
      }

      if (candidates.length === 1) {
        const existingResponse = await api.get(`/attendance/session/${candidates[0].session_id}`);
        const existing = existingResponse.data?.data;
        if (!Array.isArray(existing?.records)) {
          throw new Error('The saved attendance response did not contain student records.');
        }

        const rosterIds = new Set(list.map((student) => String(student.id)));
        if (existing.records.length !== list.length
          || existing.records.some((record) => !rosterIds.has(String(record.student_id)))) {
          throw new Error('Saved attendance does not match the current roster. Attendance was not changed.');
        }

        setSessionId(existing.session.id);
        setAttendanceMap(existing.records.reduce((statuses, record) => ({
          ...statuses,
          [record.student_id]: record.status
        }), {}));
        setRecordIds(existing.records.reduce((ids, record) => ({
          ...ids,
          [record.student_id]: record.record_id
        }), {}));
      }

      setRosterStatus(list.length ? 'success' : 'empty');
      return true;
    } catch (err) {
      console.error('[attendance] Roster request failed', {
        status: err.response?.status ?? null,
        responseKeys: Object.keys(err.response?.data || {})
      });
      setRosterError(getRequestError(err, 'Unable to load attendance roster.'));
      setRosterStatus('error');
      setStudents([]);
      return false;
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    if (hasUnsavedChanges && ['date', 'section', 'subjectId'].includes(name)
      && !window.confirm('Discard unsaved attendance marks?')) {
      return;
    }

    if (name === 'date' || name === 'section') {
      setSchedules([]);
      setStudents([]);
      setRosterStatus('idle');
      setRosterError('');
      setSessionId(null);
      setHasUnsavedChanges(false);
      setForm((previous) => ({
        ...previous,
        [name]: value,
        className: '',
        subjectId: '',
        scheduleId: ''
      }));
      return;
    }

    if (name === 'subjectId') {
      setStudents([]);
      setRosterStatus('idle');
      setRosterError('');
      setSessionId(null);
      setForm((previous) => ({ ...previous, subjectId: value, scheduleId: '' }));
      return;
    }

    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleScheduleChange = (event) => {
    if (hasUnsavedChanges && !window.confirm('Discard unsaved attendance marks?')) {
      return;
    }

    const schedule = schedules.find((item) => String(item.schedule_id) === event.target.value);
    setStudents([]);
    setRosterStatus('idle');
    setRosterError('');
    setSessionId(null);
    setHasUnsavedChanges(false);
    setForm((previous) => ({
      ...previous,
      scheduleId: event.target.value,
      classId: schedule?.class_id || '',
      className: schedule?.class_name || '',
      sessionType: schedule?.session_type || 'Theory',
      durationHours: String(schedule?.duration_hours || 1)
    }));
  };

  const updateStatus = (studentId, status) => {
    setAttendanceMap((previous) => ({ ...previous, [studentId]: status }));
    setHasUnsavedChanges(true);
  };

  const markAll = (status) => {
    const nextMap = students.reduce((accumulator, student) => ({
      ...accumulator,
      [student.id]: status
    }), {});

    setAttendanceMap(nextMap);
    setHasUnsavedChanges(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.className || !form.section || !form.subjectId || !form.scheduleId || !form.date) {
      setError('Please select a date, section, subject, and scheduled session.');
      return;
    }

    if (!students.length) {
      setError('Load the student roster before saving attendance.');
      return;
    }

    if (students.some((student) => !['Present', 'Absent'].includes(attendanceMap[student.id]))) {
      setError('Mark every student Present or Absent before saving attendance.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        className: form.className,
        section: form.section,
        subjectId: Number(form.subjectId),
        scheduleId: Number(form.scheduleId),
        date: form.date,
        records: students.map((student) => ({
          studentId: student.id,
          ...(sessionId ? { recordId: recordIds[student.id] } : {}),
          status: attendanceMap[student.id]
        }))
      };

      if (sessionId) {
        await api.put(`/attendance/session/${sessionId}`, { records: payload.records });
      } else {
        await api.post('/attendance', payload);
      }
      const refreshed = await loadStudents();
      if (!refreshed) {
        setError('Attendance was accepted by the backend, but the saved records could not be reloaded.');
        return;
      }
      setSuccess('Attendance saved successfully.');
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('[attendance] Save request failed', {
        status: err.response?.status ?? null,
        responseKeys: Object.keys(err.response?.data || {})
      });
      setError(getRequestError(err, 'Unable to save attendance.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-stack">
      <div className="page-header">
        <p className="eyebrow">Faculty attendance</p>
        <h1>Record class attendance</h1>
      </div>

      {hasUnsavedChanges ? (
        <div className="warning-box">You have unsaved attendance changes.</div>
      ) : null}

      <div className="card-grid two-column">
        <div className="form-card">
          <form onSubmit={handleSubmit} className="stack-form">
            <label>
              Date
              <input type="date" name="date" value={form.date} onChange={handleInputChange} />
            </label>

            <label>
              Section
              <select name="section" value={form.section} onChange={handleInputChange}>
                <option value="">Select section</option>
                {availableSections.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>

            <label>
              Subject
              <select name="subjectId" value={form.subjectId} onChange={handleInputChange}>
                <option value="">Select subject for this date</option>
                {scheduleSubjects.map((schedule) => (
                  <option key={schedule.subject_id} value={schedule.subject_id}>{schedule.subject_name}</option>
                ))}
              </select>
            </label>

            <label>
              Scheduled session
              <select name="scheduleId" value={form.scheduleId} onChange={handleScheduleChange} disabled={!form.subjectId}>
                <option value="">Select scheduled session</option>
                {subjectSchedules.map((schedule) => (
                  <option key={schedule.schedule_id} value={schedule.schedule_id}>
                    {schedule.start_time} - {schedule.end_time} ({schedule.session_type})
                  </option>
                ))}
              </select>
            </label>

            <label>
              Session type and duration
              <input type="text" value={form.scheduleId ? `${form.sessionType} · ${form.durationHours} hours` : 'Selected from timetable'} readOnly />
            </label>

            <div className="row-actions">
              <button type="button" className="secondary-button" onClick={loadStudents} disabled={!form.scheduleId || studentsLoading}>
                Load Student Roster
              </button>
            </div>

            {error ? <div className="error-box">{error}</div> : null}
            {success ? <div className="success-box">{success}</div> : null}

            <button type="submit" className="primary-button" disabled={loading || studentsLoading || !students.length}>
              {loading ? 'Saving...' : 'Save Attendance'}
            </button>
          </form>
        </div>

        <div className="info-panel full-height">
          <h3>Session details</h3>
          <ul className="feature-list compact">
            <li>Mark all students as Present or Absent in bulk.</li>
            <li>Session type supports Theory and Practical scheduling.</li>
            <li>Practical sessions keep the full duration on one saved session.</li>
            <li>Only the assigned faculty can save and edit this attendance.</li>
          </ul>
        </div>
      </div>

      {studentsLoading ? <div className="status-box">Loading students...</div> : null}

      {!studentsLoading && rosterStatus === 'error' ? <div className="error-box">{rosterError}</div> : null}
      {!studentsLoading && rosterStatus === 'empty' ? (
        <div className="empty-state">No students are assigned to this class.</div>
      ) : null}

      {!studentsLoading && rosterStatus === 'success' && students.length > 0 ? (
        <div className="table-card">
          <div className="table-header flex-row">
            <h3>Student roster</h3>
            <div className="cell-search">
              <Search size={14} />
              <input
                type="text"
                value={searchTerm}
                placeholder="Search by roll number or name"
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </div>

          <div className="bulk-actions">
            <button type="button" className="secondary-button" onClick={() => markAll('Present')}>
              Mark All Present
            </button>
            <button type="button" className="secondary-button danger" onClick={() => markAll('Absent')}>
              Mark All Absent
            </button>
          </div>

          <div className="summary-row">
            <span>Students: {students.length}</span>
            <span>Present: {presentCount}</span>
            <span>Absent: {absentCount}</span>
          </div>

          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Roll Number</th>
                <th>Student Name</th>
                <th>Attendance Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, index) => (
                <tr key={student.id}>
                  <td>{index + 1}</td>
                  <td>{student.roll_no}</td>
                  <td>{student.name}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        type="button"
                        className={`toggle-button ${attendanceMap[student.id] === 'Present' ? 'active' : ''}`}
                        onClick={() => updateStatus(student.id, 'Present')}
                      >
                        <Check size={14} />
                        Present
                      </button>
                      <button
                        type="button"
                        className={`toggle-button ${attendanceMap[student.id] === 'Absent' ? 'active' : ''}`}
                        onClick={() => updateStatus(student.id, 'Absent')}
                      >
                        <X size={14} />
                        Absent
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {scheduleLoading ? <div className="status-box">Loading available classes...</div> : null}
      {scheduleError ? <div className="error-box">{scheduleError}</div> : null}
    </div>
  );
}

function getRequestError(error, fallback) {
  const status = error.response?.status;
  const message = error.response?.data?.message;

  if (status === 401) return 'Your session has expired. Please log in again.';
  if (status === 403) return message || 'You are not authorized to access this class or attendance session.';
  if (status === 404) return message || 'The class or attendance session was not found.';
  if (status === 422 || status === 400) return message || 'The attendance request contains invalid data.';
  if (status >= 500) return message || 'The backend could not complete the request. Please try again later.';
  return message || error.message || fallback;
}
