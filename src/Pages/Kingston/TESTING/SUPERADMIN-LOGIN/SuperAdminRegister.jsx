
import "./spm.css";

function SuperAdminRegister() {
    return (
        <div className="login-container">
            {/* <img src={Login} alt="" className="lgin"/> */}

            <h1 className="cent">Welcome to Apexbrigde College</h1>
            <p className="cent">Create an account to continue</p>

            <div className="contain">

                <a href="#" className="logo">
                    <img
                        src="/SELECTLOGIN/apexbridge-primary-logo.png"
                        alt="Apexbridge Logo"
                        height="150px"
                        width="400px"
                    />
                </a>

                <button className="btn1">Continue to Google</button>
                <div className="we">
                    <hr className="line" />
                    <p>OR</p>
                    <hr className="line" />
                </div>

                <p>Fullname</p>
                <input
                    type="text"
                    minLength="4"
                    maxLength="50"
                    required
                    placeholder="enter your fullname"
                />

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

                <p>Password</p>
                <input
                    type="password"
                    name=""
                    id=""
                    minLength="10"
                    maxLength="50"
                    required
                    placeholder="* * * * * *"
                />

                <a href="/SUPERADMINDASHBOARD/spdash.html">
                    <button className="btn2">Register</button>
                </a>
            </div>

            <p className="cent">
                Already have an account?{" "}
                <a href="/SUPERADMIN-LOGIN/spm.html">Login</a>
            </p>
        </div>
    );
}

export default SuperAdminRegister;
