// src/components/Login.jsx
import React, { useState } from "react";
import { supabase } from "../utils/supabase.jsx";
import config from "../config.js";

const Login = ({ setView }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const response = await fetch(`${config.apiBaseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.detail || "Invalid credentials.");
    } else {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      if (sessionError) {
        setError("Failed to set session.");
      }
    }
  };

  return (
    <div className="w-full max-w-md">
      <h2 className="text-3xl font-bold text-center text-white mb-6">
        Welcome Back
      </h2>
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 bg-[#1a1f2e] text-white border-2 border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] focus:border-[#FF5733]"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-3 bg-[#1a1f2e] text-white border-2 border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] focus:border-[#FF5733]"
        />
        <button
          type="submit"
          className="w-full bg-[#FF5733] text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition duration-300"
        >
          Log In
        </button>
      </form>
      {error && <p className="mt-4 text-center text-red-500">{error}</p>}
      <p className="mt-6 text-center text-[#9ca3af]">
        Don't have an account?{" "}
        <button
          onClick={() => setView("signup")}
          className="text-[#FF5733] hover:underline font-semibold"
        >
          Sign Up
        </button>
      </p>
    </div>
  );
};

export default Login;
