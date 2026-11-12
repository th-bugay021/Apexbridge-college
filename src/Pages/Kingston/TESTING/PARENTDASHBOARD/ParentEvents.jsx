
import "./dash.css";
import { SHOW_SAMPLE_DATA_LABELS } from "../../../../config/sampleDataLabels";

function ParentEvents() {
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

      <main className="evcm">
        <p>SCHOOL COMMUNICATION</p>
        <div className="wdv">
          <p>Events calendar</p>
          {/* <button>Add event</button> */}
        </div>
        <p>School moments, important dates, and examinations.</p>

        <div className="cvb">
          <div className="lkm">
            <p>This month</p>
            <p>3 events</p>
          </div>

          <hr />

          <p>Event</p>
          <p>Parent–teacher conference</p>
          <p>2026-10-09 · 10:00</p>
          <p>{SHOW_SAMPLE_DATA_LABELS && "Sample event · "}Meet with class teachers to discuss student progress.</p>

          <hr />

          <p>Exam</p>
          <p>First term examinations</p>
          <p>2026-10-19 · 08:00</p>
          <p>{SHOW_SAMPLE_DATA_LABELS && "Sample exam · "}Students should arrive 30 minutes before their first paper.</p>

          <hr />

          <p>Event</p>
          <p>Inter-house sports day</p>
          <p>2026-10-23 · 09:00</p>
          <p>{SHOW_SAMPLE_DATA_LABELS && "Sample event · "}A day of teamwork and friendly competition.</p>
        </div>
      </main>

      <footer>
        <p>Apexbridge College · Made for better school days</p>
      </footer>
    </>
  );
}

export default ParentEvents;
