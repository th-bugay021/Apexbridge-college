
import "./par.css";

function ParentLogin() {
  return (
    <div className="login-container">
      {/* <img src={Login} alt="" className="lgin"/> */}

      <h1 className="cent">Welcome back</h1>
      <p className="cent">Login to your account</p>

      <div className="contain">
        <a href="#" className="logo">
          <img
            src="/SELECTLOGIN/apexbridge-primary-logo.png"
            alt="Apexbridge Logo"
            height="150"
            width="400"
          />
        </a>

        <button className="btn1">Continue to Google</button>
        <div className="we">
          <hr className="line" />
          <p>OR</p>
          <hr className="line" />
        </div>

        <p>Email</p>
        <input
          type="email"
          name=""
          id=""
          minLength="10"
          maxLength="50"
          required
          placeholder="you@example.com"
        />

        <div className="passfor">
          <p>Password</p>
          <a href="http://" className="fp">Forgot password</a>
        </div>

        <input
          type="password"
          name=""
          id=""
          minLength="10"
          maxLength="50"
          required
          placeholder="* * * * * *"
        />

        <a href="/PARENTDASHBOARD/pdash.html">
          <button className="btn2">Login</button>
        </a>
      </div>

      <p className="cent">
        Don't have an account? <a href="/PARENT-LOGIN/par2.html">Create one</a>
      </p>
    </div>
  );
}

export default ParentLogin;
