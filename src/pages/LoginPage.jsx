// --- START OF FILE LoginPage.jsx ---
import React, { useState } from 'react';
import DamaLogo from '../assets/Dama_logo-691efcc9.svg'; // Adjust path if logo is elsewhere

function LoginPage({ onLogin, onSwitchToRegister }) { // Added onSwitchToRegister prop
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(username, password); // Call the onLogin function passed from App.jsx
  };

  return (
    // MODIFIED: Use bg-base-100 for theme-aware background
    <div className="min-h-screen flex items-center justify-center bg-base-100 text-base-content"> 
      {/* MODIFIED: Use bg-base-200 for modal background, rounded-xl for consistency */}
      <div className="bg-base-200 p-8 rounded-xl shadow-lg max-w-md w-full"> 
        <div className="flex justify-center mb-6">
          <img src={DamaLogo} alt="Dama Logo" className="h-16" />
        </div>
        <h2 className="text-3xl font-bold text-base-content text-center mb-8">Log In</h2> {/* MODIFIED text-base-content */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-base-content text-sm font-bold mb-2"> {/* MODIFIED text-base-content */}
              User Name
            </label>
            <input
              type="text"
              id="username"
              className="input input-bordered w-full bg-base-100 text-base-content placeholder:text-base-content/70" // DaisyUI input styles, MODIFIED for theming
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-base-content text-sm font-bold mb-2"> {/* MODIFIED text-base-content */}
              Password
            </label>
            <input
              type="password"
              id="password"
              className="input input-bordered w-full bg-base-100 text-base-content placeholder:text-base-content/70 mb-3" // DaisyUI input styles, MODIFIED for theming
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="mb-6 flex items-center">
            <input type="checkbox" id="remember" className="checkbox mr-2" /> {/* DaisyUI checkbox */}
            <label htmlFor="remember" className="text-base-content text-sm">Remember me</label> {/* MODIFIED text-base-content */}
          </div>
          <div className="flex items-center justify-center">
            <button
              type="submit"
              className="btn btn-primary w-full" // DaisyUI primary button styles
            >
              Login
            </button>
          </div>
        </form>
        {/* ADDED: Register link, assuming it exists somewhere */}
        <p className="text-center text-base-content text-sm mt-4">
          Don't have an account?{' '}
          <button onClick={onSwitchToRegister} className="link link-hover text-info">
            Register here
          </button>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;