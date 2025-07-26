// --- START OF FILE RegisterPage.jsx ---
// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import DamaLogo from '../assets/Dama_logo-691efcc9.svg';
import Swal from 'sweetalert2'

function RegisterPage({ onRegister, onSwitchToLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [initialBalance, setInitialBalance] = useState(''); // Use string for input flexibility

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username && password && initialBalance !== '') {
      onRegister(username, password, Number(initialBalance)); // Convert balance to number
    } else {
      Swal.fire({
  title: "Please fill in all fields.",
  text: "It is mandatory",
  icon: "error"
});
    }
  };

  return (
    // MODIFIED: Use bg-base-100 for theme-aware background
    <div className="min-h-screen flex items-center justify-center bg-base-100 text-base-content"> 
      {/* MODIFIED: Use bg-base-200 for modal background, rounded-xl for consistency */}
      <div className="bg-base-200 p-8 rounded-xl shadow-lg max-w-md w-full">
        <div className="flex justify-center mb-6">
          <img src={DamaLogo} alt="Dama Logo" className="h-16" />
        </div>
        <h2 className="text-3xl font-bold text-base-content text-center mb-8">Register New User</h2> {/* MODIFIED text-base-content */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="reg-username" className="block text-base-content text-sm font-bold mb-2"> {/* MODIFIED text-base-content */}
              User Name
            </label>
            <input
              type="text"
              id="reg-username"
              className="input input-bordered w-full bg-base-100 text-base-content placeholder:text-base-content/70" // MODIFIED for theming
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="reg-password" className="block text-base-content text-sm font-bold mb-2"> {/* MODIFIED text-base-content */}
              Password
            </label>
            <input
              type="password"
              id="reg-password"
              className="input input-bordered w-full bg-base-100 text-base-content placeholder:text-base-content/70" // MODIFIED for theming
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="initial-balance" className="block text-base-content text-sm font-bold mb-2"> {/* MODIFIED text-base-content */}
              Initial Balance (ETB)
            </label>
            <input
              type="number"
              id="initial-balance"
              className="input input-bordered w-full bg-base-100 text-base-content placeholder:text-base-content/70" // MODIFIED for theming
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              min="0" // Ensure non-negative
              required
            />
          </div>
          <div className="flex items-center justify-center mb-4">
            <button
              type="submit"
              className="btn btn-primary w-full" // DaisyUI primary button styles
            >
              Register
            </button>
          </div>
        </form>
        <p className="text-center text-base-content text-sm mt-4"> {/* MODIFIED text-base-content */}
          Already have an account?{' '}
          <button onClick={onSwitchToLogin} className="link link-hover text-info"> {/* MODIFIED text-info for theming */}
            Login here
          </button>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;