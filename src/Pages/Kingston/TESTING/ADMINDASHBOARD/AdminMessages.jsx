
import "./AdminDashboard.css";

function AdminMessages() {
  return (
    <>
      <nav>
        <a href="">
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

      <main className="yhn">
        <p>SCHOOL COMMUNICATION</p>

        <div className="wdv">
          <p>Messages</p>
          <button type="button">New message</button>
        </div>

        <p>
          A shared school inbox for parent and teacher conversations.
        </p>

        <input
          type="search"
          name="search"
          id="message-search"
          placeholder="Search messages..."
        />

        <div className="dcv">
          <p>No messages yet</p>
          <p>Use the button above to start a conversation.</p>
        </div>
      </main>

      <footer>
        <p>Apexbridge College · Made for better school days</p>
      </footer>
    </>
  );
}

export default AdminMessages;
