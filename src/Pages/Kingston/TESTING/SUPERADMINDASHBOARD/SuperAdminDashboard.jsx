
import "./spdash.css";

function SuperAdminDashboard() {
    return (
        <>
            <nav>
                <a href="">
                    <img src="apexbridge-primary-logo.png" alt="" height="50px" />
                </a>
                <div className="navlinks">
                    <a href="/SUPERADMINDASHBOARD/spdash.html" className="slink">Overview</a>
                    <a href="/SUPERADMINDASHBOARD/spannoun.html" className="slink">Announcements</a>
                    <a href="/SUPERADMINDASHBOARD/spmess.html" className="slink">Messages</a>
                    <a href="/SUPERADMINDASHBOARD/spevc.html" className="slink">Events calendar</a>
                </div>

                <a href="/SELECTLOGIN/select.html" className="sout">Sign out</a>
            </nav>

            <main>
                <div className="ttop">
                    <div className="rfv">
                        <p className="vih">YOUR SCHOOLs AT A GLANCE</p>
                        <h1>Welcome back, Supreme Kai ✦</h1>
                        <p>Here's what's happening at your schools today.</p>
                    </div>
                </div>

                <p>First term · 2026 / 2027</p>

                <div className="grid1">
                    <div className="gg">
                        <p>Total schools</p>
                        <p>3</p>
                        <p>Active campuses</p>
                    </div>

                    <div className="gg">
                        <p>Total students</p>
                        <p>2,846</p>
                        <p>12 departments</p>
                    </div>

                    <div className="gg">
                        <p>Total teachers</p>
                        <p>192</p>
                        <p>Across all schools</p>
                    </div>

                    <div className="gg">
                        <p>Fees collected</p>
                        <p>N14.4M</p>
                        <p>This month</p>
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
                        <h3>School's overview</h3>
                        <p>This week</p>
                    </div>

                    <div className="werr">
                        <p>School</p>
                        <div className="qaz">
                            <p>Students</p>
                            <p>Teachers</p>
                            <p>Status</p>
                            <p>Collection</p>
                        </div>
                    </div>

                    <hr />

                    <div className="wer">
                        <div className="qax">
                            <p>Apexbrigde college</p>
                        </div>
                        <div className="qaz">
                            <p>948</p>
                            <p>64</p>
                            <p>Active</p>
                            <p>80%</p>
                        </div>
                    </div>

                    <hr />

                    <div className="wer">
                        <div className="qax">
                            <p>Greenfield Academy</p>
                        </div>
                        <div className="qaz">
                            <p>1024</p>
                            <p>72</p>
                            <p>Active</p>
                            <p>87%</p>
                        </div>
                    </div>

                    <hr />

                    <div className="wer">
                        <div className="qax">
                            <p>Riverdale Horizons</p>
                        </div>
                        <div className="qaz">
                            <p>874</p>
                            <p>56</p>
                            <p>Active</p>
                            <p>76%</p>
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

export default SuperAdminDashboard;
