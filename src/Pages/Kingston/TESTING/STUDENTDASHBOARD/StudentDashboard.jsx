
import "./studash.css";
import { money } from "../../../../Components/Great/money";

function StudentDashboard() {
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

      <main>
        <div className="ttop">
          <div className="rfv">
            <p className="vih">YOUR SCHOOL AT A GLANCE</p>
            <h1>Welcome back, Kingston ✦</h1>
            <p>Here's what's happening at your school today.</p>
          </div>
        </div>

        <p>First term · 2026 / 2027</p>

        <div className="grid1">
          <div className="gg">
            <p>My attendance</p>
            <p>95%</p>
            <p>This term</p>
          </div>

          <div className="gg">
            <p>Average score</p>
            <p>84%</p>
            <p>Latest assessments</p>
          </div>

          <div className="gg">
            <p>Subjects</p>
            <p>9</p>
            <p>Current enrollment</p>
          </div>

          <div className="gg">
            <p>Fee balance</p>
            <p>{money(20000)}</p>
            <p>Outstanding</p>
          </div>
        </div>

        <div className="grid3">
          <div className="wdc">
            <h3>Upcoming events &amp; exams</h3>
            <a href="#" className="cal">Calendar</a>
          </div>

          <hr />

          <div className="gg2">
            <div className="zx">
              <p>OCT</p>
              <p>19</p>
            </div>
            <div className="zx">
              <p>Inter-house sports day</p>
              <p>Event · 10:00</p>
            </div>
          </div>

          <hr />

          <div className="gg2">
            <div className="zx">
              <p>OCT</p>
              <p>23</p>
            </div>
            <div className="zx">
              <p>Parent–teacher conference</p>
              <p>Event · 13:00</p>
            </div>
          </div>

          <hr />

          <div className="gg2">
            <div className="zx">
              <p>NOV</p>
              <p>3</p>
            </div>
            <div className="zx">
              <p>First term examinations</p>
              <p>Exam · 09:00</p>
            </div>
          </div>
        </div>

        <div className="grid4">
          <div className="wdc">
            <h3>Today's timetable</h3>
          </div>

          <hr />

          <div className="gg2">
            <div className="zx">
              <p>08:00</p>
            </div>
            <div className="zx">
              <p>Mathematics</p>
              <p>SS3 · Room 209</p>
            </div>
          </div>

          <hr />

          <div className="gg2">
            <div className="zx">
              <p>10:00</p>
            </div>
            <div className="zx">
              <p>English Language</p>
              <p>SS3 · Room 132</p>
            </div>
          </div>

          <hr />

          <div className="gg2">
            <div className="zx">
              <p>12:00</p>
            </div>
            <div className="zx">
              <p>Physics</p>
              <p>SS3 · Physics lab</p>
            </div>
          </div>
        </div>

        <div className="ann">
          <div className="wcc">
            <h3>Keep the school connected</h3>
            <p>Updates that reach the people who matter.</p>
          </div>
          <a href="#" className="cal">School announcements</a>
        </div>
      </main>

      <footer>
        <p>Apexbrigde College · Made for better school days · Since 2013</p>
      </footer>
    </>
  );
}

export default StudentDashboard;
