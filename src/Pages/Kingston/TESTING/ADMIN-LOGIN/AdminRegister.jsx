
import "./AdminLogin.css";

function AdminRegister() {
  return (
    <div className="login-container">
      <h1 className="cent">Welcome to Apexbrigde College</h1>
      <p className="cent">Create an account to continue</p>

      <div className="contain">
        <a href="#" className="logo">
          <img
            src="/SELECTLOGIN/apexbridge-primary-logo.png"
            alt="Apexbridge Logo"
            height="150"
            width="400"
          />
        </a>

        <button type="button" className="btn1">
          Continue to Google
        </button>

        <div className="we">
          <hr className="line" />
          <p>OR</p>
          <hr className="line" />
        </div>

        <p>Fullname</p>
        <input
          type="text"
          name="fullname"
          minLength={4}
          maxLength={50}
          required
          placeholder="enter your fullname"
        />

        <p>Email</p>
        <input
          type="email"
          name="email"
          minLength={10}
          maxLength={50}
          required
          placeholder="you@example.com"
        />

        <p>Password</p>
        <input
          type="password"
          name="password"
          minLength={10}
          maxLength={50}
          required
          placeholder="* * * * * *"
        />

        <a href="/ADMINDASHBOARD/dash.html">
          <button type="button" className="btn2">
            Register
          </button>
        </a>
      </div>

      <p className="cent">
        Already have an account?{" "}
        <a href="/ADMIN-LOGIN/adm.html">Login</a>
      </p>
    </div>
  );
}

export default AdminRegister;
