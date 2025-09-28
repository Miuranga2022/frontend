import { useState } from "react";
import { FaLock, FaUser } from "react-icons/fa";

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const ALLOWED_USERNAME = "admin";
  const ALLOWED_PASSWORD = "123456";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === ALLOWED_USERNAME && password === ALLOWED_PASSWORD) {
      localStorage.setItem("username", username);
      localStorage.setItem("password", password);
      onLogin();
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-gradient-to-r from-black via-gray-900 to-black">
      {/* Background decorative gold particles */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="w-[200%] h-[200%] absolute top-0 left-0 bg-[url('/gold-pattern.png')] bg-repeat opacity-10 animate-spin-slow"></div>
      </div>

      <div className="relative z-10 w-full max-w-md p-10 bg-black/70 backdrop-blur-md rounded-3xl shadow-2xl border border-yellow-500">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-5xl font-extrabold text-yellow-400 mb-1 text-center tracking-widest">
            New Kumara
          </h1>
          <p className="text-md text-yellow-300 uppercase tracking-wide">Curtain House</p>
        </div>

        {error && <p className="text-red-500 text-center mb-4 animate-pulse">{error}</p>}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center bg-gray-800/60 border border-yellow-400 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-yellow-400 transition-all duration-300">
            <FaUser className="text-yellow-400 mr-3" />
            <input
              type="text"
              placeholder="Username"
              className="w-full bg-transparent outline-none text-white placeholder-yellow-300 font-medium"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center bg-gray-800/60 border border-yellow-400 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-yellow-400 transition-all duration-300">
            <FaLock className="text-yellow-400 mr-3" />
            <input
              type="password"
              placeholder="Password"
              className="w-full bg-transparent outline-none text-white placeholder-yellow-300 font-medium"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold rounded-xl shadow-lg hover:scale-105 transition-transform duration-300"
          >
            Login
          </button>
        </form>

        <p className="mt-8 text-xs text-center text-yellow-300">
          © 2025 New Kumara Curtain House. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;
