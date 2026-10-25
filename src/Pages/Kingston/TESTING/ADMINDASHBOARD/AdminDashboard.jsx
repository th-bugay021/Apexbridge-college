
import "./AdminDashboard.css";

function AdminDashboard() {
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

      <main>
        <div className="ttop">
          <div className="rfv">
            <p className="vih">YOUR SCHOOL AT A GLANCE</p>
            <h1>Welcome back, Admin ✦</h1>
            <p>Here's what's happening at your school today.</p>
          </div>
        </div>

        <p>First term · 2026 / 2027</p>

        <div className="grid1">
          <div className="gg">
            <p>Total students</p>
            <p>948</p>
            <p>Across 6 classes</p>
          </div>

          <div className="gg">
            <p>Teaching staff</p>
            <p>64</p>
            <p>12 departments</p>
          </div>

          <div className="gg">
            <p>Attendance today</p>
            <p>95.2%</p>
            <p>School-wide average</p>
          </div>

          <div className="gg">
            <p>Fees collected</p>
            <p>N4.8M</p>
            <p>This month</p>
          </div>
        </div>

        <div className="grid3">
          <div className="wdc">
            <h3>Upcoming events &amp; exams</h3>
            <a href="#" className="cal">calendar</a>
          </div>

          <hr />

          <div className="gg2">
            <div className="zx">
              <p>OCT</p>
              <p>9</p>
            </div>
            <div className="zx">
              <p>Parent–teacher conference</p>
              <p>Event · 10:00</p>
            </div>
          </div>

          <hr />

          <div className="gg2">
            <div className="zx">
              <p>OCT</p>
              <p>19</p>
            </div>
            <div className="zx">
              <p>First term examinations</p>
              <p>Exam · 08:00</p>
            </div>
          </div>

          <hr />

          <div className="gg2">
            <div className="zx">
              <p>OCT</p>
              <p>23</p>
            </div>
            <div className="zx">
              <p>Inter-house sports day</p>
              <p>Event · 09:00</p>
            </div>
          </div>
        </div>

        <div className="grid4">
          <div className="wdc">
            <h3>Recent Admissions</h3>
            <p>This week</p>
          </div>

          <div className="werr">
            <p>Student</p>
            <div className="qaz">
              <p>Class</p>
              <p>Status</p>
            </div>
          </div>

          <hr />

          <div className="wer">
            <div className="qax">
              <p>Amara Okafor</p>
              <p>28 Sep 2026</p>
            </div>
            <div className="qaz">
              <p>JSS1</p>
              <p>Approved</p>
            </div>
          </div>

          <hr />

          <div className="wer">
            <div className="qax">
              <p>Daniel Adebayo</p>
              <p>29 Sep 2026</p>
            </div>
            <div className="qaz">
              <p>SSS1</p>
              <p>Approved</p>
            </div>
          </div>

          <hr />

          <div className="wer">
            <div className="qax">
              <p>Zainab Bello</p>
              <p>30 Sep 2026</p>
            </div>
            <div className="qaz">
              <p>JSS2</p>
              <p>Pending</p>
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
              <p>₦85,000</p>
              <p>Paid</p>
            </div>
          </div>

          <hr />

          <div className="wdc">
            <div className="wq">
              <p>Samuel Johnson</p>
              <p>Tuition · JSS 1</p>
            </div>
            <div className="wq">
              <p>₦65,000</p>
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
              <p>₦85,000</p>
              <p>Paid</p>
            </div>
          </div>
        </div>

        <div className="ann">
          <div className="wcc">
            <h3>Keep your school connected</h3>
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

export default AdminDashboard;
