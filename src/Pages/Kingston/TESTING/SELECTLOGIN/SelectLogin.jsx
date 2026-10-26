
import "./select.css";

function SelectLogin() {
  return (
    <main className="contain">
      <a href="#" className="logo">
        <img
          src="/SELECTLOGIN/apexbridge-primary-logo.png"
          alt="Apexbridge Logo"
        />
      </a>

      <h2>Welcome to Apexbridge</h2>
      <p className="subtitle">Select your respective sign-in option</p>

      <div className="inot">
        <div className="rfc">
          <button
            className="bnn"
            onClick={(event) => toggleDropdown("loginDropdown", event.currentTarget)}
          >
            Login as <span className="downsp">▼</span>
          </button>

          <div id="loginDropdown" className="dropdown">
            <a href="/ADMIN-LOGIN/adm.html">Admin</a>
            <a href="/TEACHER-LOGIN/tea.html">Teacher</a>
            <a href="/STUDENT-LOGIN/stu.html">Student</a>
            <a href="/PARENT-LOGIN/par.html">Parent</a>
            <a href="/ACCOUNTANT-LOGIN/acctl.html">Accountant</a>
            <a href="/SUPERADMIN-LOGIN/spm.html">Super Admin</a>
          </div>
        </div>

        <div className="rfc">
          <button
            className="bnn"
            onClick={(event) => toggleDropdown("registerDropdown", event.currentTarget)}
          >
            Register as <span className="downsp">▼</span>
          </button>

          <div id="registerDropdown" className="dropdown">
            <a href="/ADMIN-LOGIN/adm2.html">Admin</a>
            <a href="/TEACHER-LOGIN/tea2.html">Teacher</a>
            <a href="/STUDENT-LOGIN/stu2.html">Student</a>
            <a href="/PARENT-LOGIN/par2.html">Parent</a>
            <a href="/ACCOUNTANT-LOGIN/acctl2.html">Accountant</a>
            <a href="/SUPERADMIN-LOGIN/spm2.html">Super Admin</a>
          </div>
        </div>
      </div>
    </main>
  );
}

export default SelectLogin;
