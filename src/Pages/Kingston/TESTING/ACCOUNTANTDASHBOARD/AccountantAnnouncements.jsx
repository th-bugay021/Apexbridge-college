
import "./AccountantDashboard.css";
import { SHOW_SAMPLE_DATA_LABELS } from "../../../../config/sampleDataLabels";

function AccountantAnnouncements() {
  return (
    <>
      <nav>
        <a href="#">
          <img
            src="/ACCOUNTANTDASHBOARD/apexbridge-primary-logo.png"
            alt="Apexbridge Logo"
            height="50"
          />
        </a>

        <div className="navlinks">
          <a href="/ACCOUNTANTDASHBOARD/acdash.html" className="slink">
            Overview
          </a>
          <a href="/ACCOUNTANTDASHBOARD/acannoun.html" className="slink">
            Announcements
          </a>
          <a href="/ACCOUNTANTDASHBOARD/acmess.html" className="slink">
            Messages
          </a>
          <a href="/ACCOUNTANTDASHBOARD/acevc.html" className="slink">
            Events calendar
          </a>
        </div>

        <a href="/SELECTLOGIN/select.html" className="sout">
          Sign out
        </a>
      </nav>

      <main className="annm">
        <p>SCHOOL COMMUNICATION</p>

        <div className="wdv">
          <p>Announcements</p>
          <button type="button">New announcements</button>
        </div>

        <p>The latest updates for your school community.</p>

        <input
          type="search"
          placeholder="Search announcements..."
        />

        <div className="anb">
          <div className="yui">
            <p>Everyone</p>
            <p>Oct 1, 2026</p>
            <p></p>
          </div>

          <p>Welcome to a new school term</p>
          <p>
            {SHOW_SAMPLE_DATA_LABELS && "Sample announcement · "}Welcome back to Greenfield Academy. We look
            forward to a term filled with learning, growth, and new
            opportunities.
          </p>
        </div>

        <div className="anb">
          <div className="yui">
            <p>Parent</p>
            <p>Oct 1, 2026</p>
          </div>

          <p>Parent–teacher conference</p>
          <p>
            {SHOW_SAMPLE_DATA_LABELS && "Sample announcement · "}Join us on 9 October to meet your child's
            teachers and discuss their progress.
          </p>
        </div>

        <footer>
          <p>Greenfield Academy · Made for better school days</p>
        </footer>
      </main>

      <footer>
        <p>Apexbridge College · Made for better school days</p>
      </footer>
    </>
  );
}

export default AccountantAnnouncements;
