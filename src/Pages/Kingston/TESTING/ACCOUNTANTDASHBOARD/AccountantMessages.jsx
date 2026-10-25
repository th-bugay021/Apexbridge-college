
import "./AccountantDashboard.css";

function AccountantMessages() {
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

      <main className="yhn">
        <p>SCHOOL COMMUNICATION</p>

        <div className="wdv">
          <p>Messgaes</p>
          <button type="button">New message</button>
        </div>

        <p>
          A shared school inbox for parent and teacher conversations.
        </p>

        <input
          type="search"
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

export default AccountantMessages;
