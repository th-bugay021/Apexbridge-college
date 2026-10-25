
import "./pdash.css";

function ParentMessages() {
  return (
    <>
      <nav>
        <a href="">
          <img src="/PARENTDASHBOARD/apexbridge-primary-logo.png" alt="" height="50" />
        </a>
        <div className="navlinks">
          <a href="/PARENTDASHBOARD/pdash.html" className="slink">Overview</a>
          <a href="/PARENTDASHBOARD/pannoun.html" className="slink">Announcements</a>
          <a href="/PARENTDASHBOARD/pmess.html" className="slink">Messages</a>
          <a href="/PARENTDASHBOARD/pevc.html" className="slink">Events calendar</a>
        </div>

        <a href="/SELECTLOGIN/select.html" className="sout">Sign out</a>
      </nav>

      <main className="yhn">
        <p>SCHOOL COMMUNICATION</p>
        <div className="wdv">
          <p>Messgaes</p>
          <button>New message</button>
        </div>
        <p>A shared school inbox for parent and teacher conversations.</p>
        <input type="search" name="" id="" placeholder="Search messages..." />

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

export default ParentMessages;
