import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './App.css'; // Your cleaned-up Tailwind CSS file
import 'react-toastify/dist/ReactToastify.css'; // <-- Correct place for React Toastify CSS

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);