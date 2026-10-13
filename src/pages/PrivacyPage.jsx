export default function PrivacyPage() {
  return (
    <div className="content-page">
      <div className="page-header">
        <p className="eyebrow">Privacy Policy</p>
        <h1>How AUPluse handles student and faculty information</h1>
      </div>

      <div className="policy-card">
        <h3>Account information</h3>
        <p>
          AUPluse stores the login credentials used for access control in a secure backend database. User account records include a username, password hash, and role assignment.
        </p>

        <h3>Student and faculty profile information</h3>
        <p>
          Student and faculty profile information such as name, roll number, section, faculty code, email, and assigned academic details may be stored for system access and attendance management.
        </p>

        <h3>Attendance information</h3>
        <p>
          Attendance records are stored in the database to support faculty marking, student viewing, and percentage calculation. These records are used to maintain an accurate academic record.
        </p>

        <h3>How information is used</h3>
        <p>
          AUPluse uses this information to authenticate users, record attendance, calculate subject-wise attendance, and allow faculty and students to view relevant records.
        </p>

        <h3>Access control</h3>
        <p>
          The backend enforces role-based access. Faculty can only access attendance workflows for authorized academic activities, and students can only view their own attendance records.
        </p>

        <h3>Data storage and security</h3>
        <p>
          Data is stored in a MySQL database and protected through secure authentication and authorization checks. Passwords are stored as hashed values and are never exposed in application responses.
        </p>

        <h3>Data retention</h3>
        <p>
          Attendance records and profile information are retained for academic use within the system as needed for the institution's attendance processes. Records may be reviewed or updated as part of normal system operations.
        </p>

        <h3>Contact</h3>
        <p>
          For privacy questions, contact the Anurag University academic support team or the system administrator responsible for AUPluse.
        </p>
      </div>
    </div>
  );
}
