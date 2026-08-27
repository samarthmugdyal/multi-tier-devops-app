import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const API = "/api";

function App() {
  const [page, setPage] = useState(
    localStorage.getItem("userId") ? "dashboard" : "login"
  );
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(
    Boolean(localStorage.getItem("userId"))
  );

  useEffect(() => {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      setLoading(false);
      return;
    }

    fetch(`${API}/me`, {
      headers: {
        Authorization: `Bearer ${userId}`
      }
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Session expired");
        }

        return data;
      })
      .then((data) => {
        setUser(data);
        setPage("dashboard");
      })
      .catch(() => {
        localStorage.removeItem("userId");
        setPage("login");
      })
      .finally(() => setLoading(false));
  }, []);

  function logout() {
    localStorage.removeItem("userId");
    setUser(null);
    setPage("login");
  }

  if (loading) {
    return <div className="loading">Checking session...</div>;
  }

  if (page === "dashboard" && user) {
    return <Dashboard user={user} onLogout={logout} />;
  }

  if (page === "register") {
    return (
      <Register
        onLogin={() => setPage("login")}
      />
    );
  }

  return (
    <Login
      onRegister={() => setPage("register")}
      onSuccess={(loggedInUser) => {
        setUser(loggedInUser);
        setPage("dashboard");
      }}
    />
  );
}

function Login({ onRegister, onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event) {
    event.preventDefault();
    setMessage("");

    try {
      const response = await fetch(`${API}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      localStorage.setItem("userId", data.token);
      onSuccess(data.user);

    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <AuthCard title="Login">
      <form onSubmit={submit}>
        <label>Email</label>
        <input
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <label>Password</label>
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <button type="submit">Login</button>
      </form>

      {message && <div className="error">{message}</div>}

      <p className="switch">
        New user?
        <button className="link" onClick={onRegister}>
          Create Account
        </button>
      </p>
    </AuthCard>
  );
}

function Register({ onLogin }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  function updateField(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  }

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    setSuccess(false);

    try {
      const response = await fetch(`${API}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setSuccess(true);
      setMessage("Registration successful. You can now login.");
      setForm({
        name: "",
        email: "",
        password: ""
      });

    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <AuthCard title="Create Account">
      <form onSubmit={submit}>
        <label>Full Name</label>
        <input
          name="name"
          placeholder="Enter full name"
          value={form.name}
          onChange={updateField}
          required
        />

        <label>Email</label>
        <input
          name="email"
          type="email"
          placeholder="Enter email"
          value={form.email}
          onChange={updateField}
          required
        />

        <label>Password</label>
        <input
          name="password"
          type="password"
          placeholder="Minimum 6 characters"
          value={form.password}
          onChange={updateField}
          minLength="6"
          required
        />

        <button type="submit">Register</button>
      </form>

      {message && (
        <div className={success ? "success" : "error"}>
          {message}
        </div>
      )}

      <p className="switch">
        Already have an account?
        <button className="link" onClick={onLogin}>
          Login
        </button>
      </p>
    </AuthCard>
  );
}

function AuthCard({ title, children }) {
  return (
    <main className="page">
      <section className="card">
        <div className="logo">3-TIER APP</div>
        <h1>{title}</h1>
        {children}
      </section>
    </main>
  );
}

function Dashboard({ user, onLogout }) {
  return (
    <main className="page">
      <section className="dashboard">
        <header className="topbar">
          <div>
            <div className="logo">3-TIER APP</div>
            <h1>Dashboard</h1>
          </div>

          <button onClick={onLogout}>
            Logout
          </button>
        </header>

        <section className="welcome">
          <h2>Hello, {user.name} 👋</h2>
          <p>You are successfully authenticated.</p>
        </section>

        <section className="profile">
          <h3>User Profile</h3>

          <div className="row">
            <span>User ID</span>
            <strong>{user.id}</strong>
          </div>

          <div className="row">
            <span>Name</span>
            <strong>{user.name}</strong>
          </div>

          <div className="row">
            <span>Email</span>
            <strong>{user.email}</strong>
          </div>

          <div className="row">
            <span>Registered</span>
            <strong>
              {new Date(user.created_at).toLocaleString()}
            </strong>
          </div>
        </section>
      </section>
    </main>
  );
}

createRoot(
  document.getElementById("root")
).render(<App />);