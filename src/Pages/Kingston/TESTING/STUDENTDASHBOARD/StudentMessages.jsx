
import "./studash.css";

function StudentMessages() {
  return (
    <>
      <nav>
        <a href="">
          <img src="/STUDENTDASHBOARD/apexbridge-primary-logo.png" alt="" height="50" />
        </a>
        <div className="navlinks">
          <a href="/STUDENTDASHBOARD/studash.html" className="slink">Overview</a>
          <a href="/STUDENTDASHBOARD/stuannoun.html" className="slink">Announcements</a>
          <a href="/STUDENTDASHBOARD/stumess.html" className="slink">Messages</a>
          <a href="/STUDENTDASHBOARD/stuevc.html" className="slink">Events calendar</a>
        </div>

        <a href="/SELECTLOGIN/select.html" className="sout">Sign out</a>
      </nav>

      <main className="yhn">
        <p>SCHOOL COMMUNICATION</p>
        <div className="wdv">
          <p>Messgaes</p>
          {/* <button>New message</button> */}
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

export default StudentMessages;
