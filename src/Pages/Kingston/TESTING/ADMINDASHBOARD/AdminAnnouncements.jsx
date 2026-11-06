
import "./AdminDashboard.css";

function AdminAnnouncements() {
  return (
    <>
      <nav>
        <a href="#">
          <img
            src="/ADMINDASHBOARD/apexbridge-primary-logo.png"
            alt="Apexbridge Logo"
            height="50"
          />
        </a>

        <div className="navlinks">
          <a href="/ADMINDASHBOARD/dash.html" className="slink">
            Overview
          </a>
          <a href="/ADMINDASHBOARD/announ.html" className="slink">
            Announcements
          </a>
          <a href="/ADMINDASHBOARD/mess.html" className="slink">
            Messages
          </a>
          <a href="/ADMINDASHBOARD/evc.html" className="slink">
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
            Sample announcement · Welcome back to Greenfield Academy. We look
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
            Sample announcement · Join us on 9 October to meet your child's
            teachers and discuss their progress.
          </p>
        </div>
      </main>

      <footer>
        <p>Apexbridge College · Made for better school days</p>
      </footer>
    </>
  );
}

export default AdminAnnouncements;
