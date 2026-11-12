
import "./tdash.css";
import { SHOW_SAMPLE_DATA_LABELS } from "../../../../config/sampleDataLabels";

function TeacherAnnouncements() {
    return (
        <>
            <nav>
                <a href="">
                    <img src="/TEACHERDASHBOARD/apexbridge-primary-logo.png" alt="" height="50px" />
                </a>
                <div className="navlinks">
                    <a href="/TEACHERDASHBOARD/tdash.html" className="slink">Overview</a>
                    <a href="/TEACHERDASHBOARD/tannoun.html" className="slink">Announcements</a>
                    <a href="/TEACHERDASHBOARD/tmess.html" className="slink">Messages</a>
                    <a href="/TEACHERDASHBOARD/tevc.html" className="slink">Events calendar</a>
                </div>

                <a href="/SELECTLOGIN/select.html" className="sout">Sign out</a>
            </nav>

            <main className="annm">
                <p>SCHOOL COMMUNICATION</p>
                <div className="wdv">
                    <p>Announcements</p>
                    <button>New announcements</button>
                </div>
                <p>The latest updates for your school community.</p>
                <input type="search" name="" id="" placeholder="Search announcements..." />

                <div className="anb">
                    <div className="yui">
                        <p>Everyone</p>
                        <p>Oct 1, 2026</p>
                        <p></p>
                    </div>

                    <p>Welcome to a new school term</p>
                    <p>{SHOW_SAMPLE_DATA_LABELS && "Sample announcement · "}Welcome back to Greenfield Academy. We look forward to a term filled with learning, growth, and new opportunities.</p>
                </div>

                <div className="anb">
                    <div className="yui">
                        <p>Parent</p>
                        <p>Oct 1, 2026</p>
                    </div>

                    <p>Parent–teacher conference</p>
                    <p>{SHOW_SAMPLE_DATA_LABELS && "Sample announcement · "}Join us on 9 October to meet your child's teachers and discuss their progress.</p>
                </div>

                <footer>
                    <p>Apexbridge College · Made for better school days</p>
                </footer>
            </main>
        </>
    );
}

export default TeacherAnnouncements;
