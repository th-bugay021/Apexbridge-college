
import "./pdash.css";
import { money } from "../../../../Components/Great/money";

function ParentDashboard() {
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

      <main>
        <div className="ttop">
          <div className="rfv">
            <p className="vih">THE SCHOOL AT A GLANCE</p>
            <h1>Welcome back, Mrs Arum ✦</h1>
            <p>Here's what's happening at the school today.</p>
          </div>
        </div>

        <p>First term · 2026 / 2027</p>

        <div className="grid1">
          <div className="gg">
            <p>Children enrolled</p>
            <p>2</p>
            <p>Current school year</p>
          </div>

          <div className="gg">
            <p>Average attendance</p>
            <p>96%</p>
            <p>This term</p>
          </div>

          <div className="gg">
            <p>Average score</p>
            <p>81%</p>
            <p>Latest assessments</p>
          </div>

          <div className="gg">
            <p>Fee balance</p>
            <p>{money(45000)}</p>
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
            <h3>My children</h3>
          </div>

          <hr />

          <div className="gg2">
            <div className="zx">
              <p>Kingston Arum</p>
              <p>SS3</p>
            </div>
            <div className="zx">
              <p>86% average</p>
              <p>98% attendance</p>
            </div>
          </div>

          <hr />

          <div className="gg2">
            <div className="zx">
              <p>Faith Arum</p>
              <p>JS1</p>
            </div>
            <div className="zx">
              <p>76% average</p>
              <p>94% attendance</p>
            </div>
          </div>

          <hr />
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

export default ParentDashboard;
