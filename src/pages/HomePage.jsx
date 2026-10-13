import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, ClipboardCheck, ShieldCheck, Users } from 'lucide-react';

export default function HomePage() {
  const steps = [
    'Sign in',
    'Select class and subject',
    'Record attendance',
    'Students view updated records'
  ];

  return (
    <div className="page-stack">
      <section className="hero-section">
        <div>
          <p className="eyebrow">AUPluse</p>
          <h1>Smart Attendance Management System</h1>
          <p className="lead">
            A centralized platform for recording, managing, and viewing student attendance.
          </p>
          <p className="section-copy">
            Faculty can record attendance for their assigned classes and subjects. Students can view their attendance status and subject-wise attendance percentage from one place.
          </p>
          <div className="button-row">
            <Link to="/login" className="primary-button">
              Login
              <ArrowRight size={16} />
            </Link>
            <a href="#how-it-works" className="secondary-button">View how it works</a>
          </div>
        </div>

        <div className="info-panel">
          <h3>What AUPluse does</h3>
          <ul className="feature-list">
            <li>Faculty records attendance</li>
            <li>Attendance is stored centrally</li>
            <li>Students can view their records</li>
            <li>Attendance percentage is calculated from actual records</li>
          </ul>
        </div>
      </section>

      <section id="how-it-works" className="content-section">
        <div className="section-header">
          <p className="eyebrow">How it works</p>
          <h2>Simple attendance workflow</h2>
        </div>

        <div className="steps-grid">
          {steps.map((step, index) => (
            <div key={step} className="step-card">
              <div className="step-number">{index + 1}</div>
              <p>{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="content-section split-grid">
        <div className="info-card">
          <div className="card-icon"><Users size={18} /></div>
          <h3>Faculty</h3>
          <p>
            Faculty can sign in, choose their class and subject, review live student lists, and record attendance for each session.
          </p>
        </div>
        <div className="info-card">
          <div className="card-icon"><BookOpen size={18} /></div>
          <h3>Students</h3>
          <p>
            Students can access their attendance records, check subject-wise percentages, and review attendance history from their profile.
          </p>
        </div>
      </section>

      <section className="content-section split-grid narrow">
        <div className="info-card">
          <div className="card-icon"><ClipboardCheck size={18} /></div>
          <h3>Faculty tools</h3>
          <p>
            Record attendance, review previous sessions, and manage class attendance records with secure backend validation.
          </p>
        </div>
        <div className="info-card">
          <div className="card-icon"><ShieldCheck size={18} /></div>
          <h3>Security and data</h3>
          <p>
            Access is role-based and attendance data is managed through the backend database with secure authentication and authorization checks.
          </p>
        </div>
      </section>
    </div>
  );
}
