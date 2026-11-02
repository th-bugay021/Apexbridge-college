
import "./AccountantDashboard.css";
import { classLabel } from "../../../../config/school";
import { money } from "../../../../Components/Great/money";

function AccountantDashboard() {
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

      <main>
        <div className="ttop">
          <div className="rfv">
            <p className="vih">THE SCHOOL AT A GLANCE</p>
            <h1>Welcome back, Mr Money ✦</h1>
            <p>Here's what's happening at the school today.</p>
          </div>
        </div>

        <p>First term · 2026 / 2027</p>

        <div className="grid1">
          <div className="gg">
            <p>Fees collected</p>
            <p>{money(4800000)}</p>
            <p>This month</p>
          </div>

          <div className="gg">
            <p>Outstanding fees</p>
            <p>{money(1200000)}</p>
            <p>Current term</p>
          </div>

          <div className="gg">
            <p>Payments received</p>
            <p>72</p>
            <p>This month</p>
          </div>

          <div className="gg">
            <p>Collection rate</p>
            <p>805</p>
            <p>Against target</p>
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

        <div className="grid5">
          <div className="wdc">
            <h3>Recent payments</h3>
            <p>This week</p>
          </div>

          <hr />

          <div className="wdc">
            <div className="wq">
              <p>Olivia Eze</p>
              <p>Tuition · SS 2</p>
            </div>
            <div className="wq">
              <p>{money(85000)}</p>
              <p>Paid</p>
            </div>
          </div>

          <hr />

          <div className="wdc">
            <div className="wq">
              <p>Samuel Johnson</p>
              <p>Tuition · {classLabel(7)}</p>
            </div>
            <div className="wq">
              <p>{money(65000)}</p>
              <p>Paid</p>
            </div>
          </div>

          <hr />

          <div className="wdc">
            <div className="wq">
              <p>Fatima Yusuf</p>
              <p>Tuition · SS 1</p>
            </div>
            <div className="wq">
              <p>{money(85000)}</p>
              <p>Paid</p>
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

export default AccountantDashboard;
