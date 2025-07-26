// --- START OF FILE SettingsDrawer.jsx ---

// src/components/SettingsDrawer.jsx

import React from 'react';

function SettingsDrawer({
  settingsDrawerRef,
  timeInterval, setTimeInterval,
  printDefaultCards, setPrintDefaultCards,
  manualMode, setManualMode,
  audibleCaller, setAudibleCaller,
  selectedTheme, 
  setSelectedTheme, // This is handleThemeChange from App.jsx
  selectedDisplayLanguage,
  setSelectedDisplayLanguage, // This is handleDisplayLanguageChange from App.jsx
  selectedAudioLanguage,
  setSelectedAudioLanguage, // This is handleAudioLanguageChange from App.jsx
  closeDrawer
}) {

  // Function to reset settings
  const handleResetSettings = () => {
    console.log("Resetting settings...");
    // Reset all settings to their default values
    setTimeInterval(3);
    setPrintDefaultCards(false);
    setManualMode(false);
    setAudibleCaller(true);
    // Call the props correctly with the actual values
    setSelectedTheme('red'); // Assuming 'red' is your default custom theme
    setSelectedDisplayLanguage('English');
    setSelectedAudioLanguage('Amharic Male'); // Assuming 'Amharic Male' is default
  };

  // Prevent form submission which might reload page
  const handleSubmit = (e) => {
    e.preventDefault();
    // Added console log for explicit feedback
    console.log("Settings saved! Applying changes...", {
      timeInterval, printDefaultCards, manualMode, audibleCaller,
      selectedTheme, selectedDisplayLanguage, selectedAudioLanguage
    });
    // Implement actual save logic (e.g., API call, localStorage update)
    closeDrawer(); // Close drawer after saving
  };

  return (
    <div className="drawer drawer-end">
      {/* Hidden checkbox that controls the drawer visibility */}
      <input
        id="my-drawer-4"
        type="checkbox"
        className="drawer-toggle"
        ref={settingsDrawerRef}
      />
      {/* Drawer overlay: Clicking this closes the drawer */}
      <div className="drawer-content">
        {/* This is the content area of the main page, not part of the drawer itself */}
      </div>

      {/* Settings Panel (the actual drawer content) */}
      <div className="drawer-side z-50">
        <label
          htmlFor="my-drawer-4"
          aria-label="close sidebar"
          className="drawer-overlay"
        ></label>
        {/* MODIFIED: Replaced hardcoded gradient with DaisyUI's theme-aware classes */}
        {/* bg-base-200 is often a good choice for sidebars/drawers in DaisyUI */}
        <div className="menu min-h-full w-[25%] bg-base-200 text-base-content p-5"> 
          {/* Close button inside the drawer content */}
          <label
            htmlFor="my-drawer-4"
            aria-label="close sidebar"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-[4px] bg-transparent"
          >
            <svg
              stroke="currentColor"
              fill="currentColor"
              strokeWidth="0"
              viewBox="0 0 512 512"
              className="h-6 w-6" // Text color will come from parent 'text-base-content'
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M405 136.798L375.202 107 256 226.202 136.798 107 107 136.798 226.202 256 107 375.202 136.798 405 256 285.798 375.202 405 405 375.202 285.798 256z"></path>
            </svg>
          </label>
          <div className="mt-4">
            <form className="space-y-3" onSubmit={handleSubmit}>
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-bold uppercase text-base-content">
                  Settings
                </h1>
                <button
                  type="button"
                  className="btn h-auto rounded-[5px] border border-base-content/20 bg-transparent text-base-content shadow-sm hover:border-base-content/30"
                  onClick={handleResetSettings}
                >
                  Reset Setting
                </button>
              </div>
              <hr className="my-2 border-base-content/20" /> 
              <p className="my-2 text-base-content"> 
                Settings will be auto-saved when you close this panel.
              </p> 
              <h1 className="pt-4 text-lg font-bold uppercase text-base-content"> 
                General Settings
              </h1>
              <hr className="my-2 border-base-content/20" /> 
              <div className="w-full">
                <p className="mb-2 pt-2 text-base font-semibold text-base-content"> 
                  Interval Between Calls(sec)
                </p>
                <div className="flex h-12 w-full gap-x-1">
                  {/* Decrement Button */}
                  <button
                    type="button"
                    className="btn flex h-[46px] min-w-[48px] items-center justify-center rounded-[4px] border-2 border-base-content/20 shadow-sm text-base-content bg-base-100 hover:bg-base-300" 
                    onClick={() => setTimeInterval(prev => Math.max(0, prev - 1))}
                  >
                    <svg
                      stroke="currentColor"
                      fill="none"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-[25px] w-[25px]"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="8" y1="12" x2="16" y2="12"></line>
                    </svg>
                  </button>
                  {/* Time Interval Input */}
                  <div className="w-full">
                    <input
                      maxLength="255"
                      placeholder="Time"
                      className="input h-[46px] w-full rounded-md border border-base-content/20 bg-base-100 text-base-content placeholder:text-base-content/70 autofill:shadow-[inset_0_0_0px_1000px_rgb(0,0,0,0)] autofill:text-base-content" 
                      id="timeInterval"
                      type="number"
                      name="timeInterval"
                      value={timeInterval}
                      onChange={(e) => setTimeInterval(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  {/* Increment Button */}
                  <button
                    type="button"
                    className="btn flex h-[46px] min-w-[48px] items-center justify-center rounded-[4px] border-2 border-base-content/20 shadow-sm text-base-content bg-base-100 hover:bg-base-300" 
                    onClick={() => setTimeInterval(prev => prev + 1)}
                  >
                    <svg
                      stroke="currentColor"
                      fill="none"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-[25px] w-[25px]"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="16"></line>
                      <line x1="8" y1="12" x2="16" y2="12"></line>
                    </svg>
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {/* Toggle: Print Default Cards */}
                  <div className="flex h-[46px] items-center rounded-md bg-base-100 px-2"> 
                    <label className="flex w-full cursor-pointer items-center justify-between">
                      <h1 className="font-medium text-base-content"> 
                        Print Default Cards
                      </h1>
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="hidden" // Hide native checkbox
                          checked={printDefaultCards}
                          onChange={(e) => setPrintDefaultCards(e.target.checked)}
                        />
                        {/* Custom toggle visual */}
                        <div className={`toggle__line flex h-7 w-[51px] items-center rounded-full shadow-inner ${printDefaultCards ? 'bg-primary' : 'bg-gray-300'}`}> 
                          <div
                            className={`toggle__dot ml-1 h-[18px] w-[18px] rounded-full bg-white shadow transform ${
                              printDefaultCards ? 'translate-x-[22px]' : '' // Adjusted transform for visual consistency
                            }`}
                          ></div>
                        </div>
                      </div>
                    </label>
                  </div>
                  {/* Toggle: Manual Mode */}
                  <div className="flex h-[46px] items-center rounded-md bg-base-100 px-2"> 
                    <label className="flex w-full cursor-pointer items-center justify-between">
                      <h1 className="font-medium text-base-content"> 
                        Manual Mode
                      </h1>
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={manualMode}
                          onChange={(e) => setManualMode(e.target.checked)}
                        />
                        <div className={`toggle__line flex h-7 w-[51px] items-center rounded-full shadow-inner ${manualMode ? 'bg-primary' : 'bg-gray-300'}`}>
                          <div
                            className={`toggle__dot ml-1 h-[18px] w-[18px] rounded-full bg-white shadow transform ${
                              manualMode ? 'translate-x-[22px]' : ''
                            }`}
                          ></div>
                        </div>
                      </div>
                    </label>
                  </div>
                  {/* Toggle: Audible Caller */}
                  <div className="flex h-[46px] items-center rounded-md bg-base-100 px-2"> 
                    <label className="flex w-full cursor-pointer items-center justify-between">
                      <h1 className="font-medium text-base-content"> 
                        Audible Caller
                      </h1>
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={audibleCaller}
                          onChange={(e) => setAudibleCaller(e.target.checked)}
                        />
                        <div className={`toggle__line flex h-7 w-[51px] items-center rounded-full shadow-inner ${audibleCaller ? 'bg-primary' : 'bg-gray-300'}`}>
                          <div
                            className={`toggle__dot ml-1 h-[18px] w-[18px] rounded-full bg-white shadow transform ${
                              audibleCaller ? 'translate-x-[22px]' : ''
                            }`}
                          ></div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <h1 className="my-4 text-lg font-bold uppercase text-base-content"> 
                    Display
                  </h1>
                  <hr className="my-2 border-base-content/20" /> 
                  <p className="mb-2 mt-4 text-base font-semibold text-base-content"> 
                    Select Theme
                  </p>
                  <div className="min-w-[60%]">
                    {/* Using DaisyUI select component */}
                    <select
                      className="select select-bordered w-full bg-base-100 text-base-content" 
                      value={selectedTheme}
                      onChange={(e) => setSelectedTheme(e.target.value)} 
                    >
                      {/* Standard DaisyUI themes */}
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="cupcake">Cupcake</option>
                      <option value="bumblebee">Bumblebee</option>
                      <option value="emerald">Emerald</option>
                      <option value="corporate">Corporate</option>
                      <option value="synthwave">Synthwave</option>
                      <option value="retro">Retro</option>
                      <option value="cyberpunk">Cyberpunk</option>
                      <option value="valentine">Valentine</option>
                      <option value="halloween">Halloween</option>
                      <option value="garden">Garden</option>
                      <option value="forest">Forest</option>
                      <option value="aqua">Aqua</option>
                      <option value="lofi">Lofi</option>
                      <option value="pastel">Pastel</option>
                      <option value="fantasy">Fantasy</option>
                      <option value="wireframe">Wireframe</option>
                      <option value="black">Black</option>
                      <option value="luxury">Luxury</option>
                      <option value="dracula">Dracula</option>
                      <option value="cmyk">Cmyk</option>
                      <option value="autumn">Autumn</option>
                      <option value="business">Business</option>
                      <option value="acid">Acid</option>
                      <option value="lemonade">Lemonade</option>
                      <option value="night">Night</option>
                      <option value="coffee">Coffee</option>
                      <option value="winter">Winter</option>
                      <option value="dim">Dim</option>
                      <option value="nord">Nord</option>
                      <option value="sunset">Sunset</option>
                      {/* Your custom "red" theme */}
                      <option value="red">Dama Red</option> 
                    </select>
                  </div>

                  <p className="mb-2 mt-4 text-base font-semibold text-base-content"> 
                    Select Display Language
                  </p>
                  <div className="min-w-[60%]">
                    {/* Using DaisyUI select component */}
                    <select
                      className="select select-bordered w-full bg-base-100 text-base-content" 
                      value={selectedDisplayLanguage}
                      onChange={(e) => setSelectedDisplayLanguage(e.target.value)} 
                      disabled // As per original code, this was disabled
                    >
                      <option value="English">English</option>
                      {/* Add other languages if supported */}
                    </select>
                  </div>

                  <h1 className="my-4 text-lg font-bold uppercase text-base-content"> 
                    Audio
                  </h1>
                  <hr className="my-2 border-base-content/20" /> 
                  <p className="mb-2 mt-4 text-base font-semibold text-base-content"> 
                    Select Audio Language
                  </p>
                  <div className="min-w-[60%]">
                    {/* Using DaisyUI select component */}
                    <select
                      className="select select-bordered w-full bg-base-100 text-base-content" 
                      value={selectedAudioLanguage}
                      onChange={(e) => setSelectedAudioLanguage(e.target.value)} 
                    >
                      {/* ADDED all requested language options */}
                      <option value="Amharic Male">Amharic (Male)</option>
                      <option value="Amharic Female">Amharic (Female)</option>
                      <option value="Afaan Oromoo Male">Afaan Oromoo (Male)</option>
                      <option value="Afaan Oromoo Female">Afaan Oromoo (Female)</option>
                      <option value="Tigrinya Male">Tigrinya (Male)</option>
                      <option value="Tigrinya Female">Tigrinya (Female)</option>
                      <option value="English Male">English (Male)</option>
                      <option value="English Female">English (Female)</option>
                    </select>
                  </div>
                  <div className="mt-4 flex w-full items-start justify-center">
                    <button
                      type="submit"
                      className="btn h-[52px] w-[40%] rounded-[8px] border-base-content/20 bg-base-content/20 text-base-content font-semibold hover:bg-base-content/30" 
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsDrawer;