import React from 'react';
import DamaLogo from '../assets/Dama_logo-691efcc9.webp'; // Adjust path if necessary

function Navbar({ onOpenReports, onOpenSettings, onOpenLogout,currentUsername }) {
  return (
    <div className="flex h-[7vh] items-center justify-between bg-[#FFFFFF33] px-5 shadow-md">
      <div className="flex items-center">
        <img
          src={DamaLogo}
          className="mr-3 h-12 w-[130px] object-cover object-top"
          alt="ያገር - ልጅ Logo"
        />
        <p className="text-base text-white">{currentUsername ? `Welcome, ${currentUsername}` : 'ያገር - ልጅ'}</p>
      </div>
      <div className="flex gap-7">
        {/* Reports Button */}
        <button
          className="btn border-2 border-[#FFFFFF33] bg-transparent text-sm font-medium text-white shadow-sm"
          onClick={onOpenReports} // MODIFIED: Now calls openReportsModal from App.jsx
        >
          <p className="mr-2">Reports </p>
          <svg
            stroke="currentColor"
            fill="currentColor"
            strokeWidth="0"
            viewBox="0 0 24 24"
            className="h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path fill="none" d="M0 0h24v24H0z"></path>
            <path d="M7 3H4v3H2V1h5v2zm15 3V1h-5v2h3v3h2zM7 21H4v-3H2v5h5v-2zm13-3v3h-3v2h5v-5h-2zm-1 0c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2v12zM15 8H9v2h6V8zm0 3H9v2h6v-2zm0 3H9v2h6v-2z"></path>
          </svg>
        </button>

        {/* Settings Button - Toggles Drawer */}
        <label
          htmlFor="my-drawer-4" // This ID must match the drawer's hidden checkbox ID
          className="btn border border-[#FFFFFF33] bg-transparent text-sm font-medium text-white shadow-sm cursor-pointer"
          
        >
          <p className="mr-2 text-white">Setting</p>
          <svg
            stroke="currentColor"
            fill="currentColor"
            strokeWidth="0"
            viewBox="0 0 512 512"
            className="h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M256 176a80 80 0 1080 80 80.24 80.24 0 00-80-80zm172.72 80a165.53 165.53 0 01-1.64 22.34l48.69 38.12a11.59 11.59 0 012.63 14.78l-46.06 79.52a11.64 11.64 0 01-14.14 4.93l-57.25-23a176.56 176.56 0 01-38.82 22.67l-8.56 60.78a11.93 11.93 0 01-11.51 9.86h-92.12a12 12 0 01-11.51-9.53l-8.56-60.78A169.3 169.3 0 01151.05 393L93.8 416a11.64 11.64 0 01-14.14-4.92L33.6 331.57a11.59 11.59 0 012.63-14.78l48.69-38.12A174.58 174.58 0 0183.28 256a165.53 165.53 0 011.64 22.66z"></path>
          </svg>
        </label>

        {/* Logout Button */}
        <button
          className="btn border border-[#FFFFFF33] bg-transparent text-sm font-medium text-white shadow-sm"
          onClick={onOpenLogout} // Triggers LogoutModal
        >
          <p className="mr-2 text-white">Logout</p>
          <svg
            stroke="currentColor"
            fill="currentColor"
            strokeWidth="0"
            viewBox="0 0 512 512"
            className="h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M312 372c-7.7 0-14 6.3-14 14 0 9.9-8.1 18-18 18H94c-9.9 0-18-8.1-18-18V126c0-9.9 8.1-18 18-18h186c9.9 0 18 8.1 18 18 0 7.7 6.3 14 14 14s14-6.3 14-14c0-25.4-20.6-46-46-46H94c-25.4 0-46 20.6-46 46v260c0 25.4 20.6 46 46 46h186c25.4 0 46-20.6 46-46 0-7.7-6.3-14-14-14z"></path>
            <path d="M372.9 158.1c-2.6-2.6-6.1-4.1-9.9-4.1-3.7 0-7.3 1.4-9.9 4.1-5.5 5.5-5.5 14.3 0 19.8l65.2 64.2H162c-7.7 0-14 6.3-14 14s6.3 14 14 14h256.6L355 334.2c-5.4 5.4-5.4 14.3 0 19.8l.1.1c2.7 2.5 6.2 3.9 9.8 3.9 3.8 0 7.3-1.4 9.9-4.1l82.6-82.4c4.3-4.3 6.5-9.3 6.5-14.7 0-5.3-2.3-10.3-6.5-14.5l-84.5-84.2z"></path>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default Navbar;