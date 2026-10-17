// eslint-disable-next-line no-unused-vars
import React, { useState } from "react";
import { useAuth } from "../../../Context/AuthContext";
import { useNavigate } from "react-router-dom";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    login({
      id: 1,
      name: "Test Admin",
      email,
      role: "ADMIN",
    });

    navigate("/dashboard");
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Login</h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />

      <button type="submit">
        Login
      </button>
    </form>
  );
}

export default Login;